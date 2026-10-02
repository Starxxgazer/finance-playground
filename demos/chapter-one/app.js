import { FACTS as F, REQUIRED_DOCUMENTS, calculatePlan, canEnterReport, canSubmit, REPORT_CHECKS, checkReportAnswer, formatMoney as money } from './model.js';
import { DOCUMENTS, SCENES, OPENING, ENDING } from './data.js';

const $ = (q) => document.querySelector(q);
const KEY = 'liudeng-chapter-one-v1';
const PLAN = calculatePlan();
const emptyState = () => ({ version: 2, report: {}, compare: [], phase: 'title', scene: 'bakery', collected: [], solved: {}, placements: {}, visited: [], read: [], marked: [], moneyPlaced: [], monthPlaced: [], introSeen: [], settings: { labels: false, reduced: false, sound: false } });
let state = emptyState(), storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved?.version === 1 && Array.isArray(saved.collected)) {
    if (saved.collected.includes('application') && !saved.collected.includes('repayment')) saved.collected.push('repayment');
    saved.report = {}; saved.version = 2;
    if (saved.phase === 'ending') saved.phase = 'report';
  }
  if (saved && saved.version === 2 && ['title','explore','assembly','report','ending'].includes(saved.phase)
      && SCENES[saved.scene] && ['collected','visited','read','marked','moneyPlaced','monthPlaced','introSeen'].every(k => Array.isArray(saved[k]))
      && saved.placements && typeof saved.placements === 'object' && saved.solved && typeof saved.solved === 'object' && saved.settings
      && saved.collected.every(id => REQUIRED_DOCUMENTS.includes(id))
      && (saved.phase !== 'report' || canEnterReport(saved))
      && (saved.phase !== 'ending' || canSubmit(saved))) { state = saved; state.report ||= {}; state.compare = Array.isArray(saved.compare) ? [...new Set(saved.compare)].filter(id=>saved.collected.includes(id)).slice(0,2) : []; }
} catch { storageAvailable = false; }
let dialogue = null, modalType = '', selectedPiece = null, selectedEvidence = [], lastFocus = null;
let toastTimer, travelToken = 0, audioContext, soundGain;
const reduced = () => state.settings.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn = (label, action, klass = 'primary', extra = '') => `<button type="button" class="${klass}" data-action="${action}" ${extra}>${label}</button>`;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageAvailable = false; } };
const has = id => state.collected.includes(id);
const allScenes = () => ['bakery','supplier','newshop'].every(s => state.solved[s]);
const requiredHere = () => SCENES[state.scene].hotspots.filter(h => h.doc).map(h => h.doc);
function toast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3100); }

