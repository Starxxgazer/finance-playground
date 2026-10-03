import { useEffect, useMemo, useRef, useState } from "react";
import { directions, surfaces } from "./preview.js";
import { Icon } from "../components/Ui.jsx";
import "./review.css";

export default function DesignReview() {
  const query = new URLSearchParams(location.search);
  const [variant, setVariant] = useState(directions.some(d => d.id === query.get("variant")) ? query.get("variant") : "notebook");
  const [surface, setSurface] = useState(surfaces.some(s => s[0] === query.get("screen")) ? query.get("screen") : "old");
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const frame = useRef(null);
  // Reload only when changing the example. A direction change is applied to
  // the live frame, so selections and scroll position remain comparable.
  const frameSource = useMemo(() => `/?ui-preview=${surface}&variant=${variant}`, [surface, refresh]);
  const direction = directions.find(d => d.id === variant);
  const sendTheme = () => frame.current?.contentWindow?.postMessage({ type: "ui-direction", variant }, location.origin);
  useEffect(() => {
    document.documentElement.dataset.review = "true";
    document.title = "账面之下 · 三套 UI 设计";
    return () => { delete document.documentElement.dataset.review; };
  }, []);
  useEffect(() => {
    sendTheme();
    history.replaceState(null, "", `?ui-design&variant=${variant}&screen=${surface}`);
  }, [variant, surface]);
  useEffect(() => {
    const ready = event => {
      if (event.origin === location.origin && event.source === frame.current?.contentWindow && event.data?.type === "ui-ready") sendTheme();
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [variant]);
  function changeScreen(value) { setLoading(true); setSurface(value); }
  const index = surfaces.findIndex(s => s[0] === surface);
  const quick = ["old", "ledger", "bag", "money", "company", "settings"];
  return <div className={`review-shell ${collapsed ? "review-collapsed" : ""}`}>
    <header className="review-header">
      <div className="review-brand"><strong>账面之下</strong><span>整套界面 · 设计试览</span></div>
      <div className="direction-tabs" role="group" aria-label="选择设计方案">
        {directions.map(d => <button key={d.id} className={`direction-${d.id}`} aria-pressed={variant === d.id} onClick={() => setVariant(d.id)}>
          <span className="direction-letter">{d.letter}</span><span><strong>{d.name}</strong><small>{d.description}</small></span>
        </button>)}
      </div>
      <button className="review-hide" onClick={() => setCollapsed(true)}><Icon name="fullscreen" size={18} /><span>收起预览栏</span></button>
    </header>
    <nav className="review-screens" aria-label="选择预览界面">
      <div className="review-select"><Icon name="stack" size={18} /><select aria-label="全部预览界面" value={surface} onChange={e => changeScreen(e.target.value)}>
        {[...new Set(surfaces.map(s => s[2]))].map(group => <optgroup key={group} label={group}>{surfaces.filter(s => s[2] === group).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</optgroup>)}
      </select><span>{index + 1} / {surfaces.length}</span></div>
      <div className="review-quick">{quick.map(id => <button key={id} aria-pressed={surface === id} onClick={() => changeScreen(id)}>{surfaces.find(s => s[0] === id)[1]}</button>)}</div>
      <div className="review-paging"><button aria-label="上一个界面" onClick={() => changeScreen(surfaces[(index - 1 + surfaces.length) % surfaces.length][0])}><Icon name="back" size={17} /></button><button aria-label="下一个界面" onClick={() => changeScreen(surfaces[(index + 1) % surfaces.length][0])}><Icon name="arrow" size={17} /></button></div>
    </nav>
    <div className="review-stage">
      {loading && <div className="review-loading" role="status">正在打开{surfaces[index][1]}…</div>}
      <iframe key={`${surface}-${refresh}`} ref={frame} title="可交互的游戏界面预览" src={frameSource} allow="fullscreen" onLoad={() => { sendTheme(); setLoading(false); }} />
      {collapsed && <button className="review-restore" onClick={() => setCollapsed(false)}><Icon name="stack" size={17} />{direction.letter} · {direction.name}<span>切换方案</span></button>}
    </div>
    <footer className="review-footer"><p><strong>{direction.letter} / {direction.name}</strong>{direction.note}</p><div><span>可点击试玩 · 预览不改存档</span><button onClick={() => { setLoading(true); setRefresh(r => r + 1); }}><Icon name="reset" size={14} />重置本页</button></div></footer>
  </div>;
}
