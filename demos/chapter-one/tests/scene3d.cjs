// Interaction checks for the actual GPU canvas, touch input and WebGL failure.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('../../../prototype/node_modules/playwright');
const AxeBuilder = require('../../../prototype/node_modules/@axe-core/playwright').default;
const BASE = process.env.CHAPTER_ONE_URL || 'http://127.0.0.1:4186';
const OUT = path.resolve(__dirname, '../test-results');
const launch = { headless:true, args:['--enable-unsafe-swiftshader'], ...(process.env.CHROME_PATH ? { executablePath:process.env.CHROME_PATH } : {}) };
const report = { checks:[], errors:[] };
async function start(page) {
  await page.goto(BASE); await page.locator('[data-action=start]').click();
  while (await page.locator('[data-action=next]').count()) await page.locator('[data-action=next]').click();
}
async function object(page, id) {
  await page.locator('[data-action=objects]').click();
  await page.locator(`#overlay [data-id="${id}"]`).click();
}
(async () => {
  fs.mkdirSync(OUT,{recursive:true});
  const browser = await chromium.launch(launch);
  try {
    const context = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
    const page = await context.newPage(); const requests = [], errors = [];
    page.on('request',r=>requests.push(r.url())); page.on('pageerror',e=>errors.push(e.message));
    await start(page); await page.waitForSelector('#scene-plane[data-ready="true"]');
    assert.equal(await page.locator('img').count(), 0, 'No image scenery or map thumbnails');
    assert(requests.every(url => new URL(url).origin === new URL(BASE).origin), 'All runtime resources local');
    assert(requests.every(url => !/\.(webp|png|jpg|jpeg)(\?|$)/.test(url)), 'No raster assets loaded');
    await page.screenshot({path:path.join(OUT,'3d-touch-scene.png')});
    const target = await page.locator('.hotspot[data-id="bakery-book"]').boundingBox();
    await page.touchscreen.tap(target.x+target.width/2,target.y+target.height/2);
    await page.waitForSelector('#overlay[data-type="inspection"][open]');
    assert.equal(await page.locator('#scene-canvas').getAttribute('data-inspected'), 'bakery-book', 'Touch can pick the real model');
    const before = await page.locator('#scene-canvas').getAttribute('data-rotation');
    const r = await page.locator('#inspect-viewport').boundingBox(), cdp = await context.newCDPSession(page);
    const x = r.x+r.width*.4, y = r.y+r.height*.45;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=5;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*16,y:y+i*5}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(before=>document.querySelector('#scene-canvas').dataset.rotation!==before,before);
    await page.screenshot({path:path.join(OUT,'3d-touch-inspection.png')});
    const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-action=objects]').evaluate(e=>e===document.activeElement),true,'Focus returns to reachable scene control');
    await page.locator('.hotspot[data-id="bakery-account"]').focus(); await page.keyboard.press('Enter');
    await page.locator('#scene-canvas').focus(); const beforeKey=await page.locator('#scene-canvas').getAttribute('data-rotation');
    await page.keyboard.press('ArrowLeft'); assert.notEqual(await page.locator('#scene-canvas').getAttribute('data-rotation'),beforeKey);
    await page.keyboard.press('Home'); await page.keyboard.press('Escape');
    assert.equal(await page.locator('.hotspot[data-id="bakery-account"]').evaluate(e=>e===document.activeElement),true,'Keyboard focus returns to inspected object');
    await page.evaluate(()=>{
      const ext=document.querySelector('#scene-canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      window.restoreTestContext=()=>ext.restoreContext(); ext.loseContext();
    });
    await page.waitForSelector('#scene-status:not([hidden])');
    await page.evaluate(()=>window.restoreTestContext());
    await page.waitForSelector('#scene-status[hidden]', {state:'attached'}); await page.waitForSelector('#scene-plane[data-ready="true"]');
    await object(page,'bakery-book'); assert.equal(await page.locator('#inspect-viewport canvas').count(),1);
    assert.deepEqual(errors,[]); report.checks.push('本地无图片资源、触屏点击/旋转、检查窗口 axe 零违规、键盘旋转/焦点、WebGL 丢失/恢复');
    await context.close();
  } finally { await browser.close(); }
  const fallback = await chromium.launch({...launch,args:['--disable-webgl']});
  try {
    const page=await fallback.newPage(); await start(page); await page.waitForSelector('body.scene-unavailable');
    await object(page,'bakery-account'); assert.equal(await page.locator('[data-document=account]').count(),1);
    assert.match(await page.locator('.preview-unavailable').textContent(),/不可用/);
    assert.equal(await page.locator('[data-action=inspect-left]').isDisabled(),true);
    await page.keyboard.press('Escape'); await object(page,'bakery-book'); await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-action=puzzle]').isEnabled(),true,'No WebGL still permits collecting evidence and proceeding');
    report.checks.push('无 WebGL 时明确提示，仍可取得资料并进入核对');
  } finally { await fallback.close(); }
  console.log(report.checks.join('\n'));
})().catch(e=>{report.errors.push(e.stack);console.error(e);process.exitCode=1;}).finally(()=>fs.writeFileSync(path.join(OUT,'scene3d-report.json'),JSON.stringify(report,null,2)));