// Optional quiet synthesized room tone; no external recording or autoplay.
function setSound(enabled) {
  state.settings.sound = enabled;
  if (enabled && !audioContext) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { state.settings.sound = false; toast('此浏览器不支持环境声，可以继续静音游玩。'); return; }
    audioContext = new Audio(); soundGain = audioContext.createGain(); soundGain.gain.value = .018; soundGain.connect(audioContext.destination);
    for (const hz of [130.81,196,261.63]) { const tone = audioContext.createOscillator(); const gain = audioContext.createGain(); tone.type = 'sine'; tone.frequency.value = hz; gain.gain.value = .12; tone.connect(gain).connect(soundGain); tone.start(); }
  }
  if (audioContext) { if (enabled) audioContext.resume().catch(() => {}); else audioContext.suspend().catch(() => {}); }
  save();
}
document.addEventListener('visibilitychange', () => { if (audioContext) { if (document.hidden) audioContext.suspend().catch(() => {}); else if (state.settings.sound) audioContext.resume().catch(() => {}); } });
function hud() {
  return `<header class="hud"><div class="brand"><span class="brand-mark" aria-hidden="true">留灯</span><div><div class="brand-title">这笔钱借给谁</div><div class="brand-meta">第一章 / 排队的面包店</div></div></div><nav class="hud-actions" aria-label="调查工具">${state.phase !== 'title' ? btn(`档案箱 <span class="count">${state.collected.length}/${REQUIRED_DOCUMENTS.length}</span>`, 'archive', 'ghost', 'id="archive-button"') : ''}${state.phase === 'explore' ? btn('走访地图', 'map', 'ghost') : ''}${btn('<span class="settings-label">设置</span><span class="settings-symbol" aria-hidden="true">☷</span>', 'settings', 'ghost', 'aria-label="设置与操作说明"')}</nav></header>`;
}
function render() {
  document.body.classList.toggle('reduce-motion', state.settings.reduced);
  document.body.dataset.phase = state.phase;
  document.body.dataset.scene = state.scene;
  const root = $('#screen'); root.classList.toggle('show-labels', state.settings.labels);
  if (state.phase === 'title') {
    root.innerHTML = `${hud()}<section class="title-screen"><div class="title-copy"><div class="chapter-label">一份留着空白的邀请函</div><h1>灯亮着，<br>面包还热。</h1><p>走进一家排着长队的面包店，<br>看见热闹背后的另一笔账。</p>${btn('推门进去 <span class="arrow">↗</span>','start')}</div></section><footer class="title-bottom"><span>场景调查故事 · 约 10-15 分钟 · 自动保存</span><span>公司、人物与金额均为虚构</span></footer>`;
  } else if (state.phase === 'ending') {
    root.innerHTML = `${hud()}<section class="end-screen"><div class="end-copy"><div class="chapter-label">当天夜里 / 留灯烘焙</div><h1>名字还在。<br>日期，先留白。</h1><p>“今晚先教我一起看账。”</p><p>邀请函放在收支本旁。小禾没有擦掉自己的名字，只把笔轻轻放下。</p><p class="end-note">陈叔暂缓了尚未签约的新店。明天的设备尾款仍待落实，融资审查与付款协商继续；故事没有提前替他们写好结果。</p><div class="end-buttons">${btn('回看调查报告','report')}${btn('再走一遍','restart','ghost')}</div></div></section>`;
  } else {
    const sc = SCENES[state.scene];
    const isExplore = state.phase === 'explore';
    const docsReady = requiredHere().every(has);
    const complete = Boolean(state.solved[state.scene]);
    root.innerHTML = `${hud()}<section class="scene-heading"><h1>${isExplore ? esc(sc.name) : '留灯烘焙 · 桌边'}</h1><p>${isExplore ? esc(sc.time) : '入夜前 / 把后面的钱也摆出来'}</p></section>${isExplore ? `<div class="hotspot-layer" aria-label="场景内可以查看的物件">${sc.hotspots.map(h => `<button type="button" class="hotspot ${state.read.includes(h.id)?'read':''}" data-action="hotspot" data-id="${h.id}" aria-label="查看${esc(h.label)}" style="--x:${h.x}%;--y:${h.y}%"><span class="hotspot-ring" aria-hidden="true"></span><span class="hotspot-label">${esc(h.label)}</span></button>`).join('')}</div>` : ''}<section class="mission"><div><div class="mission-kicker">${isExplore ? (complete ? '这一处，已经核对清楚' : '调查手记') : '原方案 / 假设贷款在明天付款前到账'}</div><h2>${isExplore ? esc(sc.question) : (state.solved.presentation ? '把今天的判断，写成有依据的报告。' : state.solved.assembly ? '缺口看见了，再把依据交给陈叔。' : '两笔付款以后，钱还接得上吗？')}</h2><p class="hint">${isExplore ? (complete ? (allScenes() ? '三处调查完成，可以回到老店把钱摆在同一张桌上。' : '打开走访地图，继续核对另一处的资料。') : '点亮处可以查看；拿到资料后，把它们放在一起核对。') : '金额由账本计算，你来判断资料与时间。'}</p></div><div><div class="mission-progress">${isExplore ? `${requiredHere().filter(has).length} / ${requiredHere().length} 份本处资料` : `${REQUIRED_DOCUMENTS.length} 份核心资料已归档`}</div><div class="mission-buttons">${isExplore ? btn('场景物件', 'objects', 'ghost') : btn('走访地图','map','ghost')}${isExplore ? (complete ? (allScenes() ? btn('回老店核对','return') : btn('继续走访','map')) : btn('摊开资料核对','puzzle','primary',docsReady ? '' : 'disabled')) : btn(state.solved.presentation ? '完成调查报告' : state.solved.assembly ? '出示依据' : '继续摆放',state.solved.presentation ? 'report' : state.solved.assembly ? 'presentation' : 'assembly')}</div></div></section>`;
  }
  renderDialogue(); positionHotspots();
}
function setSceneImage(id) {
  const image = $('#scene-image');
  const path = `assets/${id}.webp`;
  if (image.getAttribute('src') !== path) { image.src = path; }
  image.onload = positionHotspots;
  image.onerror = () => { toast('场景图片未能加载。可继续使用“场景物件”调查，或刷新重试。'); };
}
function positionHotspots() {
  const image = $('#scene-image'); if (!image.naturalWidth) return;
  const box = image.getBoundingClientRect(), game = $('#game').getBoundingClientRect();
  const contain = getComputedStyle(image).objectFit === 'contain';
  const scale = (contain ? Math.min : Math.max)(box.width/image.naturalWidth,box.height/image.naturalHeight);
  const w = image.naturalWidth*scale, h = image.naturalHeight*scale;
  const headingBottom = ($('.scene-heading')?.getBoundingClientRect().bottom || 100) - game.top;
  const missionTop = ($('.mission')?.getBoundingClientRect().top || game.bottom) - game.top;
  for (const el of document.querySelectorAll('.hotspot')) {
    const point = SCENES[state.scene].hotspots.find(v => v.id === el.dataset.id);
    const x = (box.width-w)/2 + point.x/100*w + box.left-game.left;
    const y = (box.height-h)/2 + point.y/100*h + box.top-game.top;
    el.style.setProperty('--x',`${x}px`); el.style.setProperty('--y',`${y}px`);
    el.style.visibility = x < 20 || x > game.width-20 || y < headingBottom+8 || y > missionTop-18 ? 'hidden' : '';
    const label = el.querySelector('.hotspot-label');
    el.classList.toggle('align-right', x > game.width*.68);
    label.style.transformOrigin = x > game.width*.68 ? 'right' : 'left';
  }
}
window.addEventListener('resize', positionHotspots);
// Track the painted object while the camera eases back from a conversation.
// Measuring only at dialogue close leaves the markers at the previous zoom.
let hotspotFrame = 0;
const cameraPlane = $('#scene-plane');
cameraPlane.addEventListener('transitionrun', event => {
  if(event.propertyName !== 'transform') return;
  cancelAnimationFrame(hotspotFrame);
  const track = () => { positionHotspots(); hotspotFrame=requestAnimationFrame(track); };
  track();
});
for(const eventName of ['transitionend','transitioncancel']) cameraPlane.addEventListener(eventName, event => {
  if(event.propertyName !== 'transform') return;
  cancelAnimationFrame(hotspotFrame); positionHotspots();
});
function closeModal() { if ($('#overlay').open) $('#overlay').close(); modalType = ''; selectedPiece = null; $('#world').classList.toggle('focused', Boolean(dialogue)); positionHotspots(); if (lastFocus?.isConnected) lastFocus.focus(); }
function modal(title, subtitle, body, type) {
  const d = $('#overlay'); if (!d.open) lastFocus = document.activeElement;
  modalType = type; d.dataset.type = type;
  $('#overlay-content').innerHTML = `<div class="overlay-head"><div><h2 id="overlay-title">${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${btn('×','close','close','aria-label="关闭窗口"')}</div>${body}`;
  if (!d.open) { d.showModal(); $('.close').focus({preventScroll:true}); } else { $('.close').focus({preventScroll:true}); }
}
$('#overlay').addEventListener('cancel', e => { e.preventDefault(); closeModal(); });
$('#overlay').addEventListener('click', e => { if (e.target === $('#overlay')) { const r = $('#overlay').getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) closeModal(); } });
function focusWorld(x=50,y=45) { $('#scene-plane').style.setProperty('--focus-x',`${x}%`); $('#scene-plane').style.setProperty('--focus-y',`${y}%`); $('#world').classList.add('focused'); }
function speak(lines, after = () => {}, { skip = true } = {}) { closeModal(); dialogue = { lines, index:0, after, skip }; $('#screen').classList.add('talking'); focusWorld(); renderDialogue(); }
const roles = { 陈叔:'留灯烘焙的老板', 小禾:'期待成为店长的店员', 老孟:'设备供应商', 上级:'银行调查组', 旁白:'现场笔记', 你:'新人调查助理' };
function renderDialogue() {
  $('#screen').classList.toggle('talking',Boolean(dialogue));
  if (!dialogue) { $('#dialogue').innerHTML=''; delete $('#dialogue').dataset.speaker; delete $('#dialogue').dataset.visual; return; }
  const line = dialogue.lines[dialogue.index];
  $('#dialogue').dataset.speaker = line.speaker;
  $('#dialogue').dataset.visual = line.visual || '';
  $('#dialogue').innerHTML = `<section class="dialogue-box" aria-label="人物对话"><div class="speaker">${esc(line.speaker)}<span class="speaker-role">${roles[line.speaker] || ''}</span></div><p class="dialogue-text" aria-live="polite">${esc(line.text)}</p><div class="dialogue-tools"><small>${dialogue.index+1} / ${dialogue.lines.length}</small>${btn(dialogue.index===dialogue.lines.length-1?'继续 ↗':'听下去 →','next','dialogue-advance')}${dialogue.skip&&dialogue.lines.length>1?btn('略过这段','skip-dialogue','text-button'):''}</div></section>`;
  $('[data-action="next"]').focus({preventScroll:true});
}
function advance(skip=false) {
  if (!dialogue) return;
  if (!skip && dialogue.index < dialogue.lines.length-1) { dialogue.index++; renderDialogue(); return; }
  const after = dialogue.after; dialogue=null; $('#world').classList.remove('focused'); renderDialogue(); after(); positionHotspots();
}
async function travel(scene) {
  if (!SCENES[scene] || (scene!=='bakery'&&!state.solved.bakery)) return;
  closeModal(); dialogue=null; renderDialogue(); const token=++travelToken;
  const curtain=$('#transition'); curtain.innerHTML=`<h2>${esc(SCENES[scene].name)}</h2><p>沿着街道，再走一段</p>`;
  const duration=reduced()?0:420;
  await curtain.animate([{opacity:0},{opacity:1}],{duration,fill:'forwards'}).finished.catch(()=>{});
  if (token!==travelToken) return;
  state.scene=scene; state.phase='explore'; if(!state.visited.includes(scene)) state.visited.push(scene); save();
  setSceneImage(scene); render();
  await curtain.animate([{opacity:1},{opacity:0}],{duration,fill:'forwards'}).finished.catch(()=>{});
  if(token!==travelToken) return;
  if(!state.introSeen.includes(scene)) { state.introSeen.push(scene);save();speak(SCENES[scene].intro); }
}
function collect(id) { if (!has(id)) { state.collected.push(id); save(); toast(`收入档案箱：${DOCUMENTS[id].title}`); } }
function sheet(id) {
  const d=DOCUMENTS[id];
  return `<article class="sheet" data-document="${id}"><div class="sheet-source"><span>${esc(d.source)}</span><span>${esc(d.kind)}</span></div><h3>${esc(d.title)}</h3><p class="sheet-summary">${esc(d.summary)}</p>${state.marked.includes(id)?'<span class="stamp">已标记</span>':''}<dl class="doc-lines">${d.lines.map(l=>`<div class="doc-row"><dt>${esc(l.label)}</dt><dd>${esc(l.value)}</dd><small>${esc(l.note)}</small></div>`).join('')}</dl><p class="sheet-note">${esc(d.note)}</p></article>`;
}
function documentView(id, back='close') {
  if(!has(id)) return;
  modal('把这一页看清楚','资料已自动收入档案箱，关闭后仍可重看。',`${sheet(id)}<div class="document-actions">${btn(state.marked.includes(id)?'取消标记':'标记这页','mark','secondary',`data-id="${id}" data-back="${back}"`)}${btn(back==='puzzle'?'回到核对':'收好资料',back)}</div>`,'document');
}
function archive(id=state.collected[0]) {
  if(!id) { modal('档案箱','这里收着你取得的资料。','<p>推门进店后，上级会把贷款申请交给你。</p>','archive'); return; }
  const list=state.collected.map(doc=>`<button class="archive-item ${doc===id?'active':''} ${state.compare.includes(doc)?'selected':''}" data-action="archive-doc" data-id="${doc}" aria-pressed="${doc===id}">${esc(DOCUMENTS[doc].title)}<small>${esc(DOCUMENTS[doc].kind)}</small></button>`).join('');
  modal('调查档案箱',`${state.collected.length} / ${REQUIRED_DOCUMENTS.length} 份资料 · ${state.marked.length} 页标记`, `<div class="archive-layout"><div><nav class="archive-list" aria-label="已取得的档案">${list}</nav><div class="archive-toolbar">${btn(state.compare.includes(id)?'撤出比较':'放入比较','compare-add','secondary',`data-id="${id}"`)}${btn(`并排看 ${state.compare.length}/2`,'compare','secondary',state.compare.length===2?'':'disabled')}</div></div><div>${sheet(id)}<div class="document-actions">${btn(state.marked.includes(id)?'取消标记':'标记这页','archive-mark','secondary',`data-id="${id}"`)}</div></div></div>`,'archive');
}
function showMap() {
  modal('今天，去哪里？','先看清老店，再走访另外两处。',`<p class="map-intro">纸面上的钱，各有各的来处。去问经手的人，也去看看还没有发生的事。</p><div class="map-locations">${Object.values(SCENES).map(sc=>`<button class="location" data-action="travel" data-id="${sc.id}" ${sc.id!=='bakery'&&!state.solved.bakery?'disabled':''}><img src="assets/${sc.id}.webp" alt="${esc(sc.name)}"><div><h3>${esc(sc.name)}</h3><p>${esc(sc.time)}</p></div><span class="route-status">${state.solved[sc.id]?'已核对 ✓':sc.id!=='bakery'&&!state.solved.bakery?'稍后开放':'去这里 ↗'}</span></button>`).join('')}</div>${allScenes()?`<div class="overlay-footer">${btn('回老店核对全部资金','return')}</div>`:''}`,'map');
}
function objects() {
  modal('看看周围','亮处都可以查看，也可以用 Tab 和 Enter 操作。',`<div class="presentation-grid">${SCENES[state.scene].hotspots.map(h=>btn(`${esc(h.label)}<small>${state.read.includes(h.id)?'再看一眼':'走近看看'}</small>`,'hotspot','evidence-choice',`data-id="${h.id}"`)).join('')}</div>`,'objects');
}
// Each scene asks the player to classify evidence, never to guess arithmetic.
const PUZZLES = {
  bakery: { title:'热闹，等于现在有钱吗？', intro:'先点一张资料摘记，再点它应放的位置。看日期，也看钱是流进还是流出。', pieces:[
    {id:'cash',label:`账户余额 ${money(F.cash)} 万元`,note:'调查当日 · 已到账',slot:'now'},
    {id:'receipts',label:`预计收款 ${money(F.receipts)} 万元`,note:'老店 · 未来 30 天',slot:'in'},
    {id:'operating',label:`日常支出 ${money(F.operating)} 万元`,note:'老店 · 未来 30 天',slot:'out'}], slots:[{id:'now',label:'现在可以付款',note:'已经到账的余额'},{id:'in',label:'未来预计流入',note:'还需要等经营实际发生'},{id:'out',label:'未来预计流出',note:'维持老店经营的现金支出'}], error:'再看看日期和收支方向：未来预计收款，还没有到账。', success:`现在有 ${money(F.cash)} 万元；未来 30 天预计净流入 ${money(F.receipts)} − ${money(F.operating)} = ${money(PLAN.operatingNet)} 万元。两个“2 万元”不是同一笔钱，净流入也不是净利润。` },
  supplier: { title:'付过的，和还欠的。', intro:'合同说明付款责任，核对页说明实际是否支付。把两份资料里的阶段一一对应。', pieces:[
    {id:'prior',label:'前期付款记录',note:'记录：已收讫、已结清',slot:'past'},
    {id:'tail',label:`本期尾款 ${money(F.oven)} 万元`,note:'合同明天到期 · 收款页未付',slot:'due'},
    {id:'extension',label:'延期安排',note:'双方尚未确认',slot:'unconfirmed'}], slots:[{id:'past',label:'历史付款，不再重复扣减',note:'已经反映在当前余额里'},{id:'due',label:'明天仍须处理的付款',note:'合同与未付记录共同支持'},{id:'unconfirmed',label:'仍待落实，不能当作已有承诺',note:'包括对方确认的延期安排'}],error:'以前结清的款与这一期不同。请对照合同期限、收款状态和延期是否得到确认。',success:'本期 10 万元尾款明天到期，尚未支付；前期已付不重复扣减，目前没有已确认展期。'},
  newshop: { title:'第一炉面包之前。', intro:'把每一张安排放回它的时间。首期投入与筹备支出是两笔钱，不相互包含。',pieces:[
    {id:'initial',label:`首期投入 ${money(F.initial)} 万元`,note:'原计划明天签约时支付',slot:'tomorrow'},
    {id:'preparation',label:`另需筹备款 ${money(F.preparation)} 万元`,note:'首期之外 · 未来 30 天',slot:'month'},
    {id:'opening',label:'预计具备营业条件',note:'仍是计划，不保证盈利',slot:'later'},
    {id:'newincome',label:`新店本期收款 ${money(F.newReceipts)} 万元`,note:'按排期作出的演算假设',slot:'month'}],slots:[{id:'tomorrow',label:'明天 / 签约时',note:'尚未签约，也尚未付款'},{id:'month',label:'未来 30 天 / 筹备中',note:'有后续支出，暂无新店收款'},{id:'later',label:'30 天后 / 才可能开始',note:'预计具备营业条件，仍待实际确认'}],error:'预算中的“另需”不能漏掉。新店预计 30 天后才具备营业条件，未来收入不能提前使用。',success:'明天计划付 12 万元，筹备期另需 6 万元；本章未来 30 天新店收款按 0 演算。开业日期与盈利都没有保证。'}
};
function puzzle(feedback='',isError=false) {
  const id=state.scene, p=PUZZLES[id]; if(!requiredHere().every(has))return;
  state.placements[id] ||= {}; const placed=state.placements[id];
  const done=p.pieces.every(v=>placed[v.id]===v.slot);
  modal(p.title,'把资料摊在桌上',`<p class="puzzle-intro">${p.intro}</p><div class="source-links">${requiredHere().map(doc=>btn(`重看：${esc(DOCUMENTS[doc].title)}`,'source','',`data-id="${doc}"`)).join('')}</div><div class="sort-layout"><div class="pieces" aria-label="资料摘记">${p.pieces.map(v=>btn(`<strong>${v.label}</strong><small>${v.note}</small>`,'piece',`piece ${placed[v.id]?'placed':''} ${selectedPiece===v.id?'selected':''}`,`data-id="${v.id}" aria-pressed="${selectedPiece===v.id}" ${placed[v.id]?'disabled':''}`)).join('')}</div><div class="slots" aria-label="放置位置">${p.slots.map(s=>btn(`<strong>${s.label}</strong><small>${p.pieces.filter(v=>placed[v.id]===s.id).map(v=>v.label+' ✓').join('；') || s.note}</small>`,'slot',`slot ${Object.values(placed).includes(s.id)?'filled':''}`,`data-id="${s.id}"`)).join('')}</div></div><p id="puzzle-feedback" class="feedback ${isError?'error':''} ${done?'success':''}" role="status">${done?p.success:feedback||'点选一张摘记，再选择右侧位置。放错可以修正，不扣机会。'}</p><div class="overlay-footer">${btn(done?'记下结论，继续走访':'完成本处核对','solve','primary',done?'':'disabled')}</div>`,'puzzle');
}
function place(slot) {
  const p=PUZZLES[state.scene], piece=p.pieces.find(v=>v.id===selectedPiece);
  if(!piece) { puzzle('请先点选一张资料摘记。'); return; }
  if(piece.slot!==slot) { puzzle(p.error,true); return; }
  state.placements[state.scene][piece.id]=slot; selectedPiece=null;save();puzzle('这张资料的位置核对好了。');
}
function returnToBakery() {
  if(!allScenes())return; closeModal(); state.scene='bakery';state.phase='assembly';save();setSceneImage('bakery');render();
  if(!state.moneyPlaced.length&&!state.solved.assembly) speak([{speaker:'旁白',text:'客流终于缓下来。陈叔擦出一张桌子，你把各处带回的资料一页页铺开。'},{speaker:'陈叔',text:'现有两万，申请二十万。尾款十万，新店首期十二万。我的打算，都在这儿了。'},{speaker:'你',text:'先假设贷款能在明天付款前到账。我们把付款之后的日子，也算进去。'}],()=>assembly());
  else if(state.solved.presentation) showReport(); else if(state.solved.assembly) presentation(); else assembly();
}
const firstMoney=[{id:'oven',label:'老店烤箱尾款',value:-F.oven,note:'明天到期 · 未支付'},{id:'initial',label:'新店首期投入',value:-F.initial,note:'原计划明天签约时'}];
const monthMoney=[{id:'receipts',label:'老店预计收款',value:F.receipts,note:'未来 30 天 · 预测'},{id:'operating',label:'日常现金支出',value:-F.operating,note:'未来 30 天 · 预测'},{id:'preparation',label:'新店筹备另支出',value:-F.preparation,note:'首期以外 · 预测'},{id:'repayment',label:'案例首期还款',value:-F.repayment,note:'30 天内 · 演算条件'},{id:'newincome',label:'新店本期收款',value:F.newReceipts,note:'按排期演算 · 尚不能营业'}];
const signed = n => `${n>0?'+':''}${money(n)}`;
function assembly(changed=false) {
  if(!allScenes())return;
  const month=state.moneyPlaced.length===firstMoney.length && state.introSeen.includes('zero');
  const pieces=month?monthMoney:firstMoney,placed=month?state.monthPlaced:state.moneyPlaced;
  const balance=(month?PLAN.afterPayments:F.cash+F.loan)+pieces.filter(v=>placed.includes(v.id)).reduce((sum,v)=>sum+v.value,0);
  const done=placed.length===pieces.length;
  modal(month?'再往后，过三十天。':'“那不是正好？”',month?'把后续收支也放进账本':'先假设 20 万元贷款明天付款前到账；尚未批准。',`<div class="money-stage"><div class="money-balance"><p>${month?'本期预计余额':'两笔付款后的现金'}</p><div class="money-number ${balance<0?'negative':''} ${changed?'changed':''}" data-testid="balance">${money(balance)}<span>万元</span></div><div class="money-formula">${month?'从付款后 0 万元开始，把未来 30 天每一项收支接上。':'现有现金 2 + 假设贷款 20 = 22 万元。点选支出，把它放上桌。'}${month&&done?'<p>预计资金缺口 5.8 万元。<br>负数表示方案不能自行平衡，并非账户允许透支。</p>':''}</div></div><div><div class="money-pieces">${pieces.map(v=>btn(`<strong>${signed(v.value)} 万元</strong><small>${v.label}<br>${v.note}</small>`,'money-piece',`piece ${placed.includes(v.id)?'placed':''}`,`data-id="${v.id}" ${placed.includes(v.id)?'disabled':''}`)).join('')}</div><div class="money-tray" aria-live="polite">${pieces.filter(v=>placed.includes(v.id)).map(v=>`<span>${v.label} ${signed(v.value)}</span>`).join('') || '<span>等待把资料放上桌</span>'}</div></div></div><p class="feedback">${month?(done?'新店还没卖出第一个面包，已经开始花钱了。需要用预算和排期向陈叔追问。':'每点一张，账本就把这一项接进来。预测收款尚未实现，贷款也只是演算假设。'):(done?'两笔付款正好花完，余额为 0。接下来的筹备、经营与还款呢？':'尾款是已有责任，新店首期是尚未启动的计划。')}</p><div class="overlay-footer">${state.solved.presentation?btn('回到调查报告','report'):btn(month?'把缺口的依据拿出来':'看看后面的日子',month?'finish-assembly':'next-month','primary',done?'':'disabled')}</div>`,'assembly');
}
function presentation(feedback='',error=false) {
  if(!state.solved.assembly)return;
  modal('这一次，带着依据问。','陈叔相信新店有机会。你要说明，钱为什么在开业之前就接不上。',`<p class="puzzle-intro">“新店开始营业前，筹备和还款的钱准备从哪里来？”<br>选出说明<strong>新店还要花什么钱</strong>、以及<strong>什么时候才能收钱</strong>的两份资料。</p><div class="presentation-grid">${state.collected.map(id=>btn(`${esc(DOCUMENTS[id].title)}<small>${esc(DOCUMENTS[id].kind)}</small>`,'evidence',`evidence-choice ${selectedEvidence.includes(id)?'selected':''}`,`data-id="${id}" aria-pressed="${selectedEvidence.includes(id)}"`)).join('')}</div><p class="feedback ${error?'error':''}" role="status">${feedback||'选错可以重新选择。这里需要预算和时间的相互印证。'}</p><div class="overlay-footer">${btn(`出示这两份资料 (${selectedEvidence.length}/2)`,'present','primary',selectedEvidence.length===2?'':'disabled')}</div>`,'presentation');
}
function showReport() {
  if(!canEnterReport(state)) { toast('还需要收齐资料，并完成各处核对与证据追问。');return; }
  if(!canSubmit(state)) return reportQuestion();
  modal('第一次现场调查报告','留灯烘焙 / 调查当日 / 调查助理提交',`<div class="report-layout"><div><section class="report-section"><h3>生意有期待，预测有条件。</h3><p>现场有顾客排队。老店未来 30 天预计收款 18 万元、日常现金支出 16 万元，预计经营现金净流入 2 万元。它不是净利润，也不是现在到账的现金。</p><div class="references">依据：走访备注、经营记录与预算</div></section><section class="report-section"><h3>明天的付款，仍要落实。</h3><p>当前现金 2 万元，老店烤箱尾款 10 万元明天到期且未支付。没有新资金或已确认展期时，眼前差额为 8 万元。</p><div class="references">依据：账户快照、合同、付款核对页</div></section><section class="report-section"><h3>原扩张方案，接不上后面的钱。</h3><p>假设申请的 20 万元按时到账，付尾款和新店首期后余 0。接上 30 天收支：0 + 18 − 16 − 6 + 0 − 1.8 = −5.8 万元。</p><div class="references">依据：申请及还款示例、新店预算与排期、老店预算</div></section></div><aside class="report-warning"><h3>建议暂缓原扩张计划</h3><p>当前紧急差额 <strong>8</strong> 万元<br>原方案预计缺口 <strong>5.8</strong> 万元</p><p>优先落实尾款支付与后续资金安排。尚未签约的新店可暂缓 12 万元与 6 万元新增支出，旧债不会因此消失。</p><p>继续核实：融资能否批准并按时到账；供应商是否书面确认延期；经营预测能否实现。</p><p>月末余额不能保证每一天或整个贷款期限都安全。玩家提供调查依据，不批准贷款。</p></aside></div><div class="overlay-footer">${btn('回看资金推演','review-assembly','secondary')}${state.phase==='ending'?btn('回到尾声','close'):btn('将报告交给上级','submit')}</div>`,'report');
}
const REPORT_QUESTIONS = {
  business: { title: '热闹的生意，能说明什么？', choices: [['guaranteed','排队说明新店一定赚钱，预计收款就是已有现金。'],['conditional','产品有受欢迎的迹象；老店预计净流入为正，仍属预测。']], hint: '现场观察只能说明当时的客流。经营预算中的钱尚未到账。', evidenceHint:'附上记录现场观察与老店收支预测的两份资料。' },
  payment: { title: '明天的尾款，安排好了吗？', choices: [['unresolved',`当前现金 ${money(F.cash)} 万元，明天尾款 ${money(F.oven)} 万元仍未支付，差额 ${money(PLAN.urgentGap)} 万元待落实。`],['settled','暂缓新店后，老店尾款也已经解决。']], hint:'暂停新增支出不取消旧的付款责任。请核对余额、到期责任和实际支付情况。', evidenceHint:'用三份资料分别支持当前余额、付款期限与尚未支付。' },
  expansion: { title: '“正好够”之后，还差什么？', choices: [['enough','贷款加现金正好付两笔款，原方案没有资金问题。'],['gap',`假设申请按时到账，原方案未来 30 天预计缺口 ${money(PLAN.gap)} 万元。`]], hint:'两笔付款后为零，筹备期间还有经营收支和首期还款。新店尚未开始收款。', evidenceHint:'附上贷款申请、还款条件、老店预算、新店预算与排期，共五份；账户和尾款已在上一项核对。' },
  advice: { title: '调查助理的建议是什么？', choices: [['approve','直接批准原贷款申请，让公司按原计划扩张。'],['pause','建议暂缓原扩张计划，优先核实尾款支付与后续资金安排。']], hint:'调查助理无权批准贷款。资金时间线揭示的问题，需要先落实安排。', evidenceHint:'依据：已经完成并经核对的资金时间线。' },
  followup: { title: '哪些事仍需上级继续落实？', choices: [['verify','融资能否获批并按时到账、供应商是否书面同意延期、经营预测能否实现。'],['promised','资料齐全，因此融资和延期已经确定，预测可以保证实现。']], hint:'调查完整不等于未来确定。申请、延期和预测都不能写成已有承诺。', evidenceHint:'把尚未确定的安排明确列为待落实事项。' },
};
function reportQuestion(feedback='',error=false) {
  if(!canEnterReport(state))return;
  const ids=Object.keys(REPORT_CHECKS);
  const id=ids.find(key=>!state.report[key]?.confirmed || !checkReportAnswer(key,state.report[key]));
  if(!id)return showReport();
  const q=REPORT_QUESTIONS[id], draft=state.report[id] ||= {choice:'',evidence:[]};
  modal('把判断写进报告',`银行调查组 / 第 ${ids.indexOf(id)+1} 项，共 ${ids.length} 项`, `<h3>${q.title}</h3><p class="puzzle-intro">选择有依据的判断。上级会逐项核对，选错可以修正。</p><div class="presentation-grid">${q.choices.map(([value,label])=>btn(label,'report-choice',`evidence-choice ${draft.choice===value?'selected':''}`,`data-id="${value}" data-question="${id}" aria-pressed="${draft.choice===value}"`)).join('')}</div><p class="puzzle-intro">${q.evidenceHint}</p>${REPORT_CHECKS[id].evidence.length?`<div class="presentation-grid">${state.collected.map(doc=>btn(esc(DOCUMENTS[doc].title),'report-evidence',`evidence-choice ${draft.evidence.includes(doc)?'selected':''}`,`data-id="${doc}" data-question="${id}" aria-pressed="${draft.evidence.includes(doc)}"`)).join('')}</div>`:''}<p class="feedback ${error?'error':''}" role="status">${feedback||'核对后才会把本项正式写入报告。'}</p><div class="overlay-footer">${btn('请上级核对这一项','report-check','primary',`data-id="${id}" ${draft.choice?'':'disabled'}`)}</div>`,'report-question');
}

