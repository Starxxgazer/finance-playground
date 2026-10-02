import { useRef, useState, useEffect } from 'react';
import { films } from '../game/content.js';
import { asset, Button, Icon, Portrait } from './Ui.jsx';

export default function Film({ id, onContinue, onPause, paused }) {
  const film = films[id];
  const video = useRef(null);
  const [failed, setFailed] = useState(false);
  const [summary, setSummary] = useState(!film.src);
  const [ended, setEnded] = useState(false);
  useEffect(() => { if (paused) video.current?.pause(); }, [paused]);
  const showSummary = () => { video.current?.pause(); setSummary(true); };
  const isPoster = !film.src || failed || summary;
  return <main className={`film-stage ${id === 'intro' ? 'film-intro' : ''}`} aria-label="剧情展示">
    <img className="film-background" src={asset(`scenes/${film.image}.webp`)} alt="" />
    <div className="film-top"><span><Icon name="film" size={18} />剧情 {id === 'intro' ? '01' : id === 'turning' ? '02' : '03'} / 03</span><button className="light-button" onClick={onPause}><Icon name="pause" size={18} />暂停</button></div>
    {!isPoster && <video ref={video} controls playsInline preload="metadata" poster={asset(`scenes/${film.image}.webp`)} onError={() => { setFailed(true); setSummary(true); }} onEnded={() => { setEnded(true); setSummary(true); }}><source src={asset(film.src)} type="video/mp4" />{film.captions && <track kind="subtitles" src={asset(film.captions)} srcLang="zh" label="中文" default />}</video>}
    {isPoster && <div className="film-content"><div className="chapter-label">{film.kicker}<span /></div><h1>{film.title}</h1>
      <div className="film-summary">{film.summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="film-people"><Portrait person={id === 'intro' ? 'lin' : id === 'turning' ? 'chen' : 'xiaohe'} /><div><strong>{id === 'intro' ? '一份申请，两个用处。' : id === 'turning' ? '把发现带回去，把依据留下来。' : '故事告一段落，调查留下了依据。'}</strong><span>{!film.src ? '视频待接入 · 当前以剧情摘要呈现' : failed ? '视频暂时无法播放 · 可阅读摘要继续' : ended ? '剧情播放完毕' : '已切换为剧情摘要'}</span></div></div>
      <Button onClick={onContinue}>{film.next}<Icon name="arrow" /></Button>
    </div>}
    {!isPoster && <button className="film-skip light-button" onClick={showSummary}>跳过视频，阅读摘要<Icon name="arrow" size={18} /></button>}
    <div className="film-bottom"><span>留灯烘焙 · 第一章</span><span>虚构案例 / 第一人称剧情调查</span></div>
  </main>;
}
