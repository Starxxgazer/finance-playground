# 三维版验证记录

日期：2026-10-02；改动范围为 `demos/chapter-one/`。原 `prototype/` 未改动。

## 自动检查

- 原型模型 5 项、章节模型 24 项通过；事实、金额、期限与报告判断规则未变。
- 三维版本第一次完整回归：7/7 路线、151 检查点通过，包含两种走访顺序、正常动画、320/390 手机视口与 390×568 / 844×390 短屏。这一轮完成后，用户要求提高画面精细度，确定改为偏写实室内视角。
- 偏写实版本重新核对三处 18 个物件的真实射线点击、悬停轮廓、中央放大、拖动旋转与关闭；从开场到结尾、刷新及重玩的完整桌面路线通过，37 个检查点、2 次 axe 扫描零违规，控制台/页面/资源错误为零；结果见本地 `test-results/browser-report.json`。
- `npm run test:3d`：本地资源、零图片请求、触屏模型点击/单指旋转、键盘旋转/Home 复位、关闭后焦点恢复、WebGL 丢失/恢复，以及无 WebGL 时继续取证均通过。检查窗口 axe 扫描零违规。
- 单独检查最新 18 个模型的全部 236,252 个顶点，坐标均为有限值；修正了叶片曲面端点因浮点误差出现 NaN 的问题。
- 引擎本地打包可复现，保留第三方许可；语法与实际暂存差异检查通过。

## 画面检查

已打开并查看实际 Chromium 截图，检查室内镜位、木纹和纸面、光照、模型轮廓、中央账本以及手机检查窗口；据此调整柜台与人物比例、镜头高度、玻璃柜、弧形纸页、金属细节与叶片。

关键截图保留在被 Git 忽略的 `test-results/`，例如 `realism-bakery.png`、`realism-book-inspection.png`、`hover-outline-book.png`、`3d-touch-scene.png` 与 `3d-touch-inspection.png`。测试产物不上传仓库。

浏览器验证用 Playwright 驱动 Chromium 的真实点击、拖动、触摸事件和键盘操作；通关测试不注入进度跳过调查。人工画面检查与自动通关不能代替目标玩家评价。

## 复现

```bash
python3 -m http.server 4186 --bind 127.0.0.1 --directory demos/chapter-one
# 另一个终端：
npm test --prefix prototype
npm test --prefix demos/chapter-one
npm run test:browser --prefix demos/chapter-one
npm run test:3d --prefix demos/chapter-one
```

浏览器依赖安装方式见 README。可通过 `CHROME_PATH` 指定 Chromium，通过 `CHAPTER_ONE_URL` 指定端口。本次使用软件 WebGL 做自动验证，尚未做跨显卡性能基准、真实手机 Safari 或真实玩家趣味性测试；当前人物仍为程序模型。