function settings() {
  modal('按自己的节奏调查','不计时；判断可以修正。',`<div class="settings-list"><label class="settings-row"><span>始终显示物件名称</span><input type="checkbox" data-setting="labels" ${state.settings.labels?'checked':''}></label><label class="settings-row"><span>减少镜头移动与动画</span><input type="checkbox" data-setting="reduced" ${state.settings.reduced?'checked':''}></label><label class="settings-row"><span>轻声环境音</span><input type="checkbox" data-setting="sound" ${state.settings.sound?'checked':''}></label><p class="settings-help">点击亮处调查，或打开“场景物件”逐项查看。<br>Tab 切换焦点，Enter 确认；对话中按空格继续；Esc 关闭资料。全部整理都能点选完成，不需要拖动。<br>${storageAvailable?'进度保存在当前浏览器，可刷新后继续。':'当前浏览器不允许保存，仍可完成本次试玩。'}<br>本章公司、人物、金额及贷款条件均为虚构。</p><div class="overlay-footer">${btn('重新开始','restart','secondary')}${btn('回到故事','close')}</div></div>`,'settings');
}
function restart() { modal('重新走进这家店？','这会清除本章保存在当前浏览器的进度。',`<p>你可以取消，接着眼下的调查继续。</p><div class="overlay-footer">${btn('继续当前调查','close','secondary')}${btn('确认重新开始','confirm-restart')}</div>`,'restart'); }

