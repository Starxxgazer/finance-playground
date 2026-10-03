import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cameraFrame } from "../game/camera.js";
import { sceneObject, sceneImageSize } from "../game/scene-objects.js";
import { asset, Icon } from "./Ui.jsx";
import { useEdgePan } from "./useEdgePan.js";

const descriptions = {
  bakery: "小禾在柜台装面包，陈叔在烤箱旁查看面包，顾客在门口排队",
  newshop: "陈叔在新铺测量设备位置，小禾拿着访谈本与邀请函，身旁摆着筹备单据",
  desk: "陈叔和小禾围坐在打烊后的老店桌前，一起查看账本、日历和付款单",
  bank: "林姐坐在办公室桌前查看带回的调查资料",
  "meng-meeting": "老店门外，陈叔和老孟面对面查看摊开的设备合同",
  "invitation-closeup":
    "小禾在新铺窗边拿着日期留白的邀请函，陈叔在远处测量设备位置",
};

// The SVG uses the object's original aspect ratio even when its touch target
// grows to 44px. Only the invisible target grows; the traced edge stays in place.
function Contour({ geometry, width, height }) {
  if (!geometry) return null;
  return (
    <svg
      className={`hotspot-contour ${geometry.dashed ? "contour-equipment" : ""}`}
      viewBox={geometry.viewBox}
      style={{ width, height }}
      aria-hidden="true"
    >
      <path className="contour-hit-area" d={geometry.path} />
      <path d={geometry.path} />
      {geometry.details.map((path, index) => (
        <path key={index} className="contour-detail" d={path} />
      ))}
    </svg>
  );
}

