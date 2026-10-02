const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const out = path.join(__dirname, '..', 'test-results');
fs.mkdirSync(out, { recursive: true });
const report = { checks: [], errors: [], accessibility: [] };
async function check(label, fn) { await fn(); report.checks.push(label); console.log('PASS', label); }
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
  const action = (name, suffix = '') => page.locator(`[data-action="${name}"]${suffix}`);
  const snap = name => page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
  async function layout() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '页面不应横向溢出'); }
  async function a11y(label) { const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze(); report.accessibility.push({ label, violations: result.violations.map(x => ({id:x.id, impact:x.impact, nodes:x.nodes.map(n => n.target)})) }); assert.equal(result.violations.length, 0, JSON.stringify(result.violations.map(x => ({ id:x.id, nodes:x.nodes.map(n => n.target) })))); }
  async function visitAll() { for (const id of ['owner','staff','supplier']) await action('visit', `[data-id="${id}"]`).click(); }
  async function solve() { for (const [id, time] of [['balance','now'],['due','tomorrow'],['ledger','month']]) { await action('piece', `[data-id="${id}"]`).click(); await action('place', `[data-time="${time}"]`).click(); } }
  async function decide(choice) { await page.locator(`[name="choice"][value="${choice}"]`).check(); for (const id of ['due','ledger']) await page.locator(`[name="support"][value="${id}"]`).check(); await page.locator('#risk').selectOption(choice === 'adjust' ? 'execution' : 'deadline'); await page.getByRole('button', {name:'交出建议，看看后来'}).click(); }
  try {
    await page.goto(base);
    await check('桌面开场、图片、无溢出', async () => { assert(await page.locator('h1').textContent()); assert(await page.locator('.scene img').evaluate(i=>i.complete && i.naturalWidth > 0)); await layout(); await snap('desktop-intro'); await a11y('intro-light'); });
    await check('开场开始，未走访不能继续', async () => { await action('start').click(); assert(await action('to-timeline').isDisabled()); });
    await check('三人走访、两次深挖、重复调查不扣次数', async () => { await visitAll(); await action('deep','[data-id="supplier"]').click(); await action('visit','[data-id="owner"]').click(); await action('deep','[data-id="owner"]').click(); await action('visit','[data-id="staff"]').click(); assert(await action('deep').isDisabled()); assert.equal(await page.locator('#evidence-count').textContent(),'8'); await snap('desktop-investigation'); await a11y('investigation-light'); });
    await check('证据袋来源与性质，Esc关闭', async () => { await page.locator('#archive-button').click(); assert.equal(await page.locator('.evidence').count(),8); await a11y('archive-light'); await page.keyboard.press('Escape'); assert.equal(await page.locator('#archive').isVisible(),false); });
    await check('刷新恢复证据与行动次数', async () => { await page.reload(); assert.equal(await page.locator('#evidence-count').textContent(),'8'); await action('visit','[data-id="owner"]').click(); assert(await action('deep').isDisabled()); });
    await check('放错有提示，三张证据能归位', async () => { await action('to-timeline').click(); await action('piece','[data-id="ledger"]').click(); await action('place','[data-time="now"]').click(); assert.match(await page.locator('.puzzle-feedback').textContent(),/还没到账/); assert(await action('to-confront').isDisabled()); await solve(); assert(await action('to-confront').isEnabled()); });
    await check('对比两种贷款的数值', async () => { assert.match(await page.locator('[data-testid="cash-result"]').textContent(),/-5.8/); await action('plan','[data-plan="adjust"]').click(); assert.match(await page.locator('[data-testid="cash-result"]').textContent(),/3.1/); await snap('desktop-timeline'); await a11y('timeline-light'); });
    await check('证据追问和建议表校验', async () => { await action('to-confront').click(); assert(await action('to-decision').isDisabled()); await action('confront','[data-id="schedule"]').click(); await action('to-decision').click(); await page.locator('[name="choice"][value="adjust"]').check(); await page.locator('#risk').selectOption('execution'); await page.getByRole('button',{name:'交出建议，看看后来'}).click(); assert.match(await page.locator('#form-error').textContent(),/至少引用2张/); await a11y('decision-light'); });
    for (const choice of ['adjust','expand','delay','reject']) {
      await check('真实点击抵达结局：'+choice, async () => { await decide(choice); assert(await action('rewind').isVisible()); const text = await page.locator('.ending-result').textContent(); assert.match(text, choice === 'adjust' ? /3.1/ : choice === 'expand' ? /-5.8/ : /8/); await layout(); await snap('ending-'+choice); await a11y('ending-'+choice); if(choice !== 'reject') await action('rewind').click(); });
    }
    await check('三类结局收集，结局刷新仍保留', async () => { assert.match(await page.locator('.ending-head .eyebrow').textContent(),/3 \/ 3/); await page.reload(); assert(await action('rewind').isVisible()); });
    await check('重新开始确认与取消，不丢失已见结局', async () => { await page.locator('#restart-button').click(); await action('cancel-restart').click(); assert(await action('rewind').isVisible()); await page.locator('#restart-button').click(); await action('confirm-restart').click(); assert(await action('start').isVisible()); await action('start').click(); assert.equal(await page.locator('#evidence-count').textContent(),'2'); });
    await check('无深挖路线：明确排期未核实，暂缓反馈对应证据', async () => { await visitAll(); await action('to-timeline').click(); await solve(); assert.match(await page.locator('.assumption').textContent(),/未核实/); await action('to-confront').click(); assert.equal(await action('confront','[data-id="schedule"]').count(),0); await action('confront','[data-id="due"]').click(); await action('to-decision').click(); await decide('delay'); assert.match(await page.locator('.review').textContent(),/尚未核实/); });
    await check('手机390px暗色：完整流程、对比与结局', async () => {
      await page.setViewportSize({width:390,height:844}); await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
      await page.locator('#restart-button').click(); await action('confirm-restart').click(); await snap('mobile-dark-intro'); await layout(); await a11y('intro-dark-mobile');
      await action('start').click(); await visitAll(); await layout(); await snap('mobile-dark-investigation'); await a11y('investigation-dark-mobile');
      await action('to-timeline').click(); await solve(); await action('plan','[data-plan="adjust"]').click(); await layout(); await snap('mobile-dark-timeline'); await a11y('timeline-dark-mobile');
      await action('to-confront').click(); await action('confront','[data-id="lease"]').click(); await layout(); await a11y('confront-dark-mobile'); await action('to-decision').click(); await layout(); await snap('mobile-dark-decision'); await a11y('decision-dark-mobile');
      await decide('adjust'); await layout(); await snap('mobile-dark-ending'); await a11y('ending-dark-mobile');
    });
    await check('手机320px亮色：关键页面无横向溢出', async () => { await page.setViewportSize({width:320,height:720}); await page.emulateMedia({colorScheme:'light'}); await layout(); await action('rewind').click(); await layout(); await action('back-confront').click(); await layout(); await action('back-timeline').click(); await layout(); await snap('mobile-320-timeline'); });
    await check('键盘时间线操作及鼠标拖放', async () => {
      await page.setViewportSize({width:1280,height:900}); await page.locator('#restart-button').click(); await action('confirm-restart').click(); await action('start').focus(); await page.keyboard.press('Enter'); await visitAll(); await action('to-timeline').click();
      await action('piece','[data-id="balance"]').dragTo(action('place','[data-time="now"]')); assert(await action('piece','[data-id="balance"]').isDisabled());
      for (const [id, time] of [['due','tomorrow'],['ledger','month']]) { await action('piece',`[data-id="${id}"]`).focus(); await page.keyboard.press('Enter'); await action('place',`[data-time="${time}"]`).focus(); await page.keyboard.press('Enter'); } assert(await action('to-confront').isEnabled());
    });
    await check('损坏存储自动回到可玩开场', async () => { await page.evaluate(()=>sessionStorage.setItem('loan-story-v1','{"step":"ending","version":1}')); await page.reload(); assert(await action('start').isVisible()); });
    await check('存储不可用仍能游玩', async () => { const isolated = await browser.newContext(); const p = await isolated.newPage(); await p.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('denied')};Storage.prototype.setItem=()=>{throw new Error('denied')};}); await p.goto(base); await p.locator('[data-action="start"]').click(); assert(await p.locator('[data-action="visit"]').first().isVisible()); assert.match(await p.locator('.notice').textContent(),/不允许保存/); await isolated.close(); });
    await check('直接打开文件也能离线游玩', async () => { const p = await context.newPage(); await p.goto(require('node:url').pathToFileURL(path.join(__dirname,'..','index.html')).href); await p.locator('[data-action="start"]').click(); for (const id of ['owner','staff','supplier']) await p.locator('[data-action="visit"][data-id="'+id+'"]').click(); assert(await p.locator('[data-action="to-timeline"]').isEnabled()); await p.close(); });
    await check('无JavaScript异常或资源请求失败', async () => assert.deepEqual(report.errors,[]));
  } finally { fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2)); await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
