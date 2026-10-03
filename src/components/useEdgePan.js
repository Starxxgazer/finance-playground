import { useLayoutEffect, useRef } from "react";

// Keep moving while the mouse rests at an edge, even without new pointer events.
export function useEdgePan(rootRef, { enabled, overflow, pan, setPan }) {
  const position = useRef(pan);
  const stop = useRef(() => {});
  const canPan = enabled && overflow > 0;
  position.current = pan;

  useLayoutEffect(() => {
    const root = rootRef.current;
    let frame = 0;
    let velocity = 0;
    let previousTime = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      velocity = 0;
      previousTime = 0;
      root.dataset.panning = "false";
    };
    stop.current = reset;
    if (!canPan) {
      reset();
      return reset;
    }

    const tick = (time) => {
      const elapsed = previousTime ? Math.min(48, time - previousTime) : 0;
      previousTime = time;
      const next = Math.max(0, Math.min(1, position.current + velocity * elapsed / 800));
      position.current = next;
      setPan(next);
      if ((velocity < 0 && next === 0) || (velocity > 0 && next === 1)) {
        frame = 0;
        previousTime = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    const move = (event) => {
      if (event.pointerType !== "mouse" || event.buttons || document.hidden) {
        reset();
        return;
      }
      const bounds = root.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      // Hold an object still for inspection; the outermost edge always pans.
      if (event.target.closest(".world-hotspot") && x > 24 && x < bounds.width - 24) {
        reset();
        return;
      }
      const edge = Math.min(160, Math.max(56, bounds.width * 0.14));
      velocity = x < edge
        ? -Math.max(0, Math.min(1, (edge - x) / edge))
        : x > bounds.width - edge
          ? Math.max(0, Math.min(1, (x - bounds.width + edge) / edge))
          : 0;
      if (!velocity) {
        reset();
        return;
      }
      root.dataset.panning = "true";
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const visibility = () => {
      if (document.hidden) reset();
    };
    root.addEventListener("pointerenter", move);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", reset);
    root.addEventListener("pointerdown", reset);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      reset();
      root.removeEventListener("pointerenter", move);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", reset);
      root.removeEventListener("pointerdown", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [rootRef, canPan, setPan]);

  return stop;
}
