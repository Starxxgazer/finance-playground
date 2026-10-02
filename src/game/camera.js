// Preserve the camera framing of the original transparent investigation UI.
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export function cameraFrame(width, height, ratio, focus, portrait = false) {
  const baseWidth = Math.max(width, height * ratio);
  const baseHeight = baseWidth / ratio;
  const zoom = focus ? (focus.zoom ?? (portrait ? 1.35 : 1.65)) : 1;
  const focusX = portrait ? (focus?.portraitX ?? focus?.x) : focus?.x;
  const focusY = portrait ? (focus?.portraitY ?? focus?.y) : focus?.y;
  const w = baseWidth * zoom;
  const h = baseHeight * zoom;
  const x = focus
    ? clamp(width * 0.5 - (w * focusX) / 100, width - w, 0)
    : (width - w) / 2;
  const y = focus
    ? clamp(
        height * (portrait ? 0.23 : 0.52) - (h * focusY) / 100,
        height * (portrait ? 0.35 : 1) - h,
        0,
      )
    : (height - h) / 2;
  return { width: baseWidth, height: baseHeight, x, y, zoom };
}
