# Finance Playground · 玩转金融

通过游戏帮助普通人理解金融。当前正在确定游戏形式、推进流程和故事格式。

当前游戏设计见根目录[游戏设计](游戏设计.md)。按用户要求，只保留这一份游戏设计稿；旧稿、设计附件和审核记录已清理。

仓库：<https://github.com/Starxxgazer/finance-playground>

## 分工

- Starxxgazer：程序、内容格式、数值模型与最终合并。
- 372785716aa-star、1845452331-cell：共同设计故事。
- 会使用 Codex 的队友按约定格式整理内容；待新游戏可运行后，两位队友本地试玩，再通过工作分支提交 PR。

开始前阅读 [协作指南](docs/协作指南.md) 和 [AGENTS.md](AGENTS.md)。A 可把 [首次配置提示词](docs/A-Codex-首次配置.md) 全部复制给自己的 Codex。

## 目录与工作位置

- .github/：自动检查、审查负责人和 PR 模板。
- docs/协作指南.md：团队工作流程。
- 游戏设计.md：当前唯一游戏设计稿。
- docs/design/：设计协作说明。
- docs/standards/：开发负责人制定的内容格式与接口约定。
- AGENTS.md、README.md：协作规则与项目入口。

本机唯一开发目录为 `/home/stargazer/workspace/finance-playground`，通过 `origin` 对接本仓库。Windows 访问路径为 `\\wsl.localhost\Ubuntu-24.04\home\stargazer\workspace\finance-playground`。

相邻的 `hackthon` 仅存放本地参赛资料、赛事问答、参赛准备和提交材料，不连接 GitHub，不保留游戏开发副本。目录职责见 [目录与工作边界](docs/目录与工作边界.md)。官方资料、私人问答、依赖和测试临时文件不放入本仓库。

## 当前检查

安装 Git 和 Python 3 后，在仓库根目录运行：

    python3 .github/scripts/check_repository.py

Windows 可将 python3 替换为 py。当前只检查文档链接和仓库文件，不代表游戏验收。GitHub 检查项沿用 prototype-check 名称以兼容现有主分支保护；新方案实现后补充对应测试和启动说明。

## 下一步

根据[游戏设计](游戏设计.md)确认场景与交互，再由开发负责人确定内容格式，队友制作预留的视频。

本项目使用 Codex 辅助协作。新代码、图片及 AI 生成素材需记录来源和用途；尚未选定开源许可证。
