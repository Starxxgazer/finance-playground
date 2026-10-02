# Finance Playground · 玩转金融

通过游戏了解金融。首个候选原型《这笔钱借给谁》是一款中文剧情调查游戏：一家天天排队的面包店为什么急着借钱？通过人物对话、证据和资金对比，判断这笔贷款会带来什么后果。

仓库：<https://github.com/Starxxgazer/finance-playground>

当前目标是制作约 3—5 分钟的试玩，验证故事吸引力、操作体验和金融推理。面包店是候选案例，完整产品方案和故事格式尚未定稿。公司、人物与资金均为虚构。

## 本地试玩

需要 Python 3。从仓库根目录启动：

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory prototype
```

Windows 可使用：

```powershell
py -m http.server 4173 --bind 127.0.0.1 --directory prototype
```

在浏览器打开 <http://127.0.0.1:4173>；关闭时在终端按 `Ctrl+C`。当前原型不需要账号、API Key 或后端。

## 自动检查

安装 Node.js 22 后，在仓库根目录运行：

```bash
node --test prototype/tests/model.test.cjs
```

该检查覆盖资金模型与部分判断逻辑；浏览器实际试玩另行执行。GitHub 每次推送及 PR 会运行 `prototype-check`。

## 分工

| 成员 | 负责内容 |
| --- | --- |
| 开发负责人 Starxxgazer | 游戏程序、数据格式、数值模型、审查与合并 |
| A、B | 共同设计故事、人物、证据、选项与结局，亲自试玩 |
| A（372785716aa-star） | 用 Codex 整理内容，在自己电脑验证后推送工作分支并发起 PR |

详细步骤见 [协作指南](docs/协作指南.md)，AI 编程会话必须遵守 [AGENTS.md](AGENTS.md)。

## 目录

- `prototype/`：可运行的游戏原型、素材与测试。
- `docs/`：团队协作说明。
- `.github/`：自动检查、审查负责人和 PR 模板。
- 根目录产品说明与策划案：讨论背景，不能当作已锁定的完整需求。
- `官方比赛资料/`：仅在原始电脑保留，未上传 GitHub。

本次制作使用 Codex 辅助编程和内容整理。其他素材与 AI 使用记录由制作人员在原型文档中补充。尚未选定开源许可证。
