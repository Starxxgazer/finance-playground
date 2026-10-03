#!/usr/bin/env python3
"""Deploy an isolated build, or atomically restore the previous release."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
import uuid

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = Path.home() / '.config/finance-playground/deploy.json'
CONFIG = json.loads(CONFIG_PATH.read_text()) if CONFIG_PATH.is_file() else {}
SERVER = os.environ.get('GAME_SSH_HOST') or CONFIG.get('ssh_host', '')
REMOTE = '/srv/zhangmianzhixia'
SITE = 'https://zhangmianzhixia.com'
KEY = Path(os.environ.get('GAME_SSH_KEY') or CONFIG.get('ssh_key', '~/.ssh/game-deploy')).expanduser()
SSH = ['ssh', '-i', str(KEY), '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes',
       '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=15']

def run(args, **kw):
    return subprocess.run(args, check=True, text=True, **kw)

def remote(script, *args):
    return run([*SSH, SERVER, shlex.join(['bash', '-s', '--', *args])], input=script)

SWITCH = r'''
set -euo pipefail
cd /srv/zhangmianzhixia
exec 9>.deploy.lock
flock -x 9
mode=$1
release=$2
if [ "$mode" = rollback ]; then
    target=$(readlink previous)
else
    target="releases/$release"
fi
[[ "$target" =~ ^releases/[0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}$ ]]
test -s "$target/index.html"
(cd "$target" && sha256sum --quiet -c SHA256SUMS)
old=$(readlink current || true)
ln -s "$target" .next
mv -Tf .next current
if ! curl -fsSL --max-time 20 --resolve zhangmianzhixia.com:80:127.0.0.1 --resolve zhangmianzhixia.com:443:127.0.0.1 http://zhangmianzhixia.com/ | cmp - current/index.html; then
    if [ -n "$old" ]; then ln -s "$old" .restore; mv -Tf .restore current; else unlink current; fi
    exit 1
fi
if [ -n "$old" ]; then
    ln -s "$old" .previous-next
    mv -Tf .previous-next previous
fi
printf 'Active release: %s\n' "$target"
'''

def deploy():
    revision = run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True).stdout.strip()
    if run(['git', 'status', '--porcelain'], cwd=ROOT, capture_output=True).stdout:
        raise SystemExit('发布前请提交全部游戏和说明改动，并从合并后的 main 干净克隆发布。')
    release = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid.uuid4().hex[:8]
    # Build a snapshot so packaging never rewrites the working offline launcher.
    with tempfile.TemporaryDirectory(prefix='finance-release-') as tmp:
        snapshot = Path(tmp)
        for name in ['src', 'public', 'scripts']:
            shutil.copytree(ROOT/name, snapshot/name)
        for name in ['package.json', 'package-lock.json', 'index.html', 'vite.config.js']:
            shutil.copy2(ROOT/name, snapshot/name)
        if (ROOT/'node_modules').is_dir():
            (snapshot/'node_modules').symlink_to((ROOT/'node_modules').resolve(), target_is_directory=True)
        else:
            run(['npm', 'ci'], cwd=snapshot)
        run(['npm', 'run', 'build'], cwd=snapshot)
        dist = snapshot/'dist'
        # Version every resource; existing players retain the resources they started with.
        html = (dist/'index.html').read_text()
        base = f'/releases/{release}/'
        html = html.replace('./', base)
        html = html.replace('<head>', f'<head>\n<script>window.__GAME_ASSET_BASE__="{base}";</script>', 1)
        (dist/'index.html').write_text(html)
        (dist/'release.json').write_text(json.dumps({
            'release': release, 'commit': revision,
            'repository': 'https://github.com/Starxxgazer/finance-playground',
            'built_at': datetime.now(timezone.utc).isoformat(),
        }, indent=2) + '\n')
        allowed = re.compile(r'(index\.html|release\.json|assets/[\w.-]+\.(js|css)|(?:scenes|characters|items|ui)/[a-z0-9-]+\.webp|videos/[a-z0-9-]+\.(mp4|webp)|audio/(?:[a-z0-9-]+\.mp3|music-credits\.txt)|fonts/ui/[\w.-]+\.(woff2|txt))')
        sums = []
        for file in sorted(dist.rglob('*')):
            if file.is_symlink():
                raise RuntimeError(f'Symlink in deployment: {file}')
            if not file.is_file():
                continue
            name = file.relative_to(dist).as_posix()
            if not allowed.fullmatch(name):
                raise RuntimeError(f'Unexpected public file: {name}')
            sums.append(f'{hashlib.sha256(file.read_bytes()).hexdigest()}  {name}\n')
        (dist/'SHA256SUMS').write_text(''.join(sums))
        remote('set -eu\nmkdir -p /srv/zhangmianzhixia/releases\nmkdir "/srv/zhangmianzhixia/releases/$1"\n', release)
        run(['rsync', '-rcz', '--chmod=D755,F644', f'--link-dest={REMOTE}/current', '-e', shlex.join(SSH), str(dist)+'/', f'{SERVER}:{REMOTE}/releases/{release}/'])
        remote(SWITCH, 'deploy', release)
    print(f'已更新 {SITE}，版本 {release}；旧版本保留，可用 rollback 回退。')

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('action', choices=['deploy', 'rollback', 'status'], nargs='?', default='deploy')
args = parser.parse_args()
if not re.fullmatch(r'[A-Za-z0-9_.-]+@[A-Za-z0-9.-]+', SERVER):
    parser.error('Set GAME_SSH_HOST=user@hostname or ssh_host in the external deployment config')
if not KEY.is_file():
    parser.error(f'SSH key missing: {KEY}; set GAME_SSH_KEY to an external key file')
if args.action == 'deploy':
    deploy()
elif args.action == 'rollback':
    remote(SWITCH, 'rollback', '-')
else:
    remote('set -eu\ncd /srv/zhangmianzhixia\nls -ld current previous 2>/dev/null || true\ndu -sh releases\n')
