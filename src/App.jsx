import { useEffect, useReducer, useRef, useState } from 'react';
import { scenes, evidence, byId, findings, films } from './game/content.js';
import { initialState, reducer, restoreState, SAVE_KEY, sceneDone } from './game/state.js';
import { Icon, Button, Modal, Dialogue, Portrait, characters, asset } from './components/Ui.jsx';
import Evidence from './components/Evidence.jsx';
import Film from './components/Film.jsx';
import Funds from './components/Funds.jsx';
import Findings from './components/Findings.jsx';

function readSave() { try { return restoreState(localStorage.getItem(SAVE_KEY)); } catch { return { ...initialState }; } }
export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, readSave);
  const [active, setActive] = useState(null);
  const [source, setSource] = useState(null);
  const [notebook, setNotebook] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [replay, setReplay] = useState(null);
  const [hint, setHint] = useState('');
  const [locate, setLocate] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const stageHeading = useRef(null);
  const filmId = replay || (!state.introDone ? 'intro' : state.scene === 3 && !state.turningDone ? 'turning' : state.complete && !state.endingDone ? 'ending' : null);
  const scene = scenes[state.scene];
  const collected = scene.evidence.filter((id) => state.seen.includes(id)).length;
  const done = sceneDone(state);
  useEffect(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); setSaveFailed(false); } catch { setSaveFailed(true); } }, [state]);
  useEffect(() => { stageHeading.current?.focus(); }, [state.scene, filmId]);
  useEffect(() => {
    if (filmId || paused || notebook || source || active || done) return;
    let timer;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => setHint(state.scene < 2 ? '可以点亮场景中的线索，也可以从下方调查清单开始。' : '可以点击右上角“提示”，查看当前步骤。'), 45000); };
    reset(); window.addEventListener('pointerdown', reset); window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('pointerdown', reset); window.removeEventListener('keydown', reset); };
  }, [filmId, paused, notebook, source, active, done, state.scene]);

  const changeScene = (index) => { dispatch({ type: 'GOTO', index }); setActive(null); setHint(''); setLocate(false); setImageFailed(false); };
  const advance = () => { dispatch({ type: 'ADVANCE' }); setActive(null); setHint(''); setLocate(false); setImageFailed(false); };
  const finishFilm = () => { if (replay) setReplay(null); else dispatch({ type: 'FILM', id: filmId }); };
  const openEvidence = (id) => { setActive(id); setHint(''); setLocate(false); };
  const showHint = () => {
    if (state.scene < 2) { const remaining = scene.evidence.find((id) => !state.seen.includes(id)); setHint(remaining ? `试着查看“${byId[remaining].title}”，阅读后点击“记入调查记录”。` : '这一处的调查已经完成，可以前往下一处。'); }
    else if (state.scene === 2) setHint(['点击四张资金卡，核对第1天的来源和用途。', '把老店结余、新店后续付款、试营业结余与首月还款都算进去。', '切换到第10天，比较1万元可用增量和6万元待付款。', '顺序是：付款 → 发货 → 安装准备 → 试营业 → 收款。'][state.fundStage]);
    else setHint('贷款用途看旧设备资料与新店预算；时间错配看经营排期、付款预算与资金模型；最后试试暂缓新店。');
  };
  return <div className="app-shell">
    <header className="app-header"><div className="brand"><span className="brand-mark"><Icon name="book" size={24} /></span><div><strong>这笔钱借给谁</strong><span>第一章 · 排队的面包店</span></div></div>
      <nav className="chapter-nav" aria-label="调查场景">{scenes.map((s, i) => <button key={s.id} className={!filmId && state.scene === i ? 'active' : ''} aria-current={!filmId && state.scene === i ? 'step' : undefined} disabled={i > state.unlocked || !!filmId} onClick={() => changeScene(i)}><span className="nav-number">{sceneDone(state, i) ? <Icon name="check" size={15} /> : `0${i + 1}`}</span><span>{s.title}</span>{i > state.unlocked && <Icon name="lock" size={12} />}</button>)}</nav>
      <div className="header-actions"><button className="toolbar-button" onClick={() => setNotebook(true)}><Icon name="notebook" /><span>调查记录</span></button>{!filmId && <><button className="icon-button" aria-label="提示" title="提示" onClick={showHint}><Icon name="hint" /></button><button className="icon-button" aria-label="暂停" title="暂停" onClick={() => setPaused(true)}><Icon name="pause" /></button></>}</div>
    </header>
    {filmId ? <Film key={filmId} id={filmId} onContinue={finishFilm} onPause={() => setPaused(true)} paused={paused || notebook || !!source} /> : <main className={`game-main scene-${scene.id}`}>
      <div className="scene-heading"><div><div className="location-label"><Icon name="pin" size={15} />{scene.place}<span> / {scene.time}</span></div><h1 ref={stageHeading} tabIndex={-1}>{scene.heading}</h1><p>{scene.task}</p></div><div className="scene-counter"><strong>0{state.scene + 1}</strong><span> / 04</span></div></div>
      {hint && <div className="hint-banner" role="status"><Icon name="hint" size={20} /><span>{hint}</span><button className="icon-button" onClick={() => setHint('')} aria-label="收起提示"><Icon name="close" size={16} /></button></div>}
      {state.scene < 2 ? <div className={`investigation-layout ${active ? 'has-document' : ''}`}>
        <section className="scene-picture" aria-label={`${scene.title}可调查场景`}><img src={asset(`scenes/${scene.id}.webp`)} alt={state.scene === 0 ? '暖光下的面包店：顾客、收银台、烤箱与付款资料。' : '尚未开业的新铺：预算桌、日历与等待设备的空位。'} onError={() => setImageFailed(true)} />
          <div className="scene-picture-top"><span><Icon name="search" size={16} />点击线索，查看资料</span><span>{collected} / {scene.evidence.length} 已记录</span></div>
          {imageFailed && <p className="image-fallback">场景图片暂时无法加载，仍可用下方调查清单查看全部资料。</p>}
          {scene.evidence.map((id, index) => { const item = byId[id]; return <button key={id} className={`hotspot ${state.seen.includes(id) ? 'read' : ''} ${active === id ? 'active' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={`调查${item.title}`} onClick={() => openEvidence(id)}><span className="hotspot-dot">{state.seen.includes(id) ? <Icon name="check" size={16} /> : <Icon name="search" size={17} />}</span><span className="hotspot-label"><small>0{index + 1}</small>{item.short}</span></button>; })}
          {locate && <div className="equipment-location"><Icon name="pin" size={24} /><span>新烤箱、冷藏柜预留位置<br />等待付款后发货</span></div>}
          <div className="scene-picture-bottom"><span>{state.scene === 0 ? '面包的香气，还飘在店里。' : '新店的样子，暂时还在图纸上。'}</span><button onClick={() => setReplay('intro')}><Icon name="film" size={15} />回顾来意</button></div>
        </section>
        <aside className="investigation-aside">{active ? <><button className="document-close" onClick={() => { setActive(null); setLocate(false); }} aria-label="收起资料"><Icon name="close" size={18} /></button><Evidence key={active} item={byId[active]} collected={state.seen.includes(active)} onCollect={() => { dispatch({ type: 'READ', id: active }); setActive(null); setLocate(false); }} onSource={setSource} onLocate={() => setLocate(!locate)} /></> : <div className="field-notes"><span className="small-heading">本次调查</span><h2>{state.scene === 0 ? <>从眼前的热闹，<br />往里看一步。</> : <>从效果图，<br />看到付款单。</>}</h2><p>{state.scene === 0 ? '你需要了解这家公司怎样经营、现在有多少钱，以及哪些款项还要支付。' : '一家店能否如期开门，取决于预算、日期和每一项准备是否接得上。'}</p><div className="field-checklist">{scene.evidence.map((id) => <button key={id} onClick={() => openEvidence(id)}><span className={state.seen.includes(id) ? 'checked' : ''}>{state.seen.includes(id) && <Icon name="check" size={13} />}</span>{byId[id].title}<Icon name="caret" size={14} /></button>)}</div><Dialogue person={state.scene === 0 ? 'chen' : 'xiaohe'}>{state.scene === 0 ? scene.quote : '“我先做了一张，日期还没敢填。”'}</Dialogue></div>}</aside>
      </div> : <section className="table-scene" style={{ backgroundImage: `url("${asset(`scenes/${scene.id}.webp`)}")` }} aria-label={scene.title}>{state.scene === 2 ? <Funds state={state} dispatch={dispatch} onSource={setSource} /> : <Findings state={state} dispatch={dispatch} onSource={setSource} />}</section>}
      <section className="evidence-shelf" aria-label="调查资料"><div className="shelf-label"><Icon name="notebook" size={21} /><div><strong>{state.scene < 2 ? '调查清单' : '证据夹'}</strong><span>{state.scene < 2 ? '点击查看 · 随时回看' : `${state.seen.length} 条资料可回溯`}</span></div></div><div className="evidence-tabs">{(state.scene < 2 ? scene.evidence : state.seen).map((id) => <button key={id} className={`${state.seen.includes(id) ? 'collected' : ''} ${active === id ? 'active' : ''}`} onClick={() => state.scene < 2 ? openEvidence(id) : setSource(id)}><Icon name={state.seen.includes(id) ? 'check' : byId[id].icon} size={15} />{byId[id].short}</button>)}</div></section>
      <footer className="scene-footer"><div><span className={`status-indicator ${done ? 'is-done' : ''}`} /><span>{done ? state.scene === 3 ? '调查完成 · 三条发现都有依据' : '本场景已完成，可以继续' : state.scene < 2 ? `还有 ${scene.evidence.length - collected} 处资料等待记录` : state.scene === 2 ? '核对资金与日期后继续' : `已完成 ${state.solved.length} / 3 条发现`}</span><small>{saveFailed ? '本次进度暂不能保存，请勿关闭页面' : '进度已保存在本机'}</small></div>{state.complete && state.scene === 3 ? <Button secondary onClick={() => setReplay('ending')}>回看尾声<Icon name="film" size={18} /></Button> : <Button disabled={!done} onClick={advance}>{scene.next}<Icon name="arrow" size={18} /></Button>}</footer>
    </main>}
    <div className="app-footnote"><span>Finance Playground · 玩转金融</span><span>公司、人物、金额及贷款条件均为虚构案例</span></div>
    {source && <Modal key={`source-${source}`} title="资料来源" onClose={() => setSource(null)}><Evidence key={source} item={byId[source]} collected compact onSource={() => document.getElementById('source-detail')?.scrollIntoView({ behavior: 'auto', block: 'nearest' })} /><div className="source-detail" id="source-detail"><h3>来源摘要</h3><p>{byId[source].sourceText}</p><p className="model-note">记录与预测分别呈现；没有提供的逐笔凭据不作补写。</p></div></Modal>}
    {notebook && <Modal title="调查记录" onClose={() => setNotebook(false)} wide><div className="notebook-section"><h3>已记录的资料 <span>{state.seen.length}</span></h3>{!state.seen.length ? <p>调查开始后，将现场资料记入这里，随时回看。</p> : <div className="notebook-grid">{state.seen.map((id) => <button key={id} onClick={() => setSource(id)}><Icon name={byId[id].icon} /><span>{byId[id].title}<small>{byId[id].nature}</small></span><Icon name="caret" size={16} /></button>)}</div>}</div><div className="notebook-section"><h3>调查发现</h3>{state.solved.length ? findings.filter((f) => state.solved.includes(f.id)).map((f) => <div className="record-finding" key={f.id}><Icon name="check" size={18} /><p>{f.result}</p></div>) : <p>收集资料并核对资金后，在银行整理有依据的发现。</p>}</div><div className="notebook-section"><h3>故事中的人</h3><div className="character-list">{Object.entries(characters).map(([id, person]) => <div key={id}><Portrait person={id} /><div><strong>{person.name}</strong><span>{person.role}</span></div></div>)}</div></div></Modal>}
    {paused && <Modal title={resetting ? '重新开始本章？' : '先歇一会儿'} onClose={() => { setPaused(false); setResetting(false); }}>{resetting ? <><p>这会清除本机保存的本章进度，从剧情开场重新开始。</p><div className="modal-actions"><Button secondary onClick={() => setResetting(false)}>保留进度</Button><Button onClick={() => { dispatch({ type: 'RESET' }); setPaused(false); setResetting(false); setReplay(null); setActive(null); setHint(''); setSource(null); setNotebook(false); }}>重新开始</Button></div></> : <><p>没有倒计时。资料和调查进度都留在这里。</p><Button onClick={() => setPaused(false)}><Icon name="play" size={18} />继续调查</Button><div className="pause-links"><button onClick={() => { setPaused(false); setReplay('intro'); }}>回顾开场</button>{state.turningDone && <button onClick={() => { setPaused(false); setReplay('turning'); }}>回顾资金桌剧情</button>}{state.endingDone && <button onClick={() => { setPaused(false); setReplay('ending'); }}>回顾尾声</button>}<button onClick={() => setResetting(true)}><Icon name="reset" size={16} />重新开始本章</button></div></>}</Modal>}
  </div>;
}
