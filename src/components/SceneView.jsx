import { useEffect, useRef, useState } from "react";
import { cameraFrame } from "../game/camera.js";
import { asset, Icon } from "./Ui.jsx";

const descriptions = {
  bakery: "小禾在柜台装面包，陈叔在烤箱旁查看面包，顾客在门口排队",
  newshop: "陈叔在新铺测量设备位置，小禾拿着访谈本与邀请函，身旁摆着筹备单据",
  desk: "陈叔和小禾围坐在打烊后的老店桌前，一起查看账本、日历和付款单",
  bank: "林姐坐在办公室桌前查看带回的调查资料",
  "meng-meeting": "老店门外，陈叔和老孟面对面查看摊开的设备合同",
  "invitation-closeup":
    "小禾在新铺窗边拿着日期留白的邀请函，陈叔在远处测量设备位置",
};

// Object contours, not interface icons. Coordinates fit each object's projected region.
function Contour({ shape }) {
  const paths = {
    equipment:
      "M17 17L74 8L92 23L92 85L36 95L17 78Z M17 17L36 33L92 23 M36 33L36 95 M43 42L84 35L84 60L43 67Z M43 74L84 67 M47 80L78 75 M22 28L28 34 M23 83L23 91 M86 88L86 96",
    book: "M6 24L45 13L52 21L87 9L96 73L57 89L49 83L13 94Z M52 21L57 89 M45 13L49 83",
    folder: "M7 28L34 22L40 12L91 18L94 84L10 93Z M12 35L88 27",
    invitation: "M10 17L90 10L95 82L15 91Z M19 29L79 23 M26 70L70 66",
    person:
      "M33 10Q50 2 64 12 M18 37Q9 52 10 74 M82 37Q93 52 90 74 M23 91Q49 99 77 91",
    paper: "M8 19L84 9L94 81L18 94Z M22 34L73 26 M25 47L77 39 M29 62L70 55",
  };
  return (
    <svg
      className={`hotspot-contour contour-${shape || "paper"}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={paths[shape] || paths.paper} />
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
  motion = true,
  paused = false,
  guidedId = null,
}) {
  const ref = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [ratio, setRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(false);
  const [pan, setPan] = useState(0.5);
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
      if (!motion || paused || focus || reduced.matches || !fine.matches)
        return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        root.style.setProperty(
          "--look-x",
          `${((e.clientX - r.left) / r.width - 0.5) * -5}px`,
        );
        root.style.setProperty(
          "--look-y",
          `${((e.clientY - r.top) / r.height - 0.5) * -3}px`,
        );
      });
    };
    const visibility = () => {
      root.dataset.hidden = String(document.hidden);
      if (document.hidden) reset();
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", reset);
    visibility();
    reset();
    return () => {
      reset();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reset);
    };
  }, [motion, paused, focus]);
  const base = cameraFrame(
    size.width,
    size.height,
    ratio,
    focus,
    size.width < 700,
  );
  const overflow = Math.max(0, base.width - size.width);
  const frame = focus ? base : { ...base, x: -overflow * pan };
  const setBoundedPan = (n) => setPan(Math.max(0, Math.min(1, n)));
  function bringIntoView(spot) {
    if (!overflow || focus) return;
    const x = frame.x + (frame.width * spot.x) / 100;
    if (x < 45 || x > size.width - 45)
      setBoundedPan(((frame.width * spot.x) / 100 - size.width / 2) / overflow);
  }
  return (
    <section
      ref={ref}
      className={`world-view world-${scene.id} ${observing ? "is-observing" : ""}`}
      data-still={!motion || !!focus || paused}
      aria-label={`${scene.title}调查场景`}
      onPointerDown={(e) => {
        moved.current = false;
        if (focus || !overflow || e.pointerType === "mouse") return;
        drag.current = { x: e.clientX, pan };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const distance = e.clientX - drag.current.x;
        if (Math.abs(distance) > 8) moved.current = true;
        if (moved.current)
          setBoundedPan(drag.current.pan - distance / overflow);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
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
              <span className="ambient-dust dust-one" />
              <span className="ambient-dust dust-two" />
              <span className="ambient-dust dust-three" />
            </div>
          </div>
          <div className="world-shade" />
          {!focus &&
            spots.map((spot) => {
              const seen = isDone(spot.id);
              return (
                <button
                  key={spot.id}
                  className={`world-hotspot ${seen ? "is-read" : ""} ${guidedId === spot.id ? "is-guided" : ""}`}
                  style={{
                    left: frame.x + (frame.width * spot.x) / 100,
                    top: frame.y + (frame.height * spot.y) / 100,
                    width: Math.max(
                      44,
                      (frame.width * (spot.width || 9)) / 100,
                    ),
                    height: Math.max(
                      44,
                      (frame.height * (spot.height || 10)) / 100,
                    ),
                  }}
                  aria-label={`调查${spot.label}`}
                  onFocus={() => bringIntoView(spot)}
                  onClick={(event) => {
                    // Keyboard activation has no pointerdown to clear a prior swipe.
                    if (event.detail === 0 || !moved.current) onOpen(spot.id);
                  }}
                >
                  <Contour shape={spot.shape} />
                  <span className="hotspot-center">
                    {seen ? (
                      <Icon name="check" size={13} />
                    ) : (
                      <Icon name="search" size={15} />
                    )}
                  </span>
                  <span className="world-hotspot-label">
                    {spot.label}
                    <small>{seen ? "再次查看" : "靠近看看"}</small>
                  </span>
                </button>
              );
            })}
        </div>
      </div>
      {!focus && overflow > 60 && (
        <div className="scene-pan-controls" aria-label="移动视线">
          <button
            className="pan-left"
            aria-label="向左查看现场"
            disabled={pan <= 0}
            onClick={() => setBoundedPan(pan - (size.width * 0.65) / overflow)}
          >
            <Icon name="back" size={21} />
          </button>
          <button
            className="pan-right"
            aria-label="向右查看现场"
            disabled={pan >= 1}
            onClick={() => setBoundedPan(pan + (size.width * 0.65) / overflow)}
          >
            <Icon name="arrow" size={21} />
          </button>
        </div>
      )}
      {failed && (
        <div className="world-error" role="status">
          <p>现场图片暂时无法加载，仍可从以下物品继续调查。</p>
          {spots.map((spot) => (
            <button key={spot.id} onClick={() => onOpen(spot.id)}>
              {spot.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
