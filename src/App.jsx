import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { scenes, byId, oldMainTasks, calendarNotes } from "./game/content.js";
import {
  initialState,
  reducer,
  restoreState,
  SAVE_KEY,
  sceneDone,
} from "./game/state.js";
import { Icon, Button, Modal, asset } from "./components/Ui.jsx";
import Evidence, {
  OldActivity,
  CustomerActivity,
  SideActivity,
} from "./components/Evidence.jsx";
import Film from "./components/Film.jsx";
import Funds from "./components/Funds.jsx";
import Findings, { Ending } from "./components/Findings.jsx";
import Calendar from "./components/Calendar.jsx";
import NewShopActivity from "./components/NewShopActivity.jsx";
import { newShopSources, investigationDone, completionMessage } from "./game/investigation.js";
import SceneView from "./components/SceneView.jsx";
import Inventory from "./components/Inventory.jsx";
import FieldGuide from "./components/FieldGuide.jsx";
import Soundtrack, { SoundSettings } from "./components/Soundtrack.jsx";
import { musicFor } from "./game/music.js";
import { revisitTarget } from "./game/revisit.js";
import { oldSpots, newSpots } from "./game/exploration.js";

function readSave() {
  try {
    return restoreState(localStorage.getItem(SAVE_KEY));
  } catch {
    return structuredClone(initialState);
  }
}
const extraTitles = {
  customer: "和门口的顾客聊聊",
  calendar: "付款日历",
  invitation: "还没填日期的邀请函",
};
export default function App({ preview = null }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    preview ? structuredClone(preview.state) : readSave(),
  );
  const [active, setActive] = useState(null);
  const [source, setSource] = useState(null);
  const [bag, setBag] = useState(false);
  const [settings, setSettings] = useState(false);
  const [guide, setGuide] = useState(false);
  const [filmPlayback, setFilmPlayback] = useState({ clip: "intro", playing: false });
  const [resetting, setResetting] = useState(false);
  const [hint, setHint] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [revisitEnding, setRevisitEnding] = useState(false);
  const [observing, setObserving] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const [filmRevealing, setFilmRevealing] = useState(false);
  const [filmSession, setFilmSession] = useState(0);
  const [openingStarted, setOpeningStarted] = useState(false);
  const [departing, setDeparting] = useState(false);
  const heading = useRef(null);
  const lastInvestigation = useRef(null);
  const previousRevisit = useRef(null);
  const previousInvestigation = useRef(null);
  const baseScene = scenes[state.scene];
  const branchScene =
    active === "contract"
      ? "meng-meeting"
      : active === "invitation"
        ? "invitation-closeup"
        : null;
  const scene = branchScene
    ? {
        ...baseScene,
        id: branchScene,
        place:
          active === "contract" ? "老店门外 · 当面核对" : "新铺窗边 · 邀请函",
      }
    : baseScene;
  const film = !state.films.includes(state.scene) && !state.submitted;
  const atHome = film && state.scene === 0 && !openingStarted;
  const ending = state.complete && !revisitEnding;
  const done = sceneDone(state);
  useLayoutEffect(() => {
    if (preview) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
  }, []);
  useEffect(() => {
    heading.current?.focus();
    setFilmRevealing(false);
    setWorkOpen(false);
    setActive(null);
    setObserving(false);
  }, [state.scene, film, ending]);
  useEffect(() => {
    if (!preview) return;
    setActive(preview.active || null);
    setSource(preview.source || null);
    setBag(!!preview.bag);
    setSettings(!!preview.settings);
    setWorkOpen(!!preview.workOpen);
  }, [preview]);
  const open = (id) => {
    setObserving(false);
    lastInvestigation.current = id;
    dispatch({ type: "READ", id });
    setActive(id);
    setHint("");
  };
  useEffect(() => {
    const previous = previousRevisit.current;
    previousRevisit.current = state.revisit;
    if (state.revisit) {
      setWorkOpen(false);
      setSource(null);
      setBag(false);
      setSettings(false);
      setRevisitEnding(false);
      open(state.revisit.activity);
    } else if (previous && state.scene === 3) {
      setActive(null);
      setSource(null);
      setWorkOpen(true);
      setHint("补查资料已保留，请交给林姐更新透视图。");
    }
  }, [state.revisit]);
  const returnFromRevisit = () => dispatch({ type: "RETURN_REVISIT" });
  useEffect(() => {
    if (!departing) return;
    const timer = setTimeout(() => {
      dispatch({ type: "ADVANCE" });
      setActive(null);
      setWorkOpen(false);
      setHint("");
      setDeparting(false);
    }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 360);
    return () => clearTimeout(timer);
  }, [departing]);
  const advance = () => setDeparting(true);
  const spotDone = (id) => investigationDone(state, id);
  const spots =
    state.scene === 0
      ? oldSpots
      : state.scene === 1
        ? newSpots
        : [
            {
              id: "workbench",
              label:
                state.scene === 2 ? "资金桌上的资料" : "林姐面前的调查资料",
              x: 50,
              y: 77,
              width: 32,
              height: 16,
              shape: "folder",
            },
          ];
  // Only the old shop teaches exploration one object at a time. Later scenes
  // state the question and let the player decide what to inspect next.
  const nextSpot = state.scene === 0
    ? oldMainTasks.map((id) => spots.find((spot) => spot.id === id))
      .find((spot) => spot && !spotDone(spot.id))
    : null;
  const nextTask = nextSpot ? ({
    ledger: "点开柜台账本",
    debt: "核对烤箱旁的付款清单",
    receipt: "核对首款回执",
  })[nextSpot.id] : done
    ? state.scene < 3 ? scene.next : "调查已交接"
    : scene.heading;
  const mainProgress = state.scene === 0
    ? `主线 ${oldMainTasks.filter((id) => spotDone(id)).length} / ${oldMainTasks.length}`
    : `日期 ${calendarNotes.filter((note) => state.calendar[note.id] === note.day).length} / ${calendarNotes.length}`;
  // These new worktable photographs already frame people closely.
  // Keep the slow approach, but leave their faces in view.
  const focus = branchScene
    ? null
    : workOpen
      ? {
          x: 50,
          y: 48,
          portraitX: state.scene === 2 ? 39 : 50,
          portraitY: 22,
          zoom: 1.12,
        }
      : active
        ? spots.find((s) => s.id === active) ||
          (state.scene === 0 ? oldSpots[1] : newSpots[3])
        : null;
  const openWork = () => {
    setWorkOpen(true);
    setHint("");
  };
  const closeWork = () => {
    setWorkOpen(false);
    requestAnimationFrame(() =>
      restoreSceneFocus(document.querySelector(".scene-controls > button")),
    );
  };
  const restoreSceneFocus = (target) => {
    const focused = document.activeElement;
    // A delayed return must not replace a new keyboard or pointer focus.
    if (
      focused &&
      focused !== document.body &&
      focused !== document.documentElement &&
      focused.isConnected &&
      focused.getClientRects().length
    )
      return;
    target?.focus();
  };
  const closeInspection = () => {
    setActive(null);
    requestAnimationFrame(() => {
      const label = spots.find(
        (spot) => spot.id === lastInvestigation.current,
      )?.label;
      const hotspot = [...document.querySelectorAll(".world-hotspot")].find(
        (button) => button.getAttribute("aria-label") === `调查${label}`,
      );
      restoreSceneFocus(
        hotspot || document.querySelector(".scene-controls-left button"),
      );
    });
  };
  useEffect(() => {
    const id = active || (workOpen && state.scene === 2 ? "workbench" : null);
    const previous = previousInvestigation.current;
    previousInvestigation.current = { id, state };
    // Close only on a newly verified result, never merely on opening a saved item.
    if (id && previous?.id === id && previous.state.scene === state.scene &&
      !investigationDone(previous.state, id) && investigationDone(state, id)) {
      setSource(null);
      if (state.revisit) returnFromRevisit();
      else if (id === "workbench") closeWork();
      else closeInspection();
      setHint(completionMessage(id));
    }
  }, [state, active, workOpen]);
  const goTo = (index) => {
    if (index !== state.scene) setOpeningStarted(false);
    dispatch({ type: "GOTO", index });
    setSettings(false);
    setWorkOpen(false);
    setActive(null);
    setHint("");
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else setHint("当前浏览器暂不支持全屏，横屏也可以完整看现场。");
    } catch {
      setHint("当前浏览器暂不支持全屏，横屏也可以完整看现场。");
    }
  };
  const musicTrack = musicFor({ scene: state.scene, active, film, clip: filmPlayback.clip, ending, atHome });
  const tools = (
    <div className="scene-tools">
      <button className="icon-button" aria-label="任务与道具" onClick={() => setGuide(true)}><Icon name="book" /></button>
      <button
        className="toolbar-button"
        aria-label="资料包"
        onClick={() => setBag(true)}
      >
        <img
          className="satchel-icon"
          src={asset("ui/satchel.webp")}
          alt=""
          aria-hidden="true"
        />
        <span>资料包</span>
        <small>{state.seen.length}</small>
      </button>
      <button
        className="icon-button fullscreen-button"
        aria-label="切换全屏"
        onClick={fullscreen}
      >
        <Icon name="fullscreen" />
      </button>
      <button
        className="icon-button"
        aria-label="游戏设置"
        onClick={() => setSettings(true)}
      >
        <Icon name="settings" />
      </button>
    </div>
  );
  return (
    <Soundtrack track={musicTrack} persist={!preview}
      paused={!!(settings || guide || bag || source || (film && !filmPlayback.playing))}
      quiet={!!film} reading={!!(active || workOpen)}>
      {sound => <div
      className={`immersive-app ${departing ? "is-departing" : ""}`}
      style={{
        "--art-case": `url("${asset("ui/field-case.webp")}")`,
        "--art-pocket": `url("${asset("ui/item-pocket.webp")}")`,
        "--art-paper": `url("${asset("ui/document-paper.webp")}")`,
        "--art-brass": `url("${asset("ui/brass-tab.webp")}")`,
        "--art-fiber": `url("${asset("ui/notebook-fiber.webp")}")`,
      }}
    >
      <main
        id="main"
        aria-hidden={
          !!(active || workOpen || bag || settings || source || guide)
        }
      >
        {ending ? (
          <Ending onReview={() => setRevisitEnding(true)} />
        ) : null}
        {!ending && film && (
          <Film
            key={`${state.scene}-${filmSession}`}
            index={state.scene}
            paused={!!(bag || settings || source || guide)}
            muted={sound.muted}
            onMutedChange={sound.setMuted}
            onPlaybackChange={setFilmPlayback}
            onStart={() => setOpeningStarted(true)}
            onSettings={() => setSettings(true)}
            onReveal={() => setFilmRevealing(true)}
            onContinue={() => {
              dispatch({ type: "FILM", index: state.scene });
              setFilmRevealing(false);
            }}
          />
        )}
        {!ending && (!film || filmRevealing) && (
          <section
            className={`immersive-scene ${active || workOpen ? "has-focus" : ""} ${film ? "scene-revealing" : ""}`}
            inert={film || undefined}
            aria-hidden={film || undefined}
          >
            <SceneView
              key={scene.id}
              scene={scene}
              spots={branchScene ? [] : spots}
              observing={observing}
              paused={
                !!(film || active || workOpen || bag || settings || source || guide)
              }
              guidedId={nextSpot?.id}
              guideText={nextTask}
              guideNote={state.scene === 0 && !done ? "主线查完就能走，支线想看再看。" : ""}
              resultMessage={hint}
              focus={focus}
              onOpen={(id) => (id === "workbench" ? openWork() : open(id))}
              isDone={(id) => (id === "workbench" ? done : spotDone(id))}
            />
            <header className="scene-hud">
              <div className="scene-location">
                <span>{state.chapterCleared ? "第一章已通关 · 回看与选看补查" : `第一章 · ${scene.time}`}</span>
                <h1 ref={heading} tabIndex={-1}>
                  {scene.place}
                </h1>
              </div>
              {tools}
            </header>
            <footer className="scene-controls">
              <div className="scene-explore-tools">
                <small className="scene-explore-help">
                  点击物品调查
                  <span className="explore-mouse"> · 鼠标靠近两侧看全景</span>
                  <span className="explore-touch"> · 左右滑动看全景</span>
                </small>
                <div className="scene-controls-left">
                  <Button
                    secondary
                    aria-pressed={observing}
                    onClick={() => {
                      setObserving(!observing);
                    }}
                  >
                    <Icon name="search" size={17} />
                    观察现场
                  </Button>
                  {state.scene === 1 && (
                    <Button secondary onClick={() => open("calendar")}>
                      <Icon name="calendar" size={17} />
                      付款日历
                    </Button>
                  )}
                </div>
              </div>
              {state.revisit ? (
                <Button onClick={returnFromRevisit}>返回林姐 · 补交资料</Button>
              ) : state.scene < 2 ? (
                <div className={`scene-next ${done ? "is-ready" : ""}`}>
                  <small role="status">{done ? "主线已完成，支线没查完也能走" : mainProgress}</small>
                  <Button disabled={!done} onClick={advance}>
                    {scene.next}
                  </Button>
                </div>
              ) : state.scene === 2 ? (
                <Button onClick={done ? advance : openWork}>
                  {done ? scene.next : "开始核对资金"}

                </Button>
              ) : (
                <Button onClick={openWork}>
                  {state.submitted ? "回看公司透视图" : "打开交接资料"}

                </Button>
              )}
            </footer>
          </section>
        )}
      </main>
      {!atHome && (film || ending) && (
        <div
          className="outside-tools"
          aria-hidden={!!(bag || settings || source || guide)}
        >
          {tools}
        </div>
      )}
      {hint && (film || ending) && (
        <div key={hint} className="hint-banner floating-hint" role="status">
          <p>{hint}</p>
        </div>
      )}
      {workOpen && !ending && !film && (
        <Modal
          title={state.scene === 2 ? "打烊后的资金桌" : "把调查交给林姐"}
          className="scene-overlay work-overlay"
          closeLabel="返回全景"
          onClose={closeWork}
        >
          <div className="work-glass">
            {state.scene === 2 ? (
              <Funds state={state} dispatch={dispatch} onSource={setSource} />
            ) : (
              <Findings
                state={state}
                dispatch={dispatch}
                onSource={setSource}
                onEnding={() => setRevisitEnding(false)}
              />
            )}
            {state.scene === 2 && done && (
              <div className="work-next">
                <Button onClick={advance}>
                  {scene.next}

                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
      {departing && <div className="scene-departure" role="status" aria-label="正在前往下一处" />}
      {saveFailed && (
        <div className="save-error" role="alert">
          浏览器暂时不能保存进度，请不要关闭或刷新页面。
        </div>
      )}
      {active && (
        <Modal
          key={active}
          title={extraTitles[active] || byId[active]?.title || "调查资料"}
          className={`scene-overlay inspection-overlay simple-inspection clue-${active} ${branchScene ? "branch-overlay" : ""} ${active === "calendar" ? "calendar-overlay" : ""} ${active === "transfer" ? "trace-overlay" : ""} ${newShopSources[active] ? "newshop-overlay" : ""}`}
          closeLabel={state.revisit ? "返回林姐 · 补交资料" : "返回全景"}
          onClose={state.revisit ? returnFromRevisit : closeInspection}
        >
          <div className="inspection-panels">
            <div className="inspection-body" key={active}>
              {state.revisit && <p className="choice-guidance revisit-guidance">
                {state.chapterCleared ? "已通关 · 选看补查：" : "补查："}{byId[state.revisit.id].title}。{revisitTarget(state, state.revisit.id)?.instruction}
                <span> 完成后返回林姐补交；也可随时返回，已收集资料会保留。</span>
              </p>}
              {!state.revisit && spots.find((spot) => spot.id === active)?.optional && (
                <p className="optional-investigation">支线 · 可随时返回</p>
              )}
              {newShopSources[active] ? (
                <NewShopActivity id={active} state={state} dispatch={dispatch} />
              ) : ["ledger", "debt", "receipt"].includes(active) ? (
                <OldActivity
                  id={active}
                  state={state}
                  dispatch={dispatch}
                  onOpen={open}
                />
              ) : active === "customer" ? (
                <CustomerActivity state={state} dispatch={dispatch} />
              ) : active === "calendar" ? (
                <Calendar
                  state={state}
                  dispatch={dispatch}
                  onSource={setSource}
                />
              ) : ["contract", "transfer", "survey", "invitation"].includes(
                  active,
                ) ? (
                <SideActivity id={active} state={state} dispatch={dispatch} />
              ) : (
                <>
                  <Evidence id={active} />
                  {active === "rent" && <Evidence id="lease" compact />}
                  {active === "preparation" && (
                    <>
                      <Evidence id="opening" compact />
                      <Evidence id="forecast" compact />
                    </>
                  )}
                  {[
                    "rent",
                    "renovation",
                    "equipment",
                    "preparation",
                    "opening",
                  ].includes(active) && (
                    <Button secondary onClick={() => open("calendar")}>
                      <Icon name="calendar" />
                      把付款便签放到日历
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
      {bag && <Inventory state={state} onClose={() => setBag(false)}
        initialSection={preview?.bagSection} initialSelected={preview?.bagItem} />}
      {source && state.seen.includes(source) && (
        <Modal
          key={`source-${source}`}
          title="查看原资料"
          className="source-modal"
          onClose={() => setSource(null)}
        >
          <Evidence id={source} />
        </Modal>
      )}
      {guide && <Modal title="任务与道具" className="field-guide-modal" onClose={() => setGuide(false)}><FieldGuide scene={state.scene} /></Modal>}
      {["blocked", "failed"].includes(sound.status) && !settings && !guide && !sound.muted && sound.volume > 0 && <button className="music-recover" onClick={sound.retry}>{sound.status === "blocked" ? "开启背景音乐" : "重试背景音乐"}</button>}
      {settings && (
        <Modal
          title={resetting ? "重新开始本章？" : "游戏设置"}
          className="settings-modal"
          onClose={() => {
            setSettings(false);
            setResetting(false);
          }}
        >
          {resetting ? (
            <>
              <p>这会清除本机这次调查的进度，从开场重新开始。</p>
              <div className="modal-actions">
                <Button secondary onClick={() => setResetting(false)}>
                  保留进度
                </Button>
                <Button
                  onClick={() => {
                    dispatch({ type: "RESET" });
                    setFilmSession((value) => value + 1);
                    setOpeningStarted(false);
                    setFilmRevealing(false);
                    setResetting(false);
                    setSettings(false);
                    setActive(null);
                    setWorkOpen(false);
                    setSource(null);
                    setBag(false);
                    setHint("");
                    setRevisitEnding(false);
                  }}
                >
                  确定重新开始
                </Button>
              </div>
            </>
          ) : (
            <>
              <p>没有倒计时，也不扣分。选错可以改，支线可以跳过。</p>
              <Button secondary onClick={() => { setSettings(false); setGuide(true); }}><Icon name="book" />任务与道具 · 林姐的叮嘱</Button>
              <SoundSettings sound={sound} />
              {!atHome && <nav className="chapter-nav" aria-label="调查场景">
                {scenes.map((s, i) => (
                  <button
                    key={s.id}
                    disabled={
                      !!state.revisit || i > state.unlocked || (state.submitted && i !== 3)
                    }
                    aria-current={state.scene === i ? "step" : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="nav-number">0{i + 1}</span>
                    {s.title}
                  </button>
                ))}
              </nav>}
              <p className="muted">
                进度自动保存在本机。公司、人物、金额与贷款条件均为虚构。
              </p>
              <div className="modal-actions">
                <Button onClick={() => setSettings(false)}>{atHome ? "返回首页" : "继续调查"}</Button>
                {atHome && <Button secondary onClick={fullscreen}><Icon name="fullscreen" />切换全屏</Button>}
                {!atHome && <Button secondary onClick={() => setResetting(true)}>
                  <Icon name="reset" />
                  重新开始
                </Button>}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>}
    </Soundtrack>
  );
}
