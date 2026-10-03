# 部署与后续更新

线上入口：https://zhangmianzhixia.com

源码仓库：https://github.com/Starxxgazer/finance-playground

本项目持续迭代。负责人后续说“更新”时，默认同时更新 **GitHub `main` 和线上游戏**；这次参赛提交不是最终冻结版。

## 双端更新流程

1. 检查工作区并保留其他人的修改，从最新 `origin/main` 建立隔离工作分支，整理本次游戏、素材与说明。
2. 在同一份快照上完成本地规则、浏览器与离线完整流程检查，重新生成 `开始游戏.html`；检查实际暂存文件，不上传密钥或私人材料。
3. 通过 PR 审查并合并到 `main`。不得强制推送或改写共享历史。
4. 从合并后的 `main` 获取干净克隆，安装锁定依赖，再执行部署脚本。
5. 检查 HTTPS 首页、媒体播放及电脑/手机流程，并比较网站 `/release.json` 的 `commit` 与 GitHub `main`。记录提交、发布版本和测试限制。

部署故障时保留 GitHub 已合并提交，恢复线上旧版本并明确记录暂时不一致，再修复发布。不要为了假装两端一致而重写 Git 历史。

## 发布工具

`scripts/deploy-game.py` 由维护者在 Linux、macOS 或 Windows WSL 中执行，依赖 Python 3、Node.js/npm、OpenSSH 与 rsync；目标服务器已配置 Nginx、HTTPS、curl、sha256sum 和 flock。

发布必须从干净的 Git 工作区执行。配置只保存在仓库外，可设置环境变量：

```bash
export GAME_SSH_HOST='部署用户@服务器地址'
export GAME_SSH_KEY='/仓库外的/私钥路径'
python3 scripts/deploy-game.py deploy
python3 scripts/deploy-game.py status
python3 scripts/deploy-game.py rollback
```

也可在本机 `~/.config/finance-playground/deploy.json` 保存以下配置，值由服务器维护者填写：

```json
{
  "ssh_host": "部署用户@服务器地址",
  "ssh_key": "/仓库外的/私钥路径"
}
```

环境变量优先于本地配置。私钥权限应为 `600`；首次连接须先通过可信渠道核对服务器 SSH 主机指纹并加入 `known_hosts`。脚本保持严格主机验证，不自动接受陌生主机。普通玩家与评审无需服务器权限，也无需执行部署脚本。

脚本仅维护本项目已初始化的 `/srv/zhangmianzhixia/` 站点，不负责申请新服务器或初始化其他域名。通用静态网站部署见[运行说明](运行说明.md)。

## 版本与回滚

脚本在临时目录构建，校验输出文件白名单和 SHA-256 后上传独立版本目录，再原子切换 `current`。网站访问检查失败会恢复旧入口；`previous` 保存上一个成功发布版本，`rollback` 可切回。首次发布没有上一版可回滚。

页面资源使用带版本号的地址，避免更新时正在游玩的旧页面请求到新版素材。旧版本不自动删除；管理员应定期用 `status` 检查磁盘，清理前确认版本未被 `current` 或 `previous` 引用，并考虑仍打开的旧页面。首页不缓存，刷新后加载新版本。

`/release.json` 公开记录发布版本与源码提交，不含服务器登录信息或密钥。数据库迁移不适用于当前版本：进度在玩家浏览器内，跨版本存档兼容仍需核对游戏状态逻辑。

## 发布边界

- 仅上传构建成品到网站；源码、README 和运行说明放在 GitHub。
- 不上传私钥、Token、`.env`、私人交接材料、赛事官方手册或附件；`.gitignore` 不能代替实际暂存检查。
- 字体、音乐署名和许可说明随素材保留；不擅自给整个项目增加许可证。
- 不通过删除断言、改写预期或绕过状态机来让检查通过。
- 不覆盖其他站点配置，不改变 SSH 登录安全规则，不删除当前或回滚目标版本。
- 发布记录保留失败、复测和已知风险；不同快照与多次复测不能写成一次全量通过。
