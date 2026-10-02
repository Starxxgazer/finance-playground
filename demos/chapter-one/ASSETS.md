# 场景素材记录

## 当前 Three.js 版本（2026-10-02）

- 当前试玩不加载下文历史 WebP 图片。场景、人物与 18 个物件由 `scene3d.js` / `props3d.js` 程序建模，工具为 OpenAI Codex，用于用户指定的实时三维调查与物件旋转预览。没有导入第三方模型、贴图或照片。
- 地板、旧木、墙面及纸张微表面由着色器计算；模型上的文字由本地 Canvas 绘制。所有证据和金额继续来源于 `data.js` / `model.js`，不从材质或随机生成内容推断。
- Three.js 0.186.1：来源 [npm](https://www.npmjs.com/package/three/v/0.186.1) / [官方仓库](https://github.com/mrdoob/three)，MIT 许可，原许可保存在 `vendor/THREE-LICENSE.txt`。附加模块包括 OrbitControls、OutlinePass、EffectComposer、RenderPass、OutputPass、RoundedBoxGeometry 和 RoomEnvironment；偏写实版本新增 SSAOPass 和 UnrealBloomPass。
- 参考：[轮廓描边官方文档](https://threejs.org/docs/pages/OutlinePass.html)、[旋转控制官方文档](https://threejs.org/docs/pages/OrbitControls.html)。引擎与附加模块通过 esbuild 0.28.2 本地打包，命令为 `npm ci && npm run vendor`。
- 以上第三方许可仅适用于第三方库；AI 辅助制作记录不等于公共领域声明，不替团队为项目增加开源许可证。

## 历史图片（保留记录，当前不使用）

## opening.webp

- 文件：`assets/opening.webp`。
- 用途：标题页与走近老店门口的开场镜头，呈现“排队的面包店”。
- 生成日期：2026-10-02；工具：OpenAI 内置 `image_gen.imagegen`，使用 `imagegen` 技能内置模式，未使用 CLI。
- 源 PNG：`exec-39abcc92-55fa-492b-a35b-000fdeb46ed4.png`。
- 输入：本项目 AI 生成的 `assets/bakery.webp`，只作老店建筑、灯光、角色与绘画风格参考，未引入第三方图片；不作公共领域或第三方授权声明，不自动添加许可证。
- 实际尺寸：1672×941；仅用 Pillow 转为 WebP quality=91、method=6，没有裁切、重绘或改变构图。
- 观察：右侧五名成年顾客松散排队，左侧雨后街道留有标题空间；门实际中心约 (58%,48%)，门槛约 (58%,69%)。室内人物为远景，避免新造近脸；雨街蓝调与旧店暖灯保持一致。
- 工具参数：`transparent_background: false`；`referenced_image_paths` 指向本项目 `assets/bakery.webp`。

### 实际提示词

```text
Use case: illustration-story
Asset type: opening title and approach-to-door scene of the narrative game The Bakery Queue, a final wide 16:9 landscape illustration.
Input image: bakery.webp is a visual style and architecture reference, showing the INSIDE of the same neighborhood bakery. Generate a NEW outside view looking in, preserving the old dark wooden window frames, honey-brown bread displays, old oven, cream plaster, amber lamps, and blue-green wet Chinese neighborhood atmosphere.
Primary request: An exceptionally beautiful cinematic hand-painted realistic exterior view of this same small neighborhood bakery in contemporary China, at rainy early evening just after the rain. Four or five adult customers form a natural loose short queue outside the warmly glowing bread shop, ordinary coats and simple shopping bags, patient relaxed postures, clearly queuing for bread. No crowd and no children. Faces are incidental and small, never portraits.
Composition: landscape 16:9, camera at street eye level, rich spatial depth, wet stone pavement and subtle reflections, leafy branches and aged residential walls. The shop occupies the right half; its openable wooden glass door is centered at approximately 65 percent of image width and 47 percent image height, clearly visible and unobstructed. Warm bread-filled windows glow beside it. The queue stretches towards the right of the doorway without blocking it. The left 35 percent is a quieter darker blue-green receding street with empty negative space suitable for the game's title overlay, no dominant bright objects there. A glimpse of the cream-shirt brown-apron older baker and moss-green-apron young adult assistant may be deep inside as small silhouettes only, no close-up faces. The lower 20 percent is damp shadowed pavement suitable for a subtitle overlay. Frame the entrance at approachable human scale.
Style and mood: exactly match reference sophisticated hand-painted realism with subtle oil paint texture, film background craftsmanship, detailed natural materials, restrained amber against petrol-blue twilight, warm modest neighborhood life, inviting but quietly serious; credible contemporary Chinese neighborhood architecture, not fantasy or European town.
Constraints: one full-bleed landscape image only. No readable text, no signage, no letters, no numbers, no logos, no watermark, no UI, no buttons, no title painted in the image, no neon, no glossy 3D.
```


生成日期：2026-10-02。全部图片用于《这笔钱借给谁》第一章候选试玩。

## 来源与使用说明

- 工具：OpenAI 内置 `image_gen.imagegen`，技能：`imagegen`，使用内置工具模式；五幅均为实际成功的工具调用，未使用 CLI 或占位图。
- 五幅场景由 AI 根据提示词生成；除老店图外，其余四幅引用 AI 生成的老店图作为视觉参考，未引入第三方图片素材。
- 这些图仅作为本项目的虚构场景表现。画中人物、店铺和纸张均不对应真实个人、企业、合同或账户；事实、金额与剧情数据由程序文本提供。
- AI 生成标识不等于公共领域声明，也不为素材或项目自动添加开源许可证。团队应按所用服务条款及团队决定确定后续发布许可。
- 发布素材为 `assets/*.webp`；使用 Pillow 以 WebP quality=91、method=6 编码，保持工具输出的 1672×941 像素，没有裁切、重绘或改变构图，总体比例约为 16:9。
- 原始 PNG 保留在工具生成位置，不进入项目提交，避免重复大文件。原始文件名记录于各图条目；原有四幅的工具会话目录标识为 `01a0fad7-0778-7550-9472-695006de23e6`，新增开场图的工具会话目录标识为 `01a0fae0-1e2a-7431-95d3-413f9db0bb70`，不记录用户机器绝对路径。
- 已逐张查看工具输出，确认主体、角色、场景、色调和可交互物件；纸张没有可读金额，账本及邀请函等内容由游戏层呈现。画面下部保留对白空间。
- 热点坐标是对完整图幅测得的建议百分比：左上为 (0%,0%)，右下为 (100%,100%)。使用 `object-fit: cover` 时需同步处理裁切偏移，或将热点放在与图像相同的变换容器中。

## bakery.webp

- 文件：`assets/bakery.webp`
- 用途：老店探索背景。
- 实际尺寸：1672×941。
- 源 PNG：`exec-d48027c1-8080-4123-829c-2ef643cfc43d.png`。
- 输入：无输入图，原创生成。
- 热点建议：陈叔 (51%,37%)；小禾 (75%,40%)；烤箱 (29%,36%)；账本 (53%,59%)；深绿纸夹 (76%,58%)；面包陈列 (10%,55%)。
- 工具参数：`transparent_background: false`；未传入参考图。

### 实际提示词

```text
Use case: illustration-story
Asset type: final wide painted background for a narrative exploration game.
Primary request: Create one beautiful 16:9 landscape image, ideally 2048 by 1152, showing a small, lived-in neighborhood bakery in contemporary China after rain, in blue-green early evening. Cinematic hand-painted narrative game art, delicate oil-painted texture with sophisticated animated-film background craft, realistic gentle human faces, warm and restrained, not cartoonish.
Scene: eye-level wide view from inside the bakery. A long honey-colored wooden service counter extends diagonally from lower left towards mid-right. Behind it, left of center, is a large old working bakery oven with its door and a small amber-lit window clearly visible. On the left are wooden and glass bakery displays with a modest assortment of beautiful handmade round loaves. On the upper-right side, large old windows show a damp quiet Chinese neighborhood street, wet pavement reflecting dusk and amber shop lights, leafy branches and bicycle shapes.
Subjects: Chen, a Chinese man in his late fifties, short graying hair, kind tired face, cream cotton shirt and dark brown apron, stands at around x 55%, y 45% behind the counter, upper body visible. Xiaohe, a Chinese young adult woman in her twenties, short dark hair, moss-green apron over an ivory shirt, stands near the window at x 79%, y 47%, quietly listening. Both belong naturally in the scene, not portrait closeups.
Interactive visual objects: a clearly separated cream ledger book and small paper clip on the counter around x 50%, y 65%; the old oven around x 27%, y 47%; a dark green paper folder close to the right window ledge at x 77%, y 63%. Make these objects legible as painted shapes without any readable writing.
Composition: exceptionally thoughtful cinematic staging, inviting depth and tactile details, asymmetrical, upper 75% contains all story-important faces and objects. The bottom 20% is only a low-detail dark warm wooden foreground counter edge and floor, suitable behind a dialogue overlay. No essential object is below 78% image height. Full-bleed image, no border.
Light and color: luminous tungsten pendants softly illuminate flour dust, bread crusts, scratched wood and porcelain; blue-green rainy twilight outside; muted olive, tobacco, cream, petrol blue. A calm moment before a difficult family-business decision, warm but unsentimental. Rich physical materials, light brushwork, natural proportions.
Constraints: no UI, no button, no title, no logo, no watermark, no signage, no letters, no numbers, no readable text or money amounts, no futuristic neon cyberpunk, no glossy 3D. Only one image.
```

## supplier.webp

- 文件：`assets/supplier.webp`
- 用途：供应商服务点探索背景。
- 实际尺寸：1672×941。
- 源 PNG：`exec-037abea2-5b4b-4572-ba99-c0dc7f96967e.png`。
- 输入：使用本项目 bakery.webp 作为光色、材质与世界观参考，生成独立场景。
- 热点建议：老孟 (55%,38%)；合同纸夹 (36%,65%)；收款本 (64%,64%)；窗边旧送货单 (80%,55%)；维修设备 (23%,42%)。
- 工具参数：`transparent_background: false`；参考图为 `assets/bakery.webp`。

### 实际提示词

```text
Use case: illustration-story
Asset type: final wide 16:9 landscape background for a narrative exploration game, a DIFFERENT location in the same visual world as the reference.
Input image: style and atmosphere reference only; do not copy its layout or bakery subjects. Match the image's sophisticated cinematic hand-painted realism, detailed physical materials, Chinese neighborhood setting, amber light and blue-green rainy dusk.
Primary request: One beautiful full-bleed wide image, ideally 2048 by 1152, of a small bakery-equipment supplier and repair service point in contemporary China, viewed at eye level from the entrance. Restrained, intimate narrative game environment, natural human proportions, delicately painterly surfaces and luminous cinematic lighting.
Scene: an old shop with chalky pale walls, shelves of neatly kept small mechanical parts and unlabeled metal containers at upper left, a sturdy repair workbench in left midground with a small disassembled industrial mixer and hand tools. At the center stands Meng, a Chinese man in his mid-forties, short black hair, slightly receding hairline, weathered kind face, navy blue work jacket with rolled sleeves, light grey shirt, resting one hand on the service counter. His expression is thoughtful, matter-of-fact, not smiling theatrically. He is the only person in this scene.
Interactive visual objects, physically separated and clearly recognizable: a red-brown thick paper contract folder at x 34%, y 61% on the foreground counter; an open cream ruled receipt ledger at x 57%, y 60%; a short stack of old folded delivery slips held by a brass clip on the inner windowsill at x 80%, y 52%. There is no readable writing on any paper. The equipment workbench at x 23%, y 44% helps the room feel like a real repair shop.
Composition: asymmetrical, cinematic depth with Meng around x 55%, y 40%. A tall old window at right gives a view of a rain-wet quiet Chinese community street, wet leaves and an old delivery bicycle. A green enamel pendant and one bench lamp make warm pools of light. Upper 75% holds faces and important objects; bottom 20% is dark quiet wooden counter-front and concrete floor with no critical content, suitable for a dialogue overlay.
Light/color/materials: restrained petrol blue dusk, tobacco brown, faded cream paint, dark navy cotton, amber tungsten; scratched metal, folded papers, modest orderly workshop life. A calm and credible place for verifying a business story.
Constraints: one landscape image only; no UI or text overlay, no labels, no readable writing, no letters, no numbers, no amounts, no logo, no watermark, no border, no neon cyberpunk, no glossy 3D; no additional people, no bakery bread display, no oversized machines obstructing the view.
```

## newshop.webp

- 文件：`assets/newshop.webp`
- 用途：新铺探索背景。
- 实际尺寸：1672×941。
- 源 PNG：`exec-547df87a-bda9-4a8b-a611-b1e01f8bb687.png`。
- 输入：使用本项目 bakery.webp 作为光色、材质和小禾形象参考，生成独立场景。
- 热点建议：小禾脸 (63%,25%)；施工排期 (24%,28%)；预算本 (40%,46%)；纸箱 (8%,60%)；柜台轮廓远角 (57%,72%)。轮廓延伸到底部，建议交互标记放 (54%,70%) 以避开对白。
- 工具参数：`transparent_background: false`；参考图为 `assets/bakery.webp`。

### 实际提示词

```text
Use case: illustration-story
Asset type: final wide 16:9 landscape background for a narrative exploration game, a NEW location in the same visual world as the reference.
Input image: reference for the image craft, color, mood and character Xiaohe only. The young woman with short dark hair and moss-green apron must be the same person, recognizable facial structure and hairstyle. Do not reuse the bakery's architecture, furniture or older man.
Primary request: one beautiful full-bleed 16:9 wide image, ideally 2048 by 1152, inside an unfinished future neighborhood bakery in contemporary China, after rain at early dusk. A modest empty storefront full of potential. Cinematic hand-painted realism with animated-film environmental storytelling, subtle oil painting texture, natural human proportions, tactile believable materials.
Scene and composition: eye-level wide view diagonally across an empty rectangular room. Tall floor-to-ceiling old wood-and-metal windows and an open glass doorway on the right reveal the same quiet rain-wet Chinese neighborhood, blue-green foliage and warm distant windows. Bare lightly patched cream plaster walls, unfinished concrete floor, a few carefully stacked plain cardboard boxes at left, one sack of renovation materials, leaning unfinished wood planks. No installed bakery equipment. A single hanging exposed warm tungsten bulb gives the room a quiet hopeful glow.
Subject: Xiaohe, a Chinese woman in her twenties with short dark hair, moss-green apron over an ivory rolled-sleeve cotton shirt, natural face matching the reference, stands at x 69%, y 44% just left of the window, full figure or almost full figure visible. She holds a blank paper gently in one hand and thoughtfully looks towards the space, hopeful but apprehensive.
Interactive objects clearly visible: an unframed cream construction schedule sheet clipped to the left wall at x 28%, y 36%, with pale grid lines only, no text; a makeshift worktable of one wooden plank on two trestles around x 40%, y 56% holds an open budget notebook with blank ruled pages, pencil and a metal measuring tape, all separated and readable; on the floor at x 56%, y 69%, pale masking tape outlines the rectangular footprint of a future bakery counter, with a corner clearly visible; unopened boxes at x 18%, y 57%.
Important compositional constraint: keep all story-critical objects and Xiaohe's face in upper 75% of image, the bottom 20% is quiet shadowed floor and light reflections with no essential information, suitable for a dialogue overlay. Maintain ample open room and beautiful spatial depth. This must visibly read as a different, not-yet-open shop, not the old bakery.
Light/color: rich but restrained amber tungsten and muted petrol-blue wet dusk; warm cream plaster, olive cloth, dark rain-washed wood, cardboard brown. Subtle natural filmic atmospheric perspective and painterly texture. A feeling of possibilities measured against practical realities.
Constraints: no UI, no overlay, no title, no letters, no numbers, no readable writing, no money amounts, no logos or brands, no watermark, no border, no neon cyberpunk, no shiny 3D. One person only, no old man, no completed counter, no display of bread.
```

## ending.webp

- 文件：`assets/ending.webp`
- 用途：结尾邀请函与收支本特写。
- 实际尺寸：1672×941。
- 源 PNG：`exec-4e235f19-250f-4f28-9861-e52250cc71be.png`。
- 输入：使用本项目 bakery.webp 作为光色和材质参考，生成独立近景。
- 热点建议：邀请函 (40%,35%)；收支本 (74%,48%)；茶杯 (10%,40%)。下方约 25% 为无关键物件的木桌。
- 工具参数：`transparent_background: false`；参考图为 `assets/bakery.webp`。

### 实际提示词

```text
Use case: illustration-story
Asset type: final 16:9 landscape ending background for a cinematic narrative game.
Input image: visual style, lighting and materials reference only. This is a new close-up composition at the same bakery, no people.
Primary request: One beautiful full-bleed 16:9 wide close-up, ideally 2048 by 1152, of a modest bakery invitation card and a small income-and-expense ledger on the worn wooden counter under a warm lamp after rain. Intimate and emotionally quiet, a final shot in a serious but humane narrative game. Cinematic hand-painted realism, delicate oil-painted texture, sophisticated animated-film environmental art, rich tactile detail.
Composition: oblique three-quarter overhead view of the tabletop, not flat lay. In the upper-middle left at x 39%, y 39% lies an opened cream envelope with a thick warm ivory invitation card partly pulled out, the card completely blank, showing only beautiful natural paper texture. A small dried olive-green leaf rests on the edge of the envelope. At x 66%, y 43% is a modest open dark-brown clothbound ledger with cream softly ruled blank pages; a graphite pencil lies across the right page, a plain brass binder clip near the spine. At x 24%, y 46% a small everyday off-white ceramic teacup has a very subtle wisp of steam. The back of the table falls away to an out-of-focus rain-dark window at the top-right, blue-green wet foliage and soft distant amber street lights. Only the warm lower edge of an old desk lamp may enter the upper-left corner, gently illuminating the papers. Fine bread flour traces in the wood grain connect to the bakery, but no bread and no extra paperwork clutter.
Lighting/mood: a pool of soft amber tungsten light around the invitation and ledger, beautiful cool petrol-blue rainy dusk bokeh beyond, quiet hope and the weight of a considered decision, warm but not sentimental. Fine shadows of paper edges, tactile linen book cover, scratched honey-brown wood, cinematic falloff.
Bottom 25% must remain a low-detail deep brown tabletop with no critical objects, suitable behind a dialogue or epilogue overlay. All important papers lie in the upper 65%. No faces or hands.
Constraints: one landscape image only, no words, no letters, no numbers, no readable text, no money amounts, no signs, no UI, no overlay, no logo, no watermark, no border, no decorative frame, no neon, no glossy 3D. The invitation and ledger must have genuinely blank or merely faintly ruled pages.
```