export default function SceneView({
  scene,
  spots,
  focus,
  onOpen,
  isDone,
  observing = false,
  paused = false,
  guidedId = null,
  guideText = "",
  guideNote = "",
  resultMessage = "",
}) {
  const ref = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);
  const pointerFocus = useRef(false);
  const inspectionOrigin = useRef(null);
  const motionPaused = useRef(paused || !!focus);
  motionPaused.current = paused || !!focus;
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [ratio, setRatio] = useState(sceneImageSize.width / sceneImageSize.height);
  const [failed, setFailed] = useState(false);
  const [pan, setPan] = useState(0.5);
  const guiding = !focus && !paused && !!(guideText || resultMessage);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const root = ref.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(pointer: fine)");
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      root.style.setProperty("--look-x", "0px");
      root.style.setProperty("--look-y", "0px");
    };
    const move = (e) => {
      if (motionPaused.current || reduced.matches || !fine.matches || e.target.closest(".world-hotspot"))
        return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        root.style.setProperty(
          "--look-x",
          `${((e.clientX - r.left) / r.width - 0.5) * -16}px`,
        );
        root.style.setProperty(
          "--look-y",
          `${((e.clientY - r.top) / r.height - 0.5) * -10}px`,
        );
      });
    };
    const visibility = () => {
      root.dataset.hidden = String(document.hidden);
      if (document.hidden) cancelAnimationFrame(frame);
    };
    const leave = () => { if (!motionPaused.current) reset(); };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", reset);
    visibility();
    reset();
    return () => {
      reset();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reset);
    };
  }, []);
  const base = cameraFrame(
    size.width,
    size.height,
    ratio,
    focus,
    size.width < 900,
    pan,
    focus && inspectionOrigin.current?.viewportWidth === size.width && inspectionOrigin.current?.viewportHeight === size.height
      ? inspectionOrigin.current : null,
  );
  const overflow = Math.max(0, base.width - size.width);
  const stopEdgePan = useEdgePan(ref, {
    enabled: !focus && !paused,
    overflow,
    pan,
    setPan,
  });
  const frame = base;
  useLayoutEffect(() => {
    const root = ref.current;
    const app = root.closest(".immersive-app");
    const clue = root.querySelector(".focused-clue-marker");
    if (clue && app) {
      const rect = clue.getBoundingClientRect();
      const y = rect.top + rect.height / 2;
      root.dataset.cluePlacement = y > size.height / 2 ? "below" : "above";
      root.dataset.clueMiddle = String(y > size.height * 0.35 && y < size.height * 0.62);
      app.style.setProperty("--inspection-clue-y", `${y}px`);
    }
    return () => {
      delete root.dataset.cluePlacement;
      delete root.dataset.clueMiddle;
      app?.style.removeProperty("--inspection-clue-y");
    };
  }, [focus, size.width, size.height]);
  const setBoundedPan = (n) => setPan(Math.max(0, Math.min(1, n)));
  function inspect(id) {
    stopEdgePan.current();
    const root = ref.current;
    const camera = root.querySelector(".camera-world");
    const matrix = new DOMMatrixReadOnly(getComputedStyle(camera).transform);
    inspectionOrigin.current = { x: matrix.e, y: matrix.f, zoom: matrix.a,
      viewportWidth: size.width, viewportHeight: size.height };
    // During an interrupted zoom-out, keep the original browsing position;
    // the scaled translation is not a new horizontal pan.
    if (overflow && Math.abs(matrix.a - 1) < 0.001) setBoundedPan(-matrix.e / overflow);
    // Preserve even a partly completed parallax movement when opening a clue.
    const look = new DOMMatrixReadOnly(getComputedStyle(root.querySelector(".scene-parallax")).transform);
    root.style.setProperty("--look-x", `${look.e}px`);
    root.style.setProperty("--look-y", `${look.f}px`);
    onOpen(id);
  }
  function bringIntoView(spot) {
    stopEdgePan.current();
    if (!overflow || focus) return;
    const x = frame.x + (frame.width * spot.x) / 100;
    if (x < 45 || x > size.width - 45)
      setBoundedPan(((frame.width * spot.x) / 100 - size.width / 2) / overflow);
  }
  const lastGuide = useRef(null);
  useEffect(() => {
    if (paused || focus || !guidedId || lastGuide.current === guidedId) return;
    const spot = spots.find((item) => item.id === guidedId);
    if (spot) {
      bringIntoView(spot);
      lastGuide.current = guidedId;
    }
  }, [guidedId, paused, focus, overflow]);
  return (
    <section
      ref={ref}
      className={`world-view world-${scene.id} ${observing ? "is-observing" : ""}`}
      data-still={!!focus || paused}
      aria-label={`${scene.title}调查场景`}
      onPointerDown={(e) => {
        pointerFocus.current = true;
        moved.current = false;
        if (focus || paused || !overflow || e.pointerType === "mouse") return;
        drag.current = { x: e.clientX, pan };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const distance = e.clientX - drag.current.x;
        if (Math.abs(distance) > 8) moved.current = true;
        if (moved.current) {
          e.currentTarget.dataset.dragging = "true";
          setBoundedPan(drag.current.pan - distance / overflow);
        }
      }}
      onPointerUp={(e) => {
        pointerFocus.current = false;
        drag.current = null;
        e.currentTarget.dataset.dragging = "false";
      }}
      onPointerCancel={(e) => {
        pointerFocus.current = false;
        drag.current = null;
        e.currentTarget.dataset.dragging = "false";
      }}
      onKeyDown={() => { pointerFocus.current = false; }}
    >
      <div className="scene-parallax">
        <div className="scene-drift">
          <div
            className="camera-world"
            data-testid="scene-camera"
            data-zoom={frame.zoom}
            style={{
              width: frame.width,
              height: frame.height,
              transform: `translate3d(${frame.x}px, ${frame.y}px, 0) scale(${frame.zoom})`,
            }}
          >
            <img
              src={asset(`scenes/${scene.id}.webp`)}
              srcSet={`${asset(`scenes/${scene.id}-960.webp`)} 960w, ${asset(`scenes/${scene.id}.webp`)} 1672w`}
              sizes="100vw"
              alt={descriptions[scene.id] || scene.title}
              fetchPriority="high"
              onLoad={(e) => {
                setFailed(false);
                setRatio(
                  e.currentTarget.naturalWidth / e.currentTarget.naturalHeight,
                );
              }}
              onError={() => setFailed(true)}
            />
            <div className="scene-atmosphere" aria-hidden="true">
              <span className="ambient-light" />
              <span className="ambient-window" />
              <span className="ambient-dust dust-one" />
              <span className="ambient-dust dust-two" />
              <span className="ambient-dust dust-three" />
              <span className="ambient-dust dust-four" />
              <span className="ambient-dust dust-five" />
              <span className="ambient-dust dust-six" />
            </div>
            {/* Shade the photograph, not the exploration outlines. Keep the
                fade anchored to the viewport as the camera zooms and pans. */}
            <div
              className="world-shade"
              style={{
                left: -frame.x / frame.zoom,
                top: -frame.y / frame.zoom,
                width: size.width / frame.zoom,
                height: size.height / frame.zoom,
              }}
            />
          {focus?.id && sceneObject(scene.id, focus.id) && (
            <div className="focused-clue" aria-hidden="true"
              data-object-id={focus.id}
              style={{ left: `${focus.x}%`, top: `${focus.y}%`,
                width: frame.width * focus.width / 100,
                height: frame.height * focus.height / 100,
                "--focus-scale": frame.zoom }}>
              <Contour geometry={sceneObject(scene.id, focus.id)}
                width={frame.width * focus.width / 100} height={frame.height * focus.height / 100} />
              <span className="focused-clue-marker"><Icon name={isDone(focus.id) ? "check" : "search"} size={18} /></span>
            </div>
          )}
          {!focus &&
            spots.map((entry) => {
              const geometry = sceneObject(scene.id, entry.id);
              const spot = { ...entry, ...geometry };
              const width = (frame.width * (spot.width || 9)) / 100;
              const height = (frame.height * (spot.height || 10)) / 100;
              const completed = isDone(spot.id);
              return (
                <button
                  key={spot.id}
                  className={`world-hotspot ${completed ? "is-read" : ""} ${guidedId === spot.id ? "is-guided" : ""}`}
                  data-object-id={spot.id}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: Math.max(44, width),
                    height: Math.max(44, height),
                    "--marker-x": `${Math.max(44, width) / 2 + width * ((geometry?.markerX ?? 0.5) - 0.5)}px`,
                    "--marker-y": `${Math.max(44, height) / 2 + height * ((geometry?.markerY ?? 0.5) - 0.5)}px`,
                    "--marker-size": `${Math.min(22, geometry ? geometry.markerDiameter * frame.width / sceneImageSize.width : 22)}px`,
                  }}
                  aria-label={`调查${spot.label}`}
                  aria-description={completed ? "已完成调查，可再次查看" : spot.optional ? "选看，不影响前往下一场景" : "主线，核对完成后才能前往下一场景"}
                  aria-describedby={guiding && guidedId === spot.id ? "investigation-guide" : undefined}
                  onFocus={() => {
                    // A pointer click must not trigger keyboard auto-panning.
                    if (!pointerFocus.current) bringIntoView(spot);
                    else stopEdgePan.current();
                  }}
                  onClick={(event) => {
                    // Keyboard activation has no pointerdown to clear a prior swipe.
                    if (event.detail === 0 || !moved.current) inspect(spot.id);
                  }}
                >
                  <Contour geometry={geometry} width={width} height={height} />
                  <span className="hotspot-center" aria-hidden="true">
                    {completed ? (
                      <Icon name="check" size={12} />
                    ) : (
                      <Icon name="search" size={12} />
                    )}
                  </span>
                  <span className="world-hotspot-label">
                    {spot.label}
                    <small>{completed ? "再次查看" : guidedId === spot.id ? "点这里 · 主线待核对" : spot.optional ? "选看 · 不拦路" : "点击调查 · 主线待核对"}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {guiding && !failed && (
        <div className="investigation-guide" id="investigation-guide" role="status" aria-live="polite">
          {resultMessage && <small className="scene-result">{resultMessage}</small>}
          <p>{guideText}</p>
          {guideNote && <small className="tutorial-note">{guideNote}</small>}
        </div>
      )}
      {failed && (
        <div className="world-error" role="status">
          <p>现场图片暂时无法加载，仍可从以下物品继续调查。</p>
          {spots.map((spot) => (
            <button key={spot.id} onClick={() => inspect(spot.id)}>
              {spot.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
