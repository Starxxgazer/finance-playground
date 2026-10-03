export const MUSIC_KEY = "finance-playground-sound-v1";
export const musicTracks = [
  { id: "first-snow", title: "First Snow", use: "首页与序章 · 第一次出发", gain: 0.82, mood: "温柔钢琴、弦乐与单簧管" },
  { id: "childhood", title: "Childhood", use: "老店、顾客与街坊访谈", gain: 0.86, mood: "温暖钢琴与弦乐" },
  { id: "reverie", title: "Reverie", use: "新铺、窗边的邀请函", gain: 0.8, mood: "轻柔钢琴与朦胧弦乐" },
  { id: "undertow", title: "Undertow", use: "资金桌、旧款与出资追查", gain: 0.68, mood: "克制的钢琴、低弦与脉动" },
  { id: "in-search-of-solitude", title: "In Search Of Solitude", use: "银行交接与复核", gain: 0.76, mood: "沉静的室内乐与氛围音色" },
  { id: "horizons", title: "Horizons", use: "调查结束 · 留给你的邀请函", gain: 0.86, mood: "舒展的钢琴与弦乐" },
].map(track => ({ ...track, src: `audio/${track.id}.mp3`, url: `https://www.scottbuckley.com.au/library/${track.id}/` }));

const sceneTracks = ["childhood", "reverie", "undertow", "in-search-of-solitude"];
const filmTracks = { intro: "first-snow", bakery: "childhood", newshop: "reverie", desk: "undertow", bank: "in-search-of-solitude" };
const investigationTracks = {
  contract: "undertow", transfer: "undertow",
  customer: "childhood", survey: "childhood", invitation: "reverie",
};

export function musicFor({ scene, active, film, clip, ending, atHome }) {
  if (atHome) return "first-snow";
  if (film) return filmTracks[clip] || sceneTracks[scene] || "first-snow";
  // Follow the actual investigation during a return visit, even from the ending.
  if (investigationTracks[active]) return investigationTracks[active];
  if (ending) return "horizons";
  return sceneTracks[scene] || "first-snow";
}

export function musicVolume(track, volume, { quiet = false, reading = false } = {}) {
  const gain = musicTracks.find(item => item.id === track)?.gain ?? 0.8;
  const level = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  return level * gain * (quiet ? 0.22 : reading ? 0.65 : 1);
}

export function readSoundSettings(storage) {
  try {
    const value = JSON.parse(storage.getItem(MUSIC_KEY));
    return { muted: value?.muted === true,
      volume: typeof value?.volume === "number" && Number.isFinite(value.volume)
        ? Math.max(0, Math.min(1, value.volume)) : 0.55 };
  } catch { return { muted: false, volume: 0.55 }; }
}
