// UI choreography only; all scene imagery now comes from the Three.js models.
const media = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => media.matches || document.body.classList.contains('reduce-motion');
const dialogue = document.querySelector('#dialogue');
let previous = '';
const observer = new MutationObserver(() => {
  const text = dialogue.querySelector('.dialogue-text');
  document.body.classList.toggle('in-conversation', Boolean(text));
  if (text && text.textContent !== previous && !reduced()) text.animate([
    { opacity: .2, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 240, easing: 'ease-out' });
  previous = text?.textContent || '';
});
observer.observe(dialogue, { childList: true });
window.addEventListener('pagehide', e => { if (!e.persisted) observer.disconnect(); });
