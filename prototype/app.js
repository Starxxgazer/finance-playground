(() => {
  'use strict';
  const S = window.STORY, M = window.GameModel, KEY = 'loan-story-v1';
  const main = document.querySelector('#main');
  const steps = ['intro', 'investigate', 'timeline', 'confront', 'decision', 'ending'];
  let state = M.fresh(), activePerson = null, message = '', selectedPiece = 'balance', notice = '';
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (valid(saved)) state = saved;
  } catch { notice = '浏览器未能读取进度，本轮仍可正常试玩。'; }
  function valid(s) {
    if (!s || s.version !== 1 || !steps.includes(s.step)) return false;
    for (const [key, dictionary] of [['evidence', S.evidence], ['visited', S.people], ['deep', S.people], ['support', S.evidence]]) {
      if (!Array.isArray(s[key]) || new Set(s[key]).size !== s[key].length || s[key].some(x => !Object.hasOwn(dictionary, x))) return false;
    }
    if (s.deep.length > 2 || !s.deep.every(x => s.visited.includes(x)) || !s.support.every(x => s.evidence.includes(x))) return false;
    if (!['expand', 'adjust'].includes(s.tab) || (s.choice && !Object.hasOwn(S.choices, s.choice)) || (s.risk && !Object.hasOwn(S.risks, s.risk))) return false;
    if (!s.placed || typeof s.placed !== 'object' || Array.isArray(s.placed) || Object.entries(s.placed).some(([id, time]) => !['balance', 'due', 'ledger'].includes(id) || S.evidence[id].time !== time)) return false;
    if (!Array.isArray(s.seen) || s.seen.some(x => !['expand', 'adjust', 'hold'].includes(x)) || !Number.isFinite(s.started)) return false;
    if (typeof s.confronted !== 'string' || (s.confronted && !['due', 'lease', 'schedule'].includes(s.confronted))) return false;
    if (steps.indexOf(s.step) >= 2 && (s.visited.length !== 3 || !['ledger', 'due', 'lease'].every(id => s.evidence.includes(id)))) return false;
    if (steps.indexOf(s.step) >= 3 && Object.keys(s.placed).length !== 3) return false;
    if (steps.indexOf(s.step) >= 4 && !s.confronted) return false;
    if (s.step === 'ending' && (!s.choice || !s.risk || s.support.length < 2 || !Number.isFinite(s.finished))) return false;
    return true;
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { notice = '当前浏览器不允许保存进度；关闭或刷新后需重新开始。'; } }
  function say(text) { document.querySelector('#announcement').textContent = text; }
  function go(step) { state.step = step; message = ''; save(); render(); main.focus(); window.scrollTo(0, 0); }
  function grant(ids) { state.evidence = [...new Set([...state.evidence, ...ids])]; }
  function button(action, text, cls = 'primary', extra = '') { return `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`; }
  function label(text) { return `<p class="eyebrow">${text}</p>`; }
  function title(kicker, heading, desc) { return `<header class="section-title">${label(kicker)}<h1>${heading}</h1><p>${desc}</p></header>`; }
  function evidence(id, compact = false) { const e = S.evidence[id]; return `<article class="evidence ${compact ? 'compact' : ''}"><div class="evidence-meta"><span>${e.type}</span><span>${id === 'loan' ? '待核实' : '已取得'}</span></div><h3>${e.title}</h3><p>${e.text}</p><small>${e.source}</small></article>`; }
  function render() {
    const playing = state.step !== 'intro';
    document.querySelector('#archive-button').hidden = !playing;
    document.querySelector('#restart-button').hidden = !playing;
    document.querySelector('#evidence-count').textContent = state.evidence.length;
    const nav = document.querySelector('#progress'); nav.hidden = !playing;
    nav.innerHTML = ['走访', '追踪资金', '当面追问', '你的建议', '后续来信'].map((x, i) => `<span ${steps.indexOf(state.step) === i + 1 ? 'aria-current="step"' : ''} class="${steps.indexOf(state.step) > i + 1 ? 'done' : ''}"><b>${i + 1}</b>${x}</span>`).join('');
    main.innerHTML = ({ intro, investigate, timeline, confront, decision, ending })[state.step]() + (notice ? `<p class="notice">${notice}</p>` : '');
    if (state.step === 'decision') main.querySelector('form').addEventListener('submit', submit);
  }
  function intro() {
    return `<section class="intro"><div class="intro-copy">${label('候选故事 · 排队的面包店')}<h1>每天都排队，<br>为什么还缺钱？</h1><p class="intro-summary">老板要借20万开新店。你的店员朋友却问：<br>“这次贷款，能保住老店吗？”</p>${button('start', '接下这次调查 <span aria-hidden="true">↗</span>')}</div><figure class="scene"><img src="assets/bakery.webp" alt="社区面包店外排着长队，店员站在门口，神情担忧" width="1536" height="1024" fetchpriority="high"><figcaption><span>今日 09:10 · 店门口</span><span>扩张，还是救急？</span></figcaption></figure></section><aside class="brief"><span class="brief-mark">你的身份</span><p>你是虚构银行的新人调查助理。明天前，给出你的建议。<br><span class="muted">找三个人聊聊，把钱的去向拼起来。计算交给我们，判断留给你。</span></p><span class="duration">3–5<small>分钟一局</small></span></aside>`;
  }
  function investigate() {
    const p = activePerson ? S.people[activePerson] : null;
    return title('上午 · 店内走访', '说法对不上。先找谁？', '先听三个人的说法，再任选两次深挖。阅读和回看证据不消耗次数。') + `<div class="investigation-layout"><section class="people" aria-label="调查人物">${Object.entries(S.people).map(([id, person]) => `<button data-action="visit" data-id="${id}" class="person ${activePerson === id ? 'selected' : ''}"><span class="avatar">${person.initial}</span><span><strong>${person.name}</strong><small>${person.role}</small><span class="person-lead">${person.lead}</span></span><span class="visit-status">${state.visited.includes(id) ? '已走访' : '去聊聊 ↗'}</span></button>`).join('')}<div class="action-count"><span>可用深挖次数</span><strong>${2 - state.deep.length}<small> / 2</small></strong></div></section><section class="conversation" aria-label="人物对话">${p ? `<div class="speaker"><span>${p.location}</span><h2>${p.name}</h2></div><p class="question">你：${p.question}</p><blockquote>${state.deep.includes(activePerson) ? p.deepAnswer : p.answer}</blockquote><div class="found"><small>${state.deep.includes(activePerson) ? '本次深挖取得' : '走访取得'}的证据</small><p>${(state.deep.includes(activePerson) ? p.deepGrants : p.grants).map(id => S.evidence[id].title).join(' · ')}</p></div>${button('deep', state.deep.includes(activePerson) ? '这条线已经深挖过' : p.deep, 'secondary', `data-id="${activePerson}" ${state.deep.includes(activePerson) || state.deep.length >= 2 ? 'disabled' : ''}`)}` : `<div class="empty-dialogue"><span class="big-question">?</span><h2>同一家店，三种着急。</h2><p>选择一位人物，听听他知道什么。<br>每次走访都会带回新的证据。</p></div>`}</section></div><div class="investigation-bottom"><p>${state.visited.length < 3 ? `已走访 ${state.visited.length} / 3 人。三种说法拼在一起，才看得到钱的去向。` : state.deep.length < 2 ? `三个人都聊过了。你还可以深挖${2 - state.deep.length}次，也可以带着现有证据继续。` : '调查时间用完。线索够了吗？去看看钱能撑多久。'}</p>${button('to-timeline', '整理资金时间线 →', 'primary', state.visited.length < 3 ? 'disabled' : '')}</div>`;
  }
  const pieces = ['balance', 'due', 'ledger'];
  function timeline() {
    const done = pieces.every(id => state.placed[id]);
    return title('午后 · 调查工位', '钱会来，但来得及吗？', '先点一张证据，再点它发生的时间。电脑也可以拖放；放错可以重试。') + `<section class="puzzle" aria-label="资金时间线"><div class="piece-tray">${pieces.map(id => `<button draggable="${!state.placed[id]}" data-action="piece" data-id="${id}" class="piece ${selectedPiece === id && !state.placed[id] ? 'selected' : ''}" ${state.placed[id] ? 'disabled' : ''}><small>${state.placed[id] ? '已归位' : '待归位'}</small><strong>${S.evidence[id].title}</strong><span>${id === 'balance' ? '可用 2 万' : id === 'due' ? '要付 10 万' : '预计净流入 2 万'}</span></button>`).join('')}</div><div class="time-slots">${[['now', '现在', '已经到账'], ['tomorrow', '明天', '付款期限'], ['month', '未来30天', '经营预测']].map(([key, name, sub]) => `<button data-action="place" data-time="${key}" class="time-slot"><small>${sub}</small><h3>${name}</h3><p>${pieces.filter(id => state.placed[id] === key).map(id => S.evidence[id].title).join('') || '把证据放到这里 ＋'}</p></button>`).join('')}</div><p class="puzzle-feedback" role="status">${message || (done ? '拼好了：未来30天赚的钱，付不了明天到期的尾款。' : '先选证据，再选时间；不考心算。')}</p></section>${done ? comparison() : ''}<div class="actions end">${button('back-investigate', '返回调查', 'quiet')}${button('to-confront', '带着证据去问老板 →', 'primary', done ? '' : 'disabled')}</div>`;
  }
  function comparison() {
    const c = M.calculate(state.tab), expand = state.tab === 'expand';
    return `<section class="comparison" aria-label="资金方案对比"><div class="comparison-top"><h2>同一家店，两种用法。</h2><div class="segmented" role="group" aria-label="选择测算方案">${button('plan', '20万 · 立即扩张', state.tab === 'expand' ? 'active' : '', 'data-plan="expand" aria-pressed="' + expand + '"')}${button('plan', '10万 · 暂缓扩张', state.tab === 'adjust' ? 'active' : '', 'data-plan="adjust" aria-pressed="' + !expand + '"')}</div></div><div class="cash-story"><div class="cash-calculation"><div><span>付完明天的款</span><strong>${M.format(c.immediate)}<small>万元</small></strong><p>${expand ? '2 + 20 − 10 − 12 = 0' : '2 + 10 − 10 = 2'}</p><small>现有现金 + 贷款 − 尾款${expand ? ' − 新店首期投入' : ''}</small></div><span class="flow-arrow" aria-hidden="true">→</span><div><span>再过30天</span><p class="equation">${M.format(c.immediate)} + 2 ${expand ? '− 6 ' : ''}− ${M.format(c.repayment)}</p><small>期初现金 + 老店净流入${expand ? ' − 新店额外支出' : ''} − 还款</small></div></div><div class="cash-result"><span>${expand ? '预计资金缺口' : '预计月末现金'}</span><strong data-testid="cash-result">${M.format(c.end)}<small>万</small></strong><p>${expand ? '铺子拿到了，周转的钱没了。' : '保留老店，先放下新店。'}</p></div></div><p class="assumption">${state.evidence.includes('schedule') ? '排期证据：新店首月预计收款为0。' : '未核实：尚未取得开业排期。此处以首月新店收款为0作保守测算。'}老店18万收款、16万支出均为预测；还款额为游戏给定条件。</p></section>`;
  }
  function confront() {
    return title('下午 · 再见老板', '这次，你带了证据。', '选一张材料摆到他面前。让问题更具体，才会有新的回答。') + `<div class="confront-layout"><section class="confront-options" aria-label="选择追问证据">${['due', 'lease', 'schedule'].filter(id => state.evidence.includes(id)).map(id => `<button class="confront-card ${state.confronted === id ? 'selected' : ''}" data-action="confront" data-id="${id}"><small>${S.evidence[id].type}</small><h3>${S.evidence[id].title}</h3><p>${id === 'due' ? '钱是为开新店借的，还是为付旧账？' : id === 'lease' ? '首期12万之外，后面的6万从哪来？' : '30天后才开业，为什么说很快就能赚钱？'}</p><span>出示证据 ↗</span></button>`).join('')}</section><section class="conversation"><div class="speaker"><span>柜台后的沉默</span><h2>陈老板</h2></div><blockquote>${state.confronted ? ({ due: '“都有。老店的10万尾款必须付，新店首期又要12万。我以为贷款一到，这两件事就都解决了。”', lease: '“我盯着明天的签约，没把后面的6万算进去。老店一个月净进2万，确实撑不起新店和还款。”', schedule: '“你说得对。开门之前没有新店收入。我把未来想得太近，把眼前的钱算得太满。”' })[state.confronted] : '“你还有什么想问的？”'}</blockquote>${state.confronted ? '<p class="annotation">真相不只是“好老板”或“坏老板”。<br>老店能赚钱，扩张仍可能拖垮周转。</p>' : '<p class="muted">左侧选一张你取得的证据。</p>'}</section></div><div class="actions end">${button('back-timeline', '再算一次', 'quiet')}${button('to-decision', '我准备好给建议了 →', 'primary', state.confronted ? '' : 'disabled')}</div>`;
  }
  function decision() {
    return title('下班前 · 提交建议', '机会、工作，和明天的账。', '你提交的是调查建议，由故事中的上级审批。选择本身与推理依据会分别复盘。') + `<form><div class="decision-layout"><fieldset class="decision-options"><legend>你的建议</legend>${Object.entries(S.choices).map(([id, c]) => `<label class="choice ${state.choice === id ? 'selected' : ''}"><input type="radio" name="choice" value="${id}" ${state.choice === id ? 'checked' : ''} required><span><strong>${c.title}</strong><small>${c.desc}</small></span></label>`).join('')}</fieldset><div class="decision-evidence"><fieldset><legend>支持判断的证据 <small>至少选2张</small></legend><div class="check-list">${state.evidence.map(id => `<label><input type="checkbox" name="support" value="${id}" ${state.support.includes(id) ? 'checked' : ''}><span>${S.evidence[id].title}<small>${S.evidence[id].type}</small></span></label>`).join('')}</div></fieldset><label class="risk-label" for="risk">还有哪个风险没有消失？</label><select id="risk" name="risk" required><option value="">选一个你仍担心的问题</option>${Object.entries(S.risks).map(([id, t]) => `<option value="${id}" ${state.risk === id ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div><p id="form-error" class="puzzle-feedback" role="alert">${message}</p><div class="actions end">${button('back-confront', '回看对话', 'quiet')}<button type="submit" class="primary">交出建议，看看后来 →</button></div></form>`;
  }
  function ending() {
    const c = state.choice, category = S.choices[c].category, results = M.calculate(c);
    const e = { ...S.endings[c], number: results.end === null ? '8' : M.format(results.end) };
    return `<section class="ending-head">${label(`后续来信 · 已见 ${new Set(state.seen).size} / 3 类结局`)}<h1>${e.title}</h1><p>你的建议：${S.choices[c].title}</p></section><div class="ending-layout"><article class="letter"><span class="letter-label">致调查助理</span><blockquote>${e.letter}</blockquote><p class="signature">${e.sender}</p></article><aside class="ending-result"><span>${e.summary}</span><strong>${e.number}<small>${e.unit}</small></strong><p>${e.explanation}</p></aside></div><section class="xray"><h2>公司透视图</h2><div class="xray-grid"><div><small>钱怎么来</small><h3>老店卖面包</h3><p>30天预计收18万、支16万，净流入2万。客流不等于可用现金。</p></div><div><small>钱去了哪里</small><h3>旧账 + 新店</h3><p>设备尾款10万；若扩张，再付首期12万及首月6万，分别计入。</p></div><div><small>异常怎么发生</small><h3>期限错位</h3><p>现金只有2万，尾款明天到期。未来净流入无法提前使用。</p></div><div><small>还不能确定</small><h3>${state.evidence.includes('schedule') ? '预测与执行' : '排期与执行'}</h3><p>${state.evidence.includes('schedule') ? '排期和收款仍是预测；暂缓扩张、专款用途要真正执行。' : '本轮没有查到排期；首月0收款是比较情景，仍需核实。'}尾款展期未确认。</p></div></div></section><section class="review"><h2>你的判断，依据够不够？</h2><p>${M.assess(c, state.support, state.risk, state.evidence.includes('schedule'))}</p><p class="muted">你引用：${state.support.map(id => S.evidence[id].title).join('、')}。<br>你保留的风险：${S.risks[state.risk]}。</p><details><summary>展开相同条件下的方案对照</summary><p>20万并扩张：2 + 20 − 10 − 12 + 18 − 16 − 6 − 1.8 = −5.8万。<br>10万且暂缓：2 + 10 − 10 + 18 − 16 − 0.9 = 3.1万。<br>暂缓或拒绝：明天仍差10 − 2 = 8万，月末情况不能确定。</p></details></section><div class="ending-actions">${button('rewind', '换一个决定，看看另一种后来', 'primary')}${button('ask-restart', '从头再调查', 'secondary')}<small>回溯保留证据与相同外部条件；从头开始可换一条调查路线。</small></div><p class="ending-note">本轮仅模拟约定时间节点，不代表长期安全或真实授信结论。故事是否有趣，仍需要你的试玩反馈。</p>`;
  }
  function submit(event) {
    event.preventDefault();
    if (state.support.length < 2) { message = '请至少引用2张证据，再交出建议。'; document.querySelector('#form-error').textContent = message; document.querySelector('#form-error').scrollIntoView({ block: 'center' }); return; }
    if (!S.choices[state.choice] || !S.risks[state.risk]) return;
    state.finished = Date.now(); state.seen = [...new Set([...state.seen, S.choices[state.choice].category])]; go('ending');
  }
  function openArchive() { document.querySelector('#archive-content').innerHTML = `<p class="muted">已取得 ${state.evidence.length} / 8 张。人物说法不是已证实事实；经营预测也不是已经到账的钱。</p><div class="archive-grid">${state.evidence.map(id => evidence(id)).join('')}</div>`; document.querySelector('#archive').showModal(); }
  function place(time) {
    if (!selectedPiece || state.placed[selectedPiece]) { message = '先选一张尚未归位的证据。'; }
    else if (S.evidence[selectedPiece].time !== time) { message = selectedPiece === 'ledger' ? '这2万还没到账，是未来30天的预测。再想想它属于什么时候。' : selectedPiece === 'due' ? '看看付款通知：10万尾款明天到期。' : '这2万元已经在账户里，可以现在使用。'; }
    else { state.placed[selectedPiece] = time; message = '归位正确。'; selectedPiece = pieces.find(id => !state.placed[id]) || ''; if (!selectedPiece) message = '拼好了：未来30天赚的钱，付不了明天到期的尾款。'; }
    save(); render(); say(message);
  }
  document.addEventListener('click', event => {
    const b = event.target.closest('button[data-action]'); if (!b || b.disabled) return;
    const a = b.dataset.action, id = b.dataset.id;
    if (a === 'start') { state.started = Date.now(); go('investigate'); }
    else if (a === 'visit' && S.people[id]) { activePerson = id; state.visited = [...new Set([...state.visited, id])]; grant(S.people[id].grants); save(); render(); say(`已走访${S.people[id].name}，取得${S.people[id].grants.map(x => S.evidence[x].title).join('、')}`); }
    else if (a === 'deep' && state.deep.length < 2 && !state.deep.includes(id) && state.visited.includes(id)) { state.deep.push(id); grant(S.people[id].deepGrants); save(); render(); say('深挖完成，新证据已放入证据袋。'); }
    else if (a === 'to-timeline' && state.visited.length === 3) go('timeline');
    else if (a === 'back-investigate') go('investigate');
    else if (a === 'piece') { selectedPiece = id; render(); say(`已选择${S.evidence[id].title}，请选择时间。`); }
    else if (a === 'place') place(b.dataset.time);
    else if (a === 'plan') { state.tab = b.dataset.plan; save(); render(); say(`方案已切换，预计月末现金${M.format(M.calculate(state.tab).end)}万元。`); }
    else if (a === 'to-confront' && pieces.every(x => state.placed[x])) go('confront');
    else if (a === 'confront' && state.evidence.includes(id)) { state.confronted = id; save(); render(); say('老板回应了你的证据。'); }
    else if (a === 'back-timeline') go('timeline');
    else if (a === 'to-decision' && state.confronted) go('decision');
    else if (a === 'back-confront') go('confront');
    else if (a === 'rewind') { state.choice = ''; state.support = []; state.risk = ''; state.finished = null; go('decision'); }
    else if (a === 'ask-restart') document.querySelector('#restart').showModal();
    else if (a === 'close-archive') document.querySelector('#archive').close();
    else if (a === 'cancel-restart') document.querySelector('#restart').close();
    else if (a === 'confirm-restart') { document.querySelector('#restart').close(); state = M.fresh(state.seen); activePerson = null; selectedPiece = 'balance'; go('intro'); }
  });
  document.addEventListener('change', event => {
    const input = event.target;
    if (input.name === 'choice') { state.choice = input.value; document.querySelectorAll('.choice').forEach(el => el.classList.toggle('selected', el.contains(input))); }
    if (input.name === 'support') state.support = Array.from(document.querySelectorAll('[name="support"]:checked'), el => el.value);
    if (input.name === 'risk') state.risk = input.value;
    save();
  });
  main.addEventListener('dragstart', event => { const b = event.target.closest('[data-action="piece"]'); if (b && !b.disabled) { selectedPiece = b.dataset.id; event.dataTransfer.setData('text/plain', selectedPiece); } });
  main.addEventListener('dragover', event => { if (event.target.closest('[data-action="place"]')) event.preventDefault(); });
  main.addEventListener('drop', event => { const target = event.target.closest('[data-action="place"]'); if (target) { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (pieces.includes(id)) { selectedPiece = id; place(target.dataset.time); } } });
  document.querySelector('#archive-button').addEventListener('click', openArchive);
  document.querySelector('#restart-button').addEventListener('click', () => document.querySelector('#restart').showModal());
  render();
})();
