import { useEffect, useRef, useState } from "react";
import { musicTracks, musicVolume, MUSIC_KEY, readSoundSettings } from "../game/music.js";
import { asset } from "./Ui.jsx";

// HTML media works under file:// too; no remote requests or WebAudio CORS path.
export default function Soundtrack({ track, paused, quiet = false, reading = false, children, persist = true }) {
  const [sound, setSound] = useState(() => {
    try { return readSoundSettings(persist ? localStorage : null); }
    catch { return { muted: false, volume: 0.55 }; }
  });
  const [status, setStatus] = useState("ready");
  const holder = useRef(null);
  const engine = useRef(null);
  const context = useRef(null);
  context.current = { track, paused, quiet, reading, ...sound };

  useEffect(() => {
    if (persist) try { localStorage.setItem(MUSIC_KEY, JSON.stringify(sound)); } catch { /* Preferences are optional. */ }
  }, [sound, persist]);

  useEffect(() => {
    let disposed = false;
    let unlocked = false;
    let frame = 0;
    let last = 0;
    const players = new Map();
    const positions = new Map();
    const release = player => {
      if (Number.isFinite(player.currentTime) && player.currentTime > 0) positions.set(player.dataset.track, player.currentTime);
      player.pause(); player.removeAttribute("src"); player.load(); player.remove();
    };
    const report = (id, next) => {
      if (!disposed && players.has(id) && context.current.track === id) setStatus(next);
    };
    function play(entry) {
      if (entry.pending || !entry.player.paused) return;
      entry.pending = true;
      entry.player.play()?.then(() => {
        entry.pending = false;
        if (disposed || !players.has(entry.id) || context.current.paused || document.hidden) entry.player.pause();
        else report(entry.id, "playing");
      }).catch(error => {
        entry.pending = false;
        if (error.name !== "AbortError") report(entry.id, error.name === "NotAllowedError" ? "blocked" : "failed");
      });
    }
    function tick(now) {
      frame = 0;
      // A queued frame timestamp can precede performance.now() from sync().
      // Never feed a negative gain to HTMLMediaElement.volume.
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
      last = now;
      const c = context.current;
      if (!unlocked || c.paused || document.hidden) return;
      let moving = false;
      for (const [id, entry] of players) {
        const next = players.get(c.track);
        // Keep the outgoing music until the incoming recording really plays.
        const waiting = next && (next.pending || next.player.paused || next.player.readyState < 2);
        const target = id === c.track ? musicVolume(id, c.volume, c)
          : waiting ? musicVolume(id, c.volume, c) : 0;
        if (entry.target !== target) {
          entry.target = target; entry.from = entry.gain; entry.elapsed = 0;
          entry.duration = id === c.track && entry.gain > 0 ? 0.7 : 2.2;
        }
        entry.elapsed += dt;
        const progress = Math.min(1, entry.elapsed / entry.duration);
        const eased = progress * progress * (3 - 2 * progress);
        entry.gain = entry.from + (target - entry.from) * eased;
        if (Math.abs(target - entry.gain) < 0.001) entry.gain = target;
        entry.player.volume = entry.gain;
        entry.player.muted = c.muted;
        if (id !== c.track && entry.gain === 0) { release(entry.player); players.delete(id); }
        else if (Math.abs(target - entry.gain) > 0.001) moving = true;
      }
      if (moving || players.size > 1) frame = requestAnimationFrame(tick);
    }
    function sync() {
      if (disposed) return;
      const c = context.current;
      // Only load music after the first actual user gesture.
      if (unlocked && !players.has(c.track)) {
        const player = document.createElement("audio");
        player.src = asset(musicTracks.find(item => item.id === c.track).src);
        player.loop = true; player.preload = "auto"; player.volume = 0; player.muted = c.muted;
        player.dataset.track = c.track;
        player.addEventListener("loadedmetadata", () => {
          const position = positions.get(c.track);
          if (position && position < player.duration) player.currentTime = position;
        }, { once: true });
        setStatus("ready");
        player.addEventListener("error", () => report(c.track, "failed"));
        holder.current?.append(player);
        players.set(c.track, { id: c.track, player, gain: 0, pending: false });
        // Rapid navigation must not accumulate decoders.
        for (const [id, entry] of players) {
          if (players.size > 2 && id !== c.track) { release(entry.player); players.delete(id); }
        }
      }
      cancelAnimationFrame(frame);
      for (const entry of players.values()) {
        entry.player.muted = c.muted;
        if (c.paused || document.hidden) entry.player.pause();
        else if (unlocked) play(entry);
      }
      if (unlocked && !c.paused && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); }
    }
    const unlock = event => {
      if (event?.type === "keydown" && !["Enter", " "].includes(event.key)) return;
      unlocked = true;
      sync();
    };
    engine.current = { sync, retry: () => {
      const entry = players.get(context.current.track);
      if (entry) { release(entry.player); players.delete(entry.id); }
      unlock();
    } };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", sync);
      players.forEach(entry => release(entry.player)); players.clear();
      engine.current = null;
    };
  }, []);
  useEffect(() => engine.current?.sync(), [track, paused, quiet, reading, sound]);

  return <>
    <div className="soundtrack" ref={holder} hidden aria-hidden="true" data-current-track={track} data-status={status} />
    {children({ ...sound, status, track, setMuted: muted => setSound(current => ({ ...current, muted })),
      setVolume: volume => setSound(current => ({ ...current, volume })), retry: () => engine.current?.retry() })}
  </>;
}

export function SoundSettings({ sound }) {
  return <div className="sound-settings">
    <label><input type="checkbox" checked={sound.muted} onChange={event => sound.setMuted(event.target.checked)} />静音全部声音</label>
    <label className="music-volume">背景音乐 <input aria-label="背景音乐音量" type="range" min="0" max="100" value={Math.round(sound.volume * 100)}
      onChange={event => sound.setVolume(Number(event.target.value) / 100)} /><output>{Math.round(sound.volume * 100)}%</output></label>
    <details className="music-credits"><summary>配乐与署名</summary>
      <p>Music by Scott Buckley — <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · <a href="https://www.scottbuckley.com.au" target="_blank" rel="noreferrer">www.scottbuckley.com.au</a></p>
      {musicTracks.map(item => <p key={item.id}><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> · {item.use}</p>)}
      <p>本版作音量标准化、MP3转码及游戏内淡入淡出。音乐随游戏本地分发。</p>
    </details>
  </div>;
}
