// Presentation only. Investigation, evidence and money stay in app.js/model.js.
// Native scene choreography: a door dissolve, speaker framing, physical paper,
// and filing feedback. No autoplay dialogue, timers or required motion.
const game = document.querySelector('#game');
const plane = document.querySelector('#scene-plane');
const sceneImage = document.querySelector('#scene-image');
const dialogue = document.querySelector('#dialogue');
const overlay = document.querySelector('#overlay');
const content = document.querySelector('#overlay-content');
const media = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => media.matches || document.body.classList.contains('reduce-motion');
const running = new Set();
function animate(el, frames, options) {
  if (!el || reduced()) return;
  const animation = el.animate(frames, options);
  running.add(animation);
  animation.finished.catch(() => {}).finally(() => running.delete(animation));
  return animation;
}
const invitation = document.createElement('aside');
invitation.id = 'invitation-prop';
invitation.setAttribute('aria-label', '小禾手写的邀请函');
invitation.hidden = true;
invitation.innerHTML = '<div class="invitation-fold"><span>留灯烘焙 · 新店</span><h2>开业邀请函</h2><p>愿每一个路过的人，<br>都能吃到热面包。</p><dl><div><dt>店长</dt><dd>小禾</dd></div><div><dt>开业日期</dt><dd class="blank-date" aria-label="尚未填写"></dd></div></dl><small>等真的准备好，再写日期。</small></div>';
game.append(invitation);

