/* Real Chromium regression checks. Progress is obtained only by browser clicks
   and keys; storage is read solely to verify saved progress. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('../../../prototype/node_modules/playwright');
const AxeBuilder = require('../../../prototype/node_modules/@axe-core/playwright').default;
const BASE = process.env.CHAPTER_ONE_URL || 'http://127.0.0.1:4186';
const OUT = path.resolve(__dirname, '../test-results');
const KEY = 'liudeng-chapter-one-v1';
fs.mkdirSync(OUT, { recursive: true });
const report = { baseURL: BASE, startedAt: new Date().toISOString(), checks: [], scenarios: [], accessibility: [], errors: [] };
const action = (page, name, id) => page.locator(`[data-action="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const check = (name, data = {}) => { report.checks.push({ name, ...data }); console.log(`PASS ${name}`); };
const docs = {
  bakery: [['bakery-account', 'account'], ['bakery-book', 'operations']],
  supplier: [['supplier-contract', 'contract'], ['supplier-payments', 'payments']],
  newshop: [['newshop-budget', 'budget'], ['newshop-schedule', 'schedule']],
};
const pieces = {
  bakery: [['cash', 'now'], ['receipts', 'in'], ['operating', 'out']],
  supplier: [['prior', 'past'], ['tail', 'due'], ['extension', 'unconfirmed']],
  newshop: [['initial', 'tomorrow'], ['preparation', 'month'], ['opening', 'later'], ['newincome', 'month']],
};
const optional = ['bakery-chen', 'bakery-poster', 'bakery-recipe', 'bakery-oven', 'supplier-meng', 'supplier-photo', 'supplier-delivery', 'supplier-machine', 'newshop-xiaohe', 'newshop-invitation', 'newshop-mark', 'newshop-leaflet'];
async function waitState(page, predicate) {
  await page.waitForFunction(({ key, source }) => new Function('s', `return (${source})(s)`)(JSON.parse(localStorage.getItem(key))), { key: KEY, source: predicate.toString() });
}
async function settleDialogue(page, keyboard = false) {
  let count = 0;
  while (await action(page, 'next').count()) {
    assert(count++ < 30, 'Dialogue must finish');
    if (keyboard) await page.keyboard.press('Space');
    else await action(page, 'next').click();
  }
}
async function close(page) { if (await page.locator('#overlay[open]').count()) await page.keyboard.press('Escape'); }
async function snap(page, name) {
  if (!name.endsWith('-FAIL')) await page.waitForFunction(() => !document.querySelector('#toast') || +getComputedStyle(document.querySelector('#toast')).opacity < .01);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }); }
async function axe(page, name) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const violations = result.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
  report.accessibility.push({ page: name, violations });
  assert.equal(violations.filter(v => ['serious', 'critical'].includes(v.impact)).length, 0, `${name}: serious accessibility issues: ${JSON.stringify(violations)}`);
}
async function fits(page, name, selectors = []) {
  await page.locator('#overlay-content').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
  const measurement = await page.evaluate(selectors => {
    const dialog = document.querySelector('#overlay[open]');
    const nodes = selectors.map(selector => {
      const el = document.querySelector(selector); if (!el) return { selector, missing: true };
      const r = el.getBoundingClientRect(); return { selector, x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    });
    return { viewport: innerWidth, viewportHeight: innerHeight, scroll: document.documentElement.scrollWidth, dialog: dialog ? { client: dialog.clientWidth, scroll: dialog.scrollWidth } : null, nodes };
  }, selectors);
  assert(measurement.scroll <= measurement.viewport + 1, `${name}: page horizontal overflow ${JSON.stringify(measurement)}`);
  if (measurement.dialog) assert(measurement.dialog.scroll <= measurement.dialog.client + 1, `${name}: dialog horizontal overflow ${JSON.stringify(measurement)}`);
  for (const node of measurement.nodes) {
    assert(!node.missing && node.x >= -1 && node.right <= measurement.viewport + 1 && node.width >= 24 && node.height >= 24 && node.y >= -1 && node.bottom <= measurement.viewportHeight + 1, `${name}: unreachable button ${JSON.stringify(node)}`);
  }
  check(name, measurement);
}
async function tabTo(page, selector) {
  for (let i = 0; i < 90; i++) {
    if (await page.evaluate(selector => document.activeElement?.matches(selector), selector)) return;
    await page.keyboard.press('Tab');
  }
  throw Error(`Keyboard cannot reach ${selector}`);
}
async function start(page, keyboard = false) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#scene-plane').dataset.ready === 'true');
  if (keyboard) { await tabTo(page, '[data-action="start"]'); await page.keyboard.press('Enter'); }
  else await action(page, 'start').click();
  await fits(page, 'opening-dialogue-buttons', ['[data-action="next"]']);
  if (await page.evaluate(() => matchMedia('(prefers-reduced-motion: no-preference)').matches)) await snap(page, 'normal-opening-dialogue');
  await settleDialogue(page, keyboard);
  assert.deepEqual((await state(page)).collected, ['application', 'repayment']);
  await action(page, 'map').click();
  assert(await action(page, 'travel', 'supplier').isDisabled());
  assert(await action(page, 'travel', 'newshop').isDisabled());
  await close(page);
}
async function openObject(page, id) {
  await close(page);
  await action(page, 'objects').click();
  await page.locator(`#overlay [data-action="hotspot"][data-id="${id}"]`).click();
  await settleDialogue(page);
}
async function imageHotspots(page, scene) {
  await page.waitForFunction(() => document.querySelector('#scene-plane').dataset.ready === 'true');
  await page.mouse.move(10, 10);
  assert.equal(await page.locator('#object-tooltip').isVisible(), false, 'No permanent object highlight');
  const points = await page.locator('.hotspot').evaluateAll(nodes => nodes.map(el => {
    const r = el.getBoundingClientRect(); return { id:el.dataset.id, x:r.x+r.width/2, y:r.y+r.height/2 };
  }));
  assert.equal(points.length, 6, `${scene}: every story object has a modeled target`);
  await snap(page, `normal-${scene}-hotspots`);
  for (const point of points) {
    // Raycast a visible surface near the projected object center; never dispatch synthetic clicks.
    let found = false;
    for (const dy of [0,-18,-35,18,35,-55]) {
      await page.mouse.move(point.x, point.y + dy);
      if (await page.locator('#scene-plane').getAttribute('data-hovered') === point.id) { found = true; break; }
    }
    assert(found, `${scene}: model must be reachable by raycast: ${point.id}`);
    assert.equal(await page.locator('#object-tooltip').isVisible(), true);
    if (point.id.endsWith('book')) await snap(page, 'hover-outline-book');
    await page.mouse.down(); await page.mouse.up();
    await page.waitForSelector('#overlay[data-type="inspection"][open]');
    assert.equal(await page.locator('#scene-canvas').getAttribute('data-inspected'), point.id);
    assert((await state(page)).read.includes(point.id), `Real 3D click opened ${point.id}`);
    assert.equal(await page.locator('#dialogue').textContent(), '', 'Object introduction stays in central inspector');
    const before = await page.locator('#scene-canvas').getAttribute('data-rotation');
    const view = await page.locator('#inspect-viewport').boundingBox();
    await page.mouse.move(view.x + view.width*.45, view.y + view.height*.5); await page.mouse.down();
    await page.mouse.move(view.x + view.width*.7, view.y + view.height*.6, {steps:8}); await page.mouse.up();
    await page.waitForFunction(before => document.querySelector('#scene-canvas').dataset.rotation !== before, before);
    await action(page, 'inspect-reset').click();
    await action(page, 'inspect-left').click();
    assert.notEqual(await page.locator('#scene-canvas').getAttribute('data-rotation'), before, 'Keyboard-compatible rotation changes view');
    await fits(page, `${point.id}-inspection`);
    await close(page);
    await page.mouse.move(10, 10);
    assert.equal(await page.locator('#object-tooltip').isVisible(), false, 'Close removes outline');
  }
  check(`normal-${scene}-real-3d-hotspots`, { points });
}
async function getSceneDocs(page, scene, { repeat = false, allOptional = false } = {}) {
  for (const [hotspot, doc] of docs[scene]) {
    await openObject(page, hotspot);
    assert(await page.locator(`[data-document="${doc}"]`).count());
    await close(page);
    if (repeat) {
      const before = (await state(page)).collected;
      await action(page, 'objects').click();
      const target = page.locator(`#overlay [data-action="hotspot"][data-id="${hotspot}"]`);
      const box = await target.boundingBox();
      await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2, { delay: 20 });
      await settleDialogue(page);
      await close(page);
      assert.deepEqual((await state(page)).collected, before, 'Repeated collection adds no duplicate');
    }
  }
  if (allOptional) for (const id of optional.filter(id => id.startsWith(scene))) { await openObject(page, id); await close(page); }
}
async function solveScene(page, scene, { mistake = false, keyboard = false } = {}) {
  await action(page, 'puzzle').click();
  await fits(page, `${scene}-puzzle-layout`);
  if (mistake) {
    await action(page, 'piece', pieces[scene][0][0]).click();
    await action(page, 'slot', pieces[scene][1][1]).click();
    assert(await page.locator('.feedback.error').count());
    assert.equal(Object.keys((await state(page)).placements[scene] || {}).length, 0, 'Wrong placement cannot advance');
  }
  for (const [piece, slot] of pieces[scene]) {
    if (keyboard) {
      await tabTo(page, `[data-action="piece"][data-id="${piece}"]`); await page.keyboard.press('Enter');
      await tabTo(page, `[data-action="slot"][data-id="${slot}"]`); await page.keyboard.press('Enter');
    } else { await action(page, 'piece', piece).click(); await action(page, 'slot', slot).click(); }
  }
  assert(await action(page, 'solve').isEnabled());
  await action(page, 'solve').click();
  assert.equal((await state(page)).solved[scene], true);
}
async function travel(page, scene) {
  await action(page, 'map').click();
  await action(page, 'travel', scene).click();
  await page.waitForFunction(scene => document.querySelector('#scene-plane').dataset.scene === scene && !document.querySelector('#overlay').open, scene);
  await page.locator('#transition').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
  await page.waitForFunction(scene => JSON.parse(localStorage.getItem('liudeng-chapter-one-v1')).introSeen.includes(scene), scene);
  await settleDialogue(page);
}
async function archiveChecks(page, prefix) {
  await action(page, 'archive').click();
  await action(page, 'archive-doc', 'account').click();
  await action(page, 'archive-mark', 'account').click();
  assert((await state(page)).marked.includes('account'));
  await close(page);
  await action(page, 'archive').click();
  await action(page, 'archive-doc', 'account').click();
  assert.equal(await page.locator('.stamp').textContent(), '已标记');
  await action(page, 'compare-add', 'account').click();
  await action(page, 'archive-doc', 'operations').click();
  await action(page, 'compare-add', 'operations').click();
  await action(page, 'compare').click();
  assert.equal(await page.locator('.compare-grid .sheet').count(), 2);
  await fits(page, `${prefix}-archive-compare`);
  await snap(page, `${prefix}-compare`);
  await page.locator('#overlay [data-action="archive"]').click();
  assert.equal(await page.locator('.archive-item.selected').count(), 2, 'Return from comparison preserves selection');
  await close(page);
  await action(page, 'archive').click();
  assert.equal(await page.locator('.archive-item.selected').count(), 2, 'Close and reopen preserves selection');
  await close(page);
  const before = await state(page);
  await page.reload({ waitUntil: 'networkidle' });
  assert.deepEqual(await state(page), before, 'Refresh must preserve progress and marks');
  await action(page, 'archive').click();
  assert.equal(await page.locator('.archive-item.selected').count(), 2, 'Refresh preserves comparison selection');
  await action(page, 'compare').click();
  assert.deepEqual(await page.locator('.compare-grid .sheet').evaluateAll(nodes => nodes.map(n => n.dataset.document)), ['account', 'operations']);
  await close(page);
  check(`${prefix}-archive-mark-compare-refresh`);
}
async function cancelRestart(page) {
  const before = await state(page);
  await action(page, 'settings').click();
  await page.locator('#overlay [data-action="restart"]').click();
  await page.getByRole('button', { name: '继续当前调查', exact: true }).click();
  assert.deepEqual(await state(page), before, 'Cancel restart preserves all progress');
}
async function reportChecks(page, prefix, mistake) {
  const questions = [
    ['business', 'conditional', 'guaranteed', ['application', 'operations']],
    ['payment', 'unresolved', 'settled', ['account', 'contract', 'payments']],
    ['expansion', 'gap', 'enough', ['application', 'repayment', 'operations', 'budget', 'schedule']],
    ['advice', 'pause', 'approve', []],
    ['followup', 'verify', 'promised', []],
  ];
  for (const [question, correct, wrong, evidence] of questions) {
    assert.equal(await action(page, 'submit').count(), 0, 'Unconfirmed conclusions prevent submission');
    if (mistake) {
      await action(page, 'report-choice', wrong).click();
      await action(page, 'report-check', question).click();
      assert(await page.locator('.feedback.error').count());
      assert.notEqual((await state(page)).report[question]?.confirmed, true);
    }
    await action(page, 'report-choice', correct).click();
    if (mistake && evidence.length) {
      await action(page, 'report-evidence', 'schedule').click();
      await action(page, 'report-check', question).click();
      assert(await page.locator('.feedback.error').count(), 'Correct conclusion alone cannot replace complete evidence');
      await action(page, 'report-evidence', 'schedule').click();
    }
    for (const id of evidence) await action(page, 'report-evidence', id).click();
    if (mistake && question === 'expansion') {
      const draft = (await state(page)).report;
      await page.reload({ waitUntil: 'networkidle' });
      assert.deepEqual((await state(page)).report, draft, 'Report draft survives refresh');
      assert.equal(await page.locator('[data-action="report-evidence"].selected').count(), 5);
    }
    await fits(page, `${prefix}-report-${question}`);
    await action(page, 'report-check', question).click();
    assert.equal((await state(page)).report[question].confirmed, true);
  }
  check(`${prefix}-three-supported-conclusions-advice-followup`, { mistakeCorrection: mistake });
}
async function confirmRestart(page, prefix) {
  await action(page, 'restart').click();
  await action(page, 'confirm-restart').click();
  assert.equal((await state(page)).phase, 'title');
  assert.deepEqual((await state(page)).collected, []);
  assert.deepEqual((await state(page)).solved, {});
  await action(page, 'start').click();
  await settleDialogue(page);
  assert.equal((await state(page)).phase, 'explore');
  assert.deepEqual((await state(page)).collected, ['application', 'repayment']);
  check(`${prefix}-confirmed-restart-and-opening`);
}
async function assemblyAndEnding(page, prefix, mistake = false) {
  await action(page, 'return').click(); await settleDialogue(page);
  assert.equal((await page.locator('[data-testid="balance"]').textContent()).trim(), '22万元');
  await action(page, 'money-piece', 'oven').click();
  await action(page, 'money-piece', 'initial').click();
  assert.equal((await page.locator('[data-testid="balance"]').textContent()).trim(), '0万元');
  await snap(page, `${prefix}-zero`);
  await action(page, 'next-month').click(); await settleDialogue(page);
  for (const id of ['receipts', 'operating', 'preparation', 'repayment', 'newincome']) await action(page, 'money-piece', id).click();
  assert.equal((await page.locator('[data-testid="balance"]').textContent()).trim(), '-5.8万元');
  await fits(page, `${prefix}-funds-layout`);
  await snap(page, `${prefix}-gap`);
  await action(page, 'finish-assembly').click(); await settleDialogue(page);
  if (mistake) {
    await action(page, 'evidence', 'account').click(); await action(page, 'evidence', 'operations').click(); await action(page, 'present').click();
    assert(await page.locator('.feedback.error').count());
    assert.equal(Boolean((await state(page)).solved.presentation), false);
    await action(page, 'evidence', 'account').click(); await action(page, 'evidence', 'operations').click();
  }
  await action(page, 'evidence', 'budget').click(); await action(page, 'evidence', 'schedule').click();
  await action(page, 'present').click(); await settleDialogue(page);
  await reportChecks(page, prefix, mistake);
  assert.match(await page.locator('#overlay-content').textContent(), /0 \+ 18 − 16 − 6 \+ 0 − 1.8 = −5.8/);
  await fits(page, `${prefix}-report-layout`);
  await axe(page, `${prefix}-report`);
  await snap(page, `${prefix}-report`);
  await action(page, 'submit').click(); await settleDialogue(page);
  await page.waitForFunction(() => document.querySelector('#scene-plane').dataset.ready === 'true');
  assert.equal((await state(page)).phase, 'ending');
  assert.equal(await page.locator('#scene-plane').getAttribute('data-scene'), 'ending');
  assert.match(await page.locator('.end-copy').textContent(), /名字还在。日期，先留白。/);
  const final = await state(page);
  assert.equal(final.collected.length, 8);
  assert.equal(new Set(final.collected).size, 8);
  assert.deepEqual(Object.keys(final.solved).sort(), ['assembly', 'bakery', 'newshop', 'presentation', 'supplier']);
  await fits(page, `${prefix}-ending-layout`, ['[data-action="report"]', '[data-action="restart"]']);
  await snap(page, `${prefix}-ending`);
  await axe(page, `${prefix}-ending`);
  await cancelRestart(page);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal((await state(page)).phase, 'ending');
  assert.match(await page.locator('.end-copy').textContent(), /日期，先留白/);
  await action(page, 'report').click();
  assert.match(await page.locator('#overlay-content').textContent(), /建议暂缓原扩张计划/);
  await close(page);
  check(`${prefix}-unique-ending-refresh-report-restart-cancel`);
  await confirmRestart(page, prefix);
  return final;
}
async function rapidTravel(page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await action(page, 'map').click();
  await action(page, 'travel', 'supplier').click();
  await action(page, 'map').click();
  const target = action(page, 'travel', 'newshop');
  const box = await target.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('liudeng-chapter-one-v1')).scene === 'newshop');
  await page.waitForFunction(() => +getComputedStyle(document.querySelector('#transition')).opacity < .01);
  await page.locator('#transition').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('liudeng-chapter-one-v1')).introSeen.includes('newshop'));
  await settleDialogue(page);
  assert.equal(await page.locator('#scene-plane').getAttribute('data-scene'), 'newshop');
  assert.match(await page.locator('.scene-heading h1').textContent(), /新铺子/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check('rapid-map-switch-last-destination-wins');
}
async function scenario(browser, name, options, task) {
  if (process.env.CHAPTER_ONE_SCENARIO && !name.includes(process.env.CHAPTER_ONE_SCENARIO)) return;
  const context = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 900 }, reducedMotion: options.motion || 'reduce', colorScheme: options.colorScheme || 'light', isMobile: !!options.mobile, hasTouch: !!options.mobile });
  const page = await context.newPage(); page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
  page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`); });
  try {
    await task(page);
    assert.deepEqual(errors, [], 'No console errors, page errors, failed resources or HTTP errors');
    report.scenarios.push({ name, status: 'passed', errors });
  } catch (error) {
    await snap(page, `${name}-FAIL`).catch(() => {});
    report.scenarios.push({ name, status: 'failed', error: error.stack, errors });
    report.errors.push({ name, error: error.stack }); console.error(`FAIL ${name}: ${error.stack}`);
  } finally { await context.close(); }
}
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'], ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    await scenario(browser, 'desktop-supplier-first', {}, async page => {
      await start(page, true);
      await fits(page, 'desktop-exploration-layout', ['[data-action="objects"]', '[data-action="puzzle"]']);
      await axe(page, 'desktop-exploration');
      await getSceneDocs(page, 'bakery', { repeat: true, allOptional: true });
      await archiveChecks(page, 'desktop');
      await solveScene(page, 'bakery', { mistake: true, keyboard: true });
      await cancelRestart(page);
      await travel(page, 'supplier'); await getSceneDocs(page, 'supplier', { allOptional: true }); await solveScene(page, 'supplier', { mistake: true });
      await travel(page, 'newshop'); await getSceneDocs(page, 'newshop', { allOptional: true }); await solveScene(page, 'newshop', { mistake: true });
      await snap(page, 'desktop-newshop');
      const final = await assemblyAndEnding(page, 'desktop', true);
      assert(optional.every(id => final.read.includes(id)), 'Every optional object remains playable');
      check('all-18-hotspots-and-keyboard-puzzles');
    });
    await scenario(browser, 'desktop-newshop-first', { colorScheme: 'dark' }, async page => {
      await start(page); await getSceneDocs(page, 'bakery'); await solveScene(page, 'bakery');
      await rapidTravel(page); await getSceneDocs(page, 'newshop'); await solveScene(page, 'newshop');
      await travel(page, 'supplier'); await getSceneDocs(page, 'supplier'); await solveScene(page, 'supplier');
      const final = await assemblyAndEnding(page, 'reverse-dark');
      assert.equal(final.read.filter(id => optional.includes(id)).length, 0, 'Optional objects are not required');
      check('reverse-route-no-optional-objects-dark-mode');
    });
    await scenario(browser, 'desktop-normal-animation', { motion: 'no-preference' }, async page => {
      await start(page);
      await imageHotspots(page, 'bakery'); await getSceneDocs(page, 'bakery'); await solveScene(page, 'bakery');
      await travel(page, 'newshop'); await imageHotspots(page, 'newshop'); await getSceneDocs(page, 'newshop'); await solveScene(page, 'newshop');
      await travel(page, 'supplier'); await imageHotspots(page, 'supplier'); await getSceneDocs(page, 'supplier'); await solveScene(page, 'supplier');
      await assemblyAndEnding(page, 'normal-animation', true);
      check('normal-animation-opening-to-ending-and-restart');
    });
    for (const viewport of [{width:390,height:568},{width:844,height:390}]) await scenario(browser, `short-${viewport.width}`, { viewport, mobile: true }, async page => {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await fits(page, `short-${viewport.width}-title`, ['[data-action="start"]']);
      await start(page);
      await fits(page, `short-${viewport.width}-scene`, ['[data-action="archive"]', '[data-action="map"]', '[data-action="objects"]', '[data-action="puzzle"]']);
      await snap(page, `short-${viewport.width}-scene`);
      await getSceneDocs(page, 'bakery'); await archiveChecks(page, `short-${viewport.width}`); await solveScene(page, 'bakery');
      await travel(page, 'newshop'); await getSceneDocs(page, 'newshop'); await solveScene(page, 'newshop');
      await travel(page, 'supplier'); await getSceneDocs(page, 'supplier'); await solveScene(page, 'supplier');
      await assemblyAndEnding(page, `short-${viewport.width}`);
    });
    for (const width of [390, 320]) await scenario(browser, `mobile-${width}`, { viewport: { width, height: 844 }, mobile: true }, async page => {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await fits(page, `mobile-${width}-title`, ['[data-action="start"]']);
      await snap(page, `mobile-${width}-title`);
      await start(page);
      assert.equal(await page.locator('#scene-plane').evaluate(el => getComputedStyle(el).transform), 'none', 'Reduced motion removes camera motion');
      await fits(page, `mobile-${width}-scene`, ['[data-action="archive"]', '[data-action="map"]', '[data-action="objects"]', '[data-action="puzzle"]']);
      await getSceneDocs(page, 'bakery'); await archiveChecks(page, `mobile-${width}`); await solveScene(page, 'bakery');
      await travel(page, 'supplier'); await getSceneDocs(page, 'supplier'); await solveScene(page, 'supplier');
      await travel(page, 'newshop'); await getSceneDocs(page, 'newshop'); await solveScene(page, 'newshop');
      await assemblyAndEnding(page, `mobile-${width}`);
      check(`mobile-${width}-complete-route-reduced-motion`);
    });
  } finally {
    await browser.close(); report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify(report, null, 2));
  }
  console.log(`Browser checks: ${report.scenarios.filter(s => s.status === 'passed').length}/${report.scenarios.length} scenarios passed; ${report.checks.length} checkpoints.`);
  if (report.errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify({ ...report, fatal: error.stack }, null, 2)); process.exitCode = 1; });
