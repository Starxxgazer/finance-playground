"""检查 Git 纳入版本管理的文件；不把文档检查当作游戏验收。"""
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
tracked = subprocess.check_output(
    ["git", "ls-files", "-z"], cwd=ROOT
).decode("utf-8").split("\0")
files = [Path(name) for name in tracked if name]
errors = []
excluded = {"node_modules", "test-results", "playwright-report", "官方比赛资料"}

for relative in files:
    path = ROOT / relative
    if not path.is_file():
        errors.append(f"纳入版本管理的文件不存在：{relative}")
        continue
    if excluded.intersection(relative.parts) or relative.name == ".env":
        errors.append(f"不应纳入版本管理：{relative}")
    if relative.suffix != ".md":
        continue
    for target in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", path.read_text(encoding="utf-8")):
        target = target.strip().strip("<>")
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        destination = path.parent / unquote(parsed.path)
        if not destination.exists():
            errors.append(f"本地文档链接不存在：{relative} → {target}")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"仓库检查通过：{len(files)} 个文件；本地文档链接有效。")