// Every pose is a camera aimed at a painted subject, not a new character asset.
const shots = {
  bakery: { 陈叔: [51, 37, 1.19], 小禾: [75, 40, 1.24], 上级: [53, 59, 1.08] },
  supplier: { 老孟: [55, 38, 1.21] },
  newshop: { 小禾: [63, 30, 1.2] },
};
let previousSpeaker = '', previousVisual = '', previousDialogue = '';
function frameDialogue() {
  const speaker = dialogue.dataset.speaker || '';
  const visual = dialogue.dataset.visual || '';
  const text = dialogue.querySelector('.dialogue-text')?.textContent || '';
  const active = Boolean(text);
  document.body.classList.toggle('in-conversation', active);
  const shot = shots[document.body.dataset.scene]?.[speaker];
  if (shot && active) {
    plane.style.setProperty('--focus-x', `${shot[0]}%`);
    plane.style.setProperty('--focus-y', `${shot[1]}%`);
    plane.style.setProperty('--shot-scale', shot[2]);
  } else {
    plane.style.setProperty('--shot-scale', '1.1');
  }
  const showInvitation = active && visual === 'invitation';
  invitation.hidden = !showInvitation;
  if (showInvitation && previousVisual !== visual) {
    animate(invitation, [
      { opacity: 0, transform: 'translateY(45px) rotate(-11deg) scale(.88)' },
      { opacity: 1, transform: 'translateY(0) rotate(-4deg) scale(1)' },
    ], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  if (text && text !== previousDialogue) {
    animate(dialogue.querySelector('.dialogue-text'), [
      { opacity: .2, transform: 'translateY(9px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 290, easing: 'ease-out' });
    if (speaker !== previousSpeaker) animate(dialogue.querySelector('.speaker'), [
      { opacity: 0, transform: 'translateX(-12px)' },
      { opacity: 1, transform: 'translateX(0)' },
    ], { duration: 420, easing: 'ease-out' });
  }
  previousSpeaker = speaker; previousVisual = visual; previousDialogue = text;
}
const dialogueObserver = new MutationObserver(frameDialogue);
dialogueObserver.observe(dialogue, { childList: true, attributes: true, attributeFilter: ['data-speaker', 'data-visual'] });

let previousImage = sceneImage.getAttribute('src'), dissolve;
const imageObserver = new MutationObserver(() => {
  const next = sceneImage.getAttribute('src');
  if (next === previousImage) return;
  dissolve?.remove();
  if (previousImage && !reduced()) {
    dissolve = document.createElement('img');
    const outgoing = dissolve;
    outgoing.className = 'shot-dissolve'; outgoing.src = previousImage; outgoing.alt = '';
    outgoing.setAttribute('aria-hidden', 'true');
    document.querySelector('#world').append(outgoing);
    const move = animate(outgoing, [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(1.12)' },
    ], { duration: 1000, easing: 'cubic-bezier(.25,.46,.45,.94)' });
    move?.finished.catch(() => {}).finally(() => outgoing.remove());
  }
  previousImage = next;
});
imageObserver.observe(sceneImage, { attributes: true, attributeFilter: ['src'] });

let previousType = '', previousOpen = false;
const paperObserver = new MutationObserver(() => {
  const type = overlay.dataset.type || '';
  if (overlay.open && (!previousOpen || type !== previousType)) {
    animate(content, [
      { opacity: .4, transform: 'perspective(1400px) translateY(32px) rotateX(5deg)' },
      { opacity: 1, transform: 'perspective(1400px) translateY(0) rotateX(0)' },
    ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  previousType = type; previousOpen = overlay.open;
});
paperObserver.observe(overlay, { attributes: true, attributeFilter: ['open', 'data-type'] });

// A receipt travels toward the archive when a document is put away.
const events = new AbortController();
document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'money-piece') {
    const rectangle = button.getBoundingClientRect();
    // Native dialogs (and their entrance transforms) establish their own
    // coordinate space. Keep decorations in a clipped layer in that space.
    let effects = overlay.querySelector('.cash-effects');
    if (!effects) {
      effects = document.createElement('div'); effects.className = 'cash-effects';
      effects.setAttribute('aria-hidden', 'true'); overlay.append(effects);
    }
    const origin = effects.getBoundingClientRect();
    const paper = document.createElement('span');
    paper.className = 'cash-slip'; paper.textContent = button.querySelector('strong')?.textContent;
    paper.style.left = `${rectangle.left-origin.left}px`; paper.style.top = `${rectangle.top-origin.top}px`;
    paper.style.width = `${rectangle.width}px`;
    effects.append(paper);
    const animation = animate(paper, [{ opacity: .9, transform: 'translate(0,0) rotate(0)' }, { opacity: 0, transform: 'translate(-65px,65px) rotate(-9deg)' }], { duration: 470, easing: 'ease-in' });
    const clean = () => { paper.remove(); if (!effects.children.length) effects.remove(); };
    if (animation) animation.finished.catch(() => {}).finally(clean); else clean();
  }
  if (action === 'close' && overlay.dataset.type === 'document') {
    const archive = document.querySelector('#archive-button');
    const rect = archive?.getBoundingClientRect();
    if (rect && !reduced()) {
      const filing = document.createElement('span'); filing.className = 'filing-slip';
      filing.setAttribute('aria-hidden', 'true'); filing.textContent = '留灯 · 走访资料';
      document.body.append(filing);
      const animation = animate(filing, [
        { opacity: .95, left: '50vw', top: '45vh', transform: 'rotate(-6deg) scale(1)' },
        { opacity: 0, left: `${rect.x}px`, top: `${rect.y}px`, transform: 'rotate(12deg) scale(.15)' },
      ], { duration: 590, easing: 'cubic-bezier(.55,.05,.7,.5)' });
      animation?.finished.catch(() => {}).finally(() => filing.remove());
      animate(archive, [{ boxShadow: '0 0 0 0 #d8b675' }, { boxShadow: '0 0 0 10px #d8b67500' }], { duration: 900 });
    }
  }
}, { capture: true, signal: events.signal });

function cancelMotion() { if (reduced()) for (const animation of running) animation.cancel(); }
media.addEventListener('change', cancelMotion, { signal: events.signal });
const preferenceObserver = new MutationObserver(cancelMotion);
preferenceObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
frameDialogue();
window.addEventListener('pagehide', () => {
  dialogueObserver.disconnect(); imageObserver.disconnect(); paperObserver.disconnect(); preferenceObserver.disconnect();
  events.abort(); for (const animation of running) animation.cancel(); dissolve?.remove();
}, { once: true });
