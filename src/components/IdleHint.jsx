import { useEffect, useRef } from "react";

export const IDLE_HINT_DELAY = 5000;

// Presentation only: candidates are supplied by the current interaction.
// Never focus, click, scroll, or write to the game/save state from a hint.
export default function IdleHint({ paused, progress, screen }) {
  const anchor = useRef(null);
  useEffect(() => {
    const root = anchor.current?.closest(".immersive-app");
    if (!root || paused) return;
    let lastAction = performance.now();
    let highlighted = null;
    const clear = () => {
      highlighted?.removeAttribute("data-idle-active");
      highlighted = null;
    };
    const reset = () => { lastAction = performance.now(); clear(); };
    const visible = (element) => {
      if (element.matches(":disabled") || element.closest('[inert], [aria-hidden="true"]')) return false;
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      const rect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
      if (rect.right <= 0 || rect.left >= innerWidth || rect.bottom <= 0 || rect.top >= innerHeight) return false;
      // Respect scroll containers and overlays; don't signal a covered control.
      const front = document.elementFromPoint(x, y);
      return front && (element.contains(front) || (element.classList.contains("world-hotspot") && front.closest(".world-view") === element.closest(".world-view")));
    };
    const tick = () => {
      if (document.hidden) { reset(); return; }
      if (performance.now() - lastAction < IDLE_HINT_DELAY) return;
      const candidates = [...root.querySelectorAll('[data-idle-hint]')]
        .filter(visible).sort((a, b) => Number(a.dataset.idleHint) - Number(b.dataset.idleHint));
      const next = candidates[0];
      if (highlighted !== next) {
        clear();
        highlighted = next;
        highlighted?.setAttribute("data-idle-active", "true");
      }
    };
    const events = ["pointerdown", "pointermove", "keydown", "input", "wheel", "touchmove"];
    events.forEach((event) => root.addEventListener(event, reset, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", reset);
    const timer = setInterval(tick, 250);
    return () => {
      clearInterval(timer);
      clear();
      events.forEach((event) => root.removeEventListener(event, reset, true));
      document.removeEventListener("visibilitychange", reset);
    };
  }, [paused, progress, screen]);
  return <span ref={anchor} hidden />;
}