// One delegated handler prevents duplicate subscriptions when paper contents change.
document.addEventListener('click', e => {
  const target=e.target.closest('button[data-action]'); if(!target || target.disabled)return;
  const { action, id }=target.dataset;
  if(action==='close')return closeModal();
  if(action==='next')return advance();
  if(action==='skip-dialogue')return advance(true);
  if(action==='start') { setSceneImage('bakery');state.phase='explore';state.visited=['bakery'];collect('application');collect('repayment');save();render();speak(OPENING,()=>{state.introSeen.push('bakery');save();toast('点击亮处调查；资料会自动收入档案箱。');});return; }
  if(action==='hotspot') {
    const h=SCENES[state.scene].hotspots.find(h=>h.id===id);if(!h)return;
    if(!state.read.includes(id))state.read.push(id);save();
    speak(h.dialogue,()=>{if(h.doc){collect(h.doc);render();documentView(h.doc);}else render();});focusWorld(h.x,h.y);return;
  }
  if(action==='archive')return archive();
  if(action==='archive-doc')return archive(id);
  if(action==='mark'||action==='archive-mark') { state.marked=state.marked.includes(id)?state.marked.filter(d=>d!==id):[...state.marked,id];save();return action==='mark'?documentView(id,target.dataset.back):archive(id); }
  if(action==='compare-add') { if(state.compare.includes(id))state.compare=state.compare.filter(v=>v!==id);else if(state.compare.length<2)state.compare.push(id);else{toast('比较台已有两份；先撤出一份再换。');}save();return archive(id); }
  if(action==='compare')return modal('并排核对','看同一笔钱的责任、实际支付与发生时间。',`<div class="compare-grid">${state.compare.map(sheet).join('')}</div><div class="overlay-footer">${btn('回到档案箱','archive','secondary')}</div>`,'compare');
  if(action==='map')return showMap();
  if(action==='travel')return travel(id);
  if(action==='objects')return objects();
  if(action==='puzzle') { selectedPiece=null;return puzzle(); }
  if(action==='source')return documentView(id,'puzzle');
  if(action==='piece') { selectedPiece=id;puzzle();$(`.slot`)?.focus({preventScroll:true});return; }
  if(action==='slot')return place(id);
  if(action==='solve') {
    const p=PUZZLES[state.scene];if(!p.pieces.every(v=>state.placements[state.scene]?.[v.id]===v.slot))return;
    state.solved[state.scene]=true;save();closeModal();render();toast('这一处的结论已写入调查手记。');return;
  }
  if(action==='return')return returnToBakery();
  if(action==='assembly')return assembly();
  if(action==='money-piece') { const month=state.moneyPlaced.length===firstMoney.length&&state.introSeen.includes('zero');const list=month?state.monthPlaced:state.moneyPlaced;const allowed=month?monthMoney:firstMoney;if(allowed.some(p=>p.id===id)&&!list.includes(id))list.push(id);save();return assembly(true); }
  if(action==='next-month') { if(state.moneyPlaced.length!==firstMoney.length)return;state.introSeen.push('zero');save();speak([{speaker:'小禾',text:'两万加二十万，十万加十二万……那不是正好？'},{speaker:'旁白',text:'最后一笔落下，桌面上的余额归零。你没有合上账本，而是翻到了下一页。'},{speaker:'你',text:'这是两笔付款的终点。接下来三十天，才刚开始。'}],()=>assembly());return; }
  if(action==='finish-assembly') { if(state.monthPlaced.length!==monthMoney.length)return;state.solved.assembly=true;save();closeModal();render();speak([{speaker:'小禾',text:'它还没卖出第一个面包，已经开始花钱了。'},{speaker:'陈叔',text:'我做了这么多年，看得出那里有机会。我也已经告诉大家，今年会开第二家。'}],()=>presentation());return; }
  if(action==='presentation')return presentation();
  if(action==='evidence') { if(selectedEvidence.includes(id))selectedEvidence=selectedEvidence.filter(v=>v!==id);else if(selectedEvidence.length<2)selectedEvidence.push(id);else{return presentation('已选两份。先取消其中一份，再换上另一份。',true);}return presentation(); }
  if(action==='present') {
    if(selectedEvidence.length!==2||!['budget','schedule'].every(v=>selectedEvidence.includes(v)))return presentation('这两份还没同时说明“额外支出”和“开业前没有收入”。再核对新店的预算与排期。',true);
    state.solved.presentation=true;state.phase='report';save();closeModal();render();
    speak([{speaker:'你',text:'机会可以是真的，但原计划里，还没有落实补上这 5.8 万元的钱。开业后的收款，不能拿来付开业前的支出。'},{speaker:'陈叔',text:'是我把前后的钱想得太近了。新铺子的约，我先不签，给房东说一声。老店的尾款还得继续谈。'},{speaker:'小禾',text:'日期还能改。先把后面的钱算清楚。'}],()=>showReport());return;
  }
  if(action==='report-choice'||action==='report-evidence') {
    const question=target.dataset.question;const draft=state.report[question];if(!draft)return;
    if(action==='report-choice')draft.choice=id;
    else draft.evidence=draft.evidence.includes(id)?draft.evidence.filter(doc=>doc!==id):[...draft.evidence,id];
    save();return reportQuestion();
  }
  if(action==='report-check') {
    if(!checkReportAnswer(id,state.report[id]))return reportQuestion(state.report[id]?.choice!==REPORT_CHECKS[id].answer?REPORT_QUESTIONS[id].hint:'判断方向对了，附上的依据还需核对。'+REPORT_QUESTIONS[id].evidenceHint,true);
    state.report[id].confirmed=true;save();return reportQuestion();
  }
  if(action==='report')return showReport();
  if(action==='review-assembly')return assembly();
  if(action==='submit') { if(!canSubmit(state))return;closeModal();state.phase='ending';save();render();speak(ENDING.slice(1,3),()=>{setSceneImage('ending');render();speak([{speaker:'旁白',text:'当晚，小禾发来一张照片。邀请函放在收支本旁，店长的名字还在，日期仍然空着。'},{speaker:'小禾',text:'陈叔说，明天跟老孟继续把付款安排谈清楚。今晚先教我一起看账。下次先把钱算清楚，再写日期。'}],()=>render());});return; }
  if(action==='settings')return settings();
  if(action==='restart')return restart();
  if(action==='confirm-restart') { travelToken++;dialogue=null;selectedEvidence=[];const previous=state.settings;state=emptyState();state.settings=previous;save();closeModal();setSceneImage('opening');$('#world').classList.remove('focused');$('#transition').getAnimations().forEach(a=>a.cancel());render();return; }
});
document.addEventListener('change', e=>{const setting=e.target.dataset.setting;if(!setting)return;if(setting==='sound')setSound(e.target.checked);else{state.settings[setting]=e.target.checked;save();render();}});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&dialogue&&!$('#overlay').open&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();if(!e.repeat)advance();}});
setSceneImage(state.phase==='title'?'opening':state.phase==='ending'?'ending':state.scene);render();
if(state.phase==='report')showReport();
