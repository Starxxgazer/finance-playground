import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { films } from "../game/content.js";
import { asset } from "./Ui.jsx";
import HomeScreen from "./HomeScreen.jsx";
import "../cinematic.css";
import { fieldTools, narrationAt } from "../game/narrative.js";
import { ToolPicture } from "./FieldGuide.jsx";

// Playback never changes investigation progress. Only a completed or explicitly
// skipped opening records FILM, through the same reducer action as before.
export default function Film({ index, paused = false, onReveal, onContinue, onStart, onSettings, muted = false, onMutedChange, onPlaybackChange }) {
  const film = films[index];
  const [started, setStarted] = useState(index !== 0);
  const [clipIndex, setClipIndex] = useState(0);
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [retry, setRetry] = useState(0);
  const [frameReady, setFrameReady] = useState(false);
  const [bridge, setBridge] = useState(false);
  const heldFrame = useRef(null);
  const frameCallback = useRef(null);
  const video = useRef(null);
  const skipButton = useRef(null);
  const finishRequested = useRef(false);
  const continuation = useRef(onContinue);
  continuation.current = onContinue;
  const clip = film.clips[clipIndex];
  const cue = narrationAt(clip.id, time);
  useEffect(() => {
    onPlaybackChange?.({ clip: clip.id, playing: started && playing && !paused && !userPaused && !failed && !blocked && !finishing });
  }, [clip.id, started, playing, paused, userPaused, failed, blocked, finishing, onPlaybackChange]);

  useEffect(() => {
    if (!opening) return;
    const timer = setTimeout(() => setStarted(true),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 360);
    return () => clearTimeout(timer);
  }, [opening]);

  useLayoutEffect(() => {
    const player = video.current;
    if (!player) return;
    // Restore after StrictMode's cleanup, before the playback effect runs.
    if (!player.getAttribute("src")) player.src = asset(clip.src);
    return () => {
      // Pausing alone retains decoder/audio buffers in detached video nodes.
      // Release them on replacement/unmount, but keep them for a normal pause.
      if (frameCallback.current !== null) player.cancelVideoFrameCallback?.(frameCallback.current);
      frameCallback.current = null;
      player.pause();
      player.removeAttribute("src");
      player.load();
    };
  }, [started, clipIndex, failed, retry]);

  useEffect(() => {
    // Warm the actual scene before removing the final video frame.
    const image = new Image();
    image.src = asset(`scenes/${film.image}.webp`);
    image.decode?.().catch(() => {});
  }, [film.image]);
  useEffect(() => {
    if (started) skipButton.current?.focus();
  }, [started]);
  useEffect(() => {
    const player = video.current;
    if (!started || !player || failed || finishing) return;
    let cancelled = false;
    let lastTime = player.currentTime;
    let stalledSeconds = 0;
    const sync = () => {
      if (paused || userPaused || document.hidden) {
        player.pause();
        return;
      }
      player.play()?.then(() => {
        if (!cancelled) setBlocked(false);
      }).catch((error) => {
        if (!cancelled && error.name !== "AbortError") setBlocked(true);
      });
    };
    sync();
    // Some decoders can stall without an error or a rejected play promise.
    // Offer the same retry/skip path without treating a stall as completion.
    const watchdog = setInterval(() => {
      if (paused || userPaused || document.hidden || player.paused || player.ended) {
        stalledSeconds = 0;
      } else if (player.currentTime !== lastTime) {
        stalledSeconds = 0;
      } else if (++stalledSeconds >= 12) {
        setFailed(true);
      }
      lastTime = player.currentTime;
    }, 1000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelled = true;
      clearInterval(watchdog);
      player.pause();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [started, clipIndex, paused, userPaused, failed, finishing, retry]);
  useEffect(() => {
    if (!finishing) return;
    const timer = setTimeout(() => continuation.current(),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 40 : 850);
    return () => clearTimeout(timer);
  }, [finishing]);

  function finish() {
    if (finishRequested.current) return;
    finishRequested.current = true;
    video.current?.pause();
    onReveal();
    setFinishing(true);
  }
  function revealFrame(event) {
    const player = event.currentTarget;
    const reveal = () => {
      frameCallback.current = null;
      if (video.current === player && !finishRequested.current) setFrameReady(true);
    };
    // A decoded first frame must exist before the old frame fades away.
    if (player.requestVideoFrameCallback) {
      if (frameCallback.current !== null) player.cancelVideoFrameCallback(frameCallback.current);
      frameCallback.current = player.requestVideoFrameCallback(reveal);
    } else if (player.readyState >= 2) reveal();
  }
  function nextClip() {
    if (finishRequested.current) return;
    if (clipIndex + 1 < film.clips.length) {
      const player = video.current;
      const canvas = heldFrame.current;
      if (canvas && player) {
        canvas.width = player.videoWidth || 1280;
        canvas.height = player.videoHeight || 720;
        const context = canvas.getContext("2d");
        context.fillStyle = "#141310";
        context.fillRect(0, 0, canvas.width, canvas.height);
        try { context.drawImage(player, 0, 0, canvas.width, canvas.height); } catch { /* Keep the dark transition if decoding failed. */ }
      }
      setTime(0);
      setPlaying(false);
      setBridge(true);
      setFrameReady(false);
      setBlocked(false);
      setClipIndex((value) => value + 1);
    } else finish();
  }
  function resume() {
    setUserPaused(false);
    // Keep this call in the click gesture for browsers that block audible autoplay.
    video.current?.play()?.then(() => setBlocked(false)).catch(() => setBlocked(true));
  }

  if (!started) return (
    <HomeScreen opening={opening} onSettings={onSettings} onStart={() => {
      setOpening(true);
      onStart?.();
    }} />
  );

  return (
    <section className={`cinematic ${finishing ? "is-finishing" : ""} ${frameReady ? "has-frame" : "awaiting-frame"} ${bridge ? "has-bridge" : ""}`}
      aria-label="场景开场视频" data-clip={clip.id} aria-hidden={paused || finishing || undefined}
      inert={paused || finishing || undefined}>
      <div className="cinematic-frame">
        {failed ? (
          <img src={asset(`scenes/${film.image}.webp`)} alt="" />
        ) : (
          <video key={`${clip.id}-${retry}`} ref={video} src={asset(clip.src)}
            poster={asset(clip.poster)} playsInline preload="auto" muted={muted}
            aria-label={clip.id === "intro" ? "调查序章" : `${film.title}开场`}
            onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
            onSeeked={event => setTime(event.currentTarget.currentTime)}
            onPlaying={event => { setPlaying(true); revealFrame(event); }}
            onPause={() => setPlaying(false)} onWaiting={() => setPlaying(false)}
            onEnded={nextClip} onError={() => setFailed(true)} />
        )}
        <canvas ref={heldFrame} className={`cinematic-held-frame ${bridge && !frameReady ? "is-holding" : ""}`}
          aria-hidden="true" />
        <div className="cinematic-incoming-shade" aria-hidden="true" />
      </div>
      <div className="cinematic-caption">
        <span>{clip.id === "intro" ? "账面之下 · 第一章" : ["10月29日 上午", "10月29日 下午", "10月29日 晚", "10月30日 上午"][index]}</span>
        <p>{clip.id === "intro" ? "第一次企业调查" : film.title}</p>
      </div>
      {cue && !failed && !blocked && <div className="cinematic-narration" role="status" aria-live="polite" aria-atomic="true">
        <div key={`${clip.id}-${cue.at}`}>
          {cue.tool && <span className="narration-tool"><ToolPicture tool={fieldTools.find(tool => tool.id === cue.tool)} /></span>}
          <strong>{cue.title}</strong><p>{cue.text}</p>
        </div>
      </div>}
      {(failed || blocked) && !finishing && (
        <div className="cinematic-message" role="status">
          <p>{failed ? "视频暂时无法播放，可以重试或跳过开场。" : "点击继续播放开场视频"}</p>
          <button type="button" onClick={failed ? () => {
            setFrameReady(false); setFailed(false); setBlocked(false); setUserPaused(false); setRetry((value) => value + 1);
          } : resume}>{failed ? "重试播放" : "播放视频"}</button>
        </div>
      )}
      <div className="cinematic-controls">
        {!failed && <>
          <button type="button" onClick={userPaused || blocked ? resume : () => setUserPaused(true)}>
            {userPaused || blocked ? "继续播放" : "暂停视频"}
          </button>
          <button type="button" onClick={() => onMutedChange?.(!muted)} aria-pressed={muted}>
            {muted ? "开启声音" : "静音"}
          </button>
        </>}
        <button type="button" ref={skipButton} onClick={finish}>跳过开场</button>
      </div>
    </section>
  );
}
