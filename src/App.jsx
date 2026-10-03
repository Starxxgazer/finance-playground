import { useEffect, useReducer, useRef, useState } from "react";
import { scenes, byId } from "./game/content.js";
import {
  initialState,
  reducer,
  restoreState,
  SAVE_KEY,
  sceneDone,
} from "./game/state.js";
import { Icon, Button, Modal, characters, asset } from "./components/Ui.jsx";
import Evidence, {
  OldActivity,
  CustomerActivity,
  Notes,
  SideActivity,
} from "./components/Evidence.jsx";
import Film from "./components/Film.jsx";
import Funds from "./components/Funds.jsx";
import Findings, { Ending } from "./components/Findings.jsx";
import Calendar from "./components/Calendar.jsx";
import SceneView from "./components/SceneView.jsx";
import Inventory from "./components/Inventory.jsx";
import { oldSpots, newSpots, currentQuestion } from "./game/exploration.js";

function readSave() {
  try {
    return restoreState(localStorage.getItem(SAVE_KEY));
  } catch {
    return structuredClone(initialState);
  }
}
function readTheme() {
  try {
    return localStorage.getItem("finance-playground.theme") || "auto";
  } catch {
    return "auto";
  }
}
const extraTitles = {
  customer: "和门口的顾客聊聊",
  notes: "我的调查笔记",
  calendar: "把便签贴到日历上",
  invitation: "还没填日期的邀请函",
};
export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, readSave);
  const [active, setActive] = useState(null);
  const [source, setSource] = useState(null);
  const [bag, setBag] = useState(false);
  const [settings, setSettings] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const [hint, setHint] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [revisitEnding, setRevisitEnding] = useState(false);
  const [clues, setClues] = useState(false);
  const [observing, setObserving] = useState(false);
  const [motion, setMotion] = useState(() => {
    try {
      return localStorage.getItem("finance-playground.motion") !== "off";
    } catch {
      return true;
    }
  });
  const [tutorial, setTutorial] = useState(() => {
    try {
      return localStorage.getItem("finance-playground.observation") !== "seen";
    } catch {
      return true;
    }
  });
  const [workOpen, setWorkOpen] = useState(false);
  const heading = useRef(null);
  const lastInvestigation = useRef(null);
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
  const ending = state.complete && !revisitEnding;
  const done = sceneDone(state);
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("finance-playground.theme", theme);
    } catch {
      /* 主题仍在本次会话生效。 */
    }
  }, [theme]);
  useEffect(() => {
    heading.current?.focus();
    setWorkOpen(false);
    setActive(null);
    setClues(false);
    setObserving(false);
  }, [state.scene, film, ending]);
  const open = (id) => {
    setObserving(false);
    lastInvestigation.current = id;
    dispatch({ type: "READ", id });
    setClues(false);
    setActive(id);
    setHint("");
  };
  const advance = () => {
    dispatch({ type: "ADVANCE" });
    setActive(null);
    setWorkOpen(false);
    setHint("");
  };
  const spotDone = (id) =>
    id === "customer"
      ? ["taste", "queue"].every((id) => state.seen.includes(id))
      : state.scene === 0
        ? Object.hasOwn(state.tasks, id)
          ? state.tasks[id]
          : state.seen.includes(id)
        : state.seen.includes(id);
  const showHint = () => {
    if (state.scene === 2) {
      if (state.funds.gap)
        setHint(
          state.funds.explained
            ? "纸条可以收回重排。除了先后顺序，还要引用设备采购资料里的发货条件。"
            : "陈叔问的是前十天能留下多少钱。点你刚才用过的那条经营收支记录。",
        );
      else
        setHint(
          state.funds.initial
            ? "翻翻付款单，再对照付款之前的经营收支。先看日期，不要把整个月的结余提前算进来。"
            : "先到桌前，把已有和假设到账的钱、要付出去的钱分开放。小禾会帮你算余额。",
        );
      return;
    }
    if (state.scene === 0)
      setHint(
        "我是小禾。账本就在柜台上，旧设备付款的单子在烤箱旁；先把现在的钱和已付、未付的分清。",
      );
    else if (state.scene === 1)
      setHint(
        "我是小禾。陈叔把租赁、装修、设备和筹备资料留在现场了。筹备资料里还夹着开业与收入测算，翻到后可以一起对日期。",
      );
    else setHint("昨晚的记录已保留。可以直接交接，或从设置中的地点返回补查。");
  };
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
    setClues(false);
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
  const goTo = (index) => {
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
  const tools = (
    <div className="scene-tools">
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
    <div
      className="immersive-app"
      style={{
        "--art-case": `url("${asset("ui/field-case.webp")}")`,
        "--art-pocket": `url("${asset("ui/item-pocket.webp")}")`,
        "--art-paper": `url("${asset("ui/document-paper.webp")}")`,
        "--art-brass": `url("${asset("ui/brass-tab.webp")}")`,
      }}
    >
      <main
        id="main"
        aria-hidden={
          !!(active || workOpen || bag || settings || clues || source)
        }
      >
        {ending ? (
          <Ending onReview={() => setRevisitEnding(true)} />
        ) : film ? (
          <Film
            key={state.scene}
            index={state.scene}
            onContinue={() => dispatch({ type: "FILM", index: state.scene })}
          />
        ) : (
          <section
            className={`immersive-scene ${active || workOpen ? "has-focus" : ""}`}
          >
            <SceneView
              key={scene.id}
              scene={scene}
              spots={branchScene ? [] : spots}
              observing={observing}
              motion={motion}
              paused={
                !!(active || workOpen || bag || settings || clues || source)
              }
              guidedId={tutorial && state.scene === 0 ? "ledger" : undefined}
              focus={focus}
              onOpen={(id) => (id === "workbench" ? openWork() : open(id))}
              isDone={(id) => (id === "workbench" ? done : spotDone(id))}
            />
            <header className="scene-hud">
              <div className="scene-location">
                <span>第一章 · {scene.time}</span>
                <h1 ref={heading} tabIndex={-1}>
                  {scene.place}
                </h1>
                <p>{currentQuestion(state)}</p>
              </div>
              {tools}
            </header>
            <div className="scene-subtitle">
              <strong>
                {characters[state.scene < 2 ? "xiaohe" : scene.person].name}
              </strong>
              <div>
                <p>
                  {tutorial && state.scene === 0
                    ? "东西都还在原来的地方，你可以四处看看。账本就摊在柜台上。"
                    : state.scene < 2
                      ? currentQuestion(state)
                      : scene.quote}
                </p>
                {tutorial && state.scene === 0 && (
                  <small className="observation-help">
                    移动鼠标寻找轮廓，点击查看。触屏可点“观察现场”；键盘用
                    Tab、回车。
                  </small>
                )}
              </div>
              {tutorial && state.scene === 0 && (
                <button
                  className="text-button"
                  onClick={() => {
                    setTutorial(false);
                    try {
                      localStorage.setItem(
                        "finance-playground.observation",
                        "seen",
                      );
                    } catch {}
                  }}
                >
                  知道了，开始观察
                </button>
              )}
            </div>
            <footer className="scene-controls">
              <div className="scene-controls-left">
                <Button
                  secondary
                  aria-pressed={observing}
                  onClick={() => {
                    setObserving(!observing);
                    setTutorial(false);
                    try {
                      localStorage.setItem(
                        "finance-playground.observation",
                        "seen",
                      );
                    } catch {}
                  }}
                >
                  <Icon name="search" size={17} />
                  观察现场
                </Button>
                <Button secondary onClick={() => setClues(true)}>
                  当前手记
                </Button>
                <Button secondary onClick={showHint}>
                  {state.scene < 2 ? "问问小禾" : "想一想"}
                </Button>
                {state.scene === 1 && (
                  <Button secondary onClick={() => open("calendar")}>
                    <Icon name="calendar" size={17} />
                    付款日历
                  </Button>
                )}
              </div>
              {state.scene < 2 ? (
                <Button disabled={!done} onClick={advance}>
                  {scene.next}
                  <Icon name="arrow" size={17} />
                </Button>
              ) : state.scene === 2 ? (
                <Button onClick={done ? advance : openWork}>
                  {done ? scene.next : "开始核对资金"}
                  <Icon name="arrow" size={17} />
                </Button>
              ) : (
                <Button onClick={openWork}>
                  {state.submitted ? "回看公司透视图" : "打开交接资料"}
                  <Icon name="arrow" size={17} />
                </Button>
              )}
            </footer>
          </section>
        )}
      </main>
      {(film || ending) && (
        <div
          className="outside-tools"
          aria-hidden={!!(bag || settings || source)}
        >
          {tools}
        </div>
      )}
      {hint && (
        <div className="hint-banner floating-hint" role="status">
          <Icon name="hint" size={18} />
          <p>{hint}</p>
          <button
            className="icon-button"
            onClick={() => setHint("")}
            aria-label="收起提示"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {clues && (
        <Modal title="当前手记" onClose={() => setClues(false)}>
          <p className="open-question">{currentQuestion(state)}</p>
          <Notes state={state} dispatch={dispatch} />
        </Modal>
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
              />
            )}
            {state.scene === 2 && done && (
              <div className="work-next">
                <Button onClick={advance}>
                  {scene.next}
                  <Icon name="arrow" />
                </Button>
              </div>
            )}
            {state.complete && (
              <Button onClick={() => setRevisitEnding(false)}>
                回看邀请函
                <Icon name="arrow" />
              </Button>
            )}
          </div>
        </Modal>
      )}
      {saveFailed && (
        <div className="save-error" role="alert">
          浏览器暂时不能保存进度，请不要关闭或刷新页面。
        </div>
      )}
      {active && (
        <Modal
          key={active}
          title={extraTitles[active] || byId[active]?.title || "调查资料"}
          className={`scene-overlay inspection-overlay ${branchScene ? "branch-overlay" : ""} ${active === "calendar" ? "calendar-overlay" : ""}`}
          closeLabel="返回全景"
          onClose={closeInspection}
        >
          <div className="inspection-panels">
            <aside className="inspection-intro">
              <span className="eyebrow">
                {byId[active]?.nature ||
                  (active === "customer" || active === "invitation"
                    ? "现场对话"
                    : "调查手记")}
              </span>
              <h2>{extraTitles[active] || byId[active]?.title}</h2>
              <p>
                {byId[active]?.source ||
                  (active === "customer"
                    ? "站在门口，听听熟客怎么说。"
                    : active === "calendar"
                      ? "把每一笔付款放回它发生的那一天。"
                      : active === "notes"
                        ? "先记下有依据的发现，也留下还没问清的问题。"
                        : "小禾还留着这张没有填日期的邀请函。")}
              </p>
              {byId[active]?.date && <small>{byId[active].date}</small>}
              <div className="inspection-caption">
                <Icon name="notebook" size={16} />
                <span>
                  看过的资料已收入资料包。
                  <br />
                  核对完成，再记下发现。
                </span>
              </div>
            </aside>
            <div className="inspection-body" key={active}>
              {["ledger", "debt", "receipt"].includes(active) ? (
                <OldActivity
                  id={active}
                  state={state}
                  dispatch={dispatch}
                  onOpen={open}
                />
              ) : active === "customer" ? (
                <CustomerActivity state={state} dispatch={dispatch} />
              ) : active === "notes" ? (
                <Notes state={state} dispatch={dispatch} />
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
      {bag && <Inventory state={state} onClose={() => setBag(false)} />}
      {source && state.seen.includes(source) && (
        <Modal
          key={`source-${source}`}
          title="查看原资料"
          onClose={() => setSource(null)}
        >
          <Evidence id={source} />
        </Modal>
      )}
      {settings && (
        <Modal
          title={resetting ? "重新开始本章？" : "游戏设置"}
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
                    setResetting(false);
                    setSettings(false);
                    setActive(null);
                    setWorkOpen(false);
                    setClues(false);
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
              <nav className="chapter-nav" aria-label="调查场景">
                {scenes.map((s, i) => (
                  <button
                    key={s.id}
                    disabled={
                      i > state.unlocked || (state.submitted && i !== 3)
                    }
                    aria-current={state.scene === i ? "step" : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="nav-number">0{i + 1}</span>
                    {s.title}
                  </button>
                ))}
              </nav>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={motion}
                  onChange={(e) => {
                    setMotion(e.target.checked);
                    try {
                      localStorage.setItem(
                        "finance-playground.motion",
                        e.target.checked ? "on" : "off",
                      );
                    } catch {}
                  }}
                />
                场景轻微动态
              </label>
              <label className="form-label">
                阅读界面
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="auto">跟随系统</option>
                  <option value="light">明亮</option>
                  <option value="dark">深色</option>
                </select>
              </label>
              <p className="muted">
                进度自动保存在本机。公司、人物、金额与贷款条件均为虚构。
              </p>
              <div className="modal-actions">
                <Button onClick={() => setSettings(false)}>继续调查</Button>
                <Button secondary onClick={() => setResetting(true)}>
                  <Icon name="reset" />
                  重新开始
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
