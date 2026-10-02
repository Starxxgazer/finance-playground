import { useEffect, useRef, useState } from "react";
import { cameraFrame } from "../game/camera.js";
import { asset, Icon } from "./Ui.jsx";

export default function SceneView({ scene, spots, focus, onOpen, isDone }) {
  const ref = useRef(null);
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [ratio, setRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(false);
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
  const frame = cameraFrame(
    size.width,
    size.height,
    ratio,
    focus,
    size.width < 700,
  );
  return (
    <section
      ref={ref}
      className="world-view"
      aria-label={`${scene.title}调查场景`}
    >
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
          alt={
            scene.id === "bakery"
              ? "小禾在柜台装面包，陈叔在烤箱旁查看面包，顾客在门口排队"
              : scene.id === "newshop"
                ? "陈叔在新铺测量设备位置，小禾拿着访谈本与邀请函，身旁摆着筹备单据"
                : scene.id === "desk"
                  ? "陈叔和小禾围坐在打烊后的老店桌前，一起查看账本、日历和付款单"
                  : "林姐坐在办公室桌前查看带回的调查资料"
          }
          fetchPriority="high"
          onLoad={(e) => {
            setFailed(false);
            setRatio(
              e.currentTarget.naturalWidth / e.currentTarget.naturalHeight,
            );
          }}
          onError={() => setFailed(true)}
        />
      </div>
      <div className="world-shade" />
      {!focus &&
        spots.map((spot) => {
          const x = frame.x + (frame.width * spot.x) / 100;
          const y = frame.y + (frame.height * spot.y) / 100;
          // Cropped clues remain keyboard/touch accessible in the investigation list.
          if (x < 28 || x > size.width - 28 || y < 95 || y > size.height - 170)
            return null;
          const seen = isDone(spot.id);
          return (
            <button
              key={spot.id}
              className={`world-hotspot ${seen ? "is-read" : ""}`}
              style={{ left: x, top: y }}
              aria-label={`调查${spot.label}`}
              onClick={() => onOpen(spot.id)}
            >
              <span className="reticle">
                {seen ? <Icon name="check" size={12} /> : <span />}
              </span>
              <span className="world-hotspot-label">
                {spot.label}
                <small>{seen ? "再次查看" : "点击调查"}</small>
              </span>
            </button>
          );
        })}
      {failed && (
        <p className="world-error" role="status">
          图片暂时无法加载，可从“调查清单”查看资料。
        </p>
      )}
    </section>
  );
}
