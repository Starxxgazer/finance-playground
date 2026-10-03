// Zoom around the clue where it already appears, without reframing the scene.
export function cameraFrame(width, height, ratio, focus, portrait = false, pan = 0.5, origin = null) {
  const baseWidth = Math.max(width, height * ratio);
  const baseHeight = baseWidth / ratio;
  const zoom = focus ? (focus.zoom ?? (portrait ? 1.35 : 1.65)) : 1;
  const start = origin || {
    x: (width - baseWidth) * pan,
    y: (height - baseHeight) / 2,
    zoom: 1,
  };
  const x = focus ? start.x + baseWidth * focus.x / 100 * (start.zoom - zoom) : start.x;
  const y = focus ? start.y + baseHeight * focus.y / 100 * (start.zoom - zoom) : start.y;
  return { width: baseWidth, height: baseHeight, x, y, zoom };
}
