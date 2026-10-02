import { useEffect, useReducer, useRef, useState } from "react";
import { scenes, byId, findings } from "./game/content.js";
import {
  initialState,
  reducer,
  restoreState,
  SAVE_KEY,
  sceneDone,
} from "./game/state.js";
import { Icon, Button, Modal, Portrait, characters } from "./components/Ui.jsx";
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
const oldSpots = [
  { id: "customer", label: "门口的顾客", icon: "chat", x: 12, y: 40 },
  { id: "ledger", label: "柜台账本", icon: "book", x: 52, y: 80 },
  { id: "debt", label: "烤箱付款清单", icon: "receipt", x: 93, y: 57 },
  { id: "receipt", label: "首款回执与约定", icon: "file", x: 71, y: 80 },
];
const newSpots = [
  { id: "rent", label: "门口的租赁资料", icon: "file", x: 11, y: 54 },
  { id: "renovation", label: "装修付款安排", icon: "receipt", x: 45, y: 80 },
  { id: "equipment", label: "设备预留位", icon: "receipt", x: 81, y: 65 },
  { id: "preparation", label: "人员与备货安排", icon: "book", x: 34, y: 81 },
];
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
  const [workOpen, setWorkOpen] = useState(false);
  const heading = useRef(null);
  const lastInvestigation = useRef(null);
  const scene = scenes[state.scene];
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
  }, [state.scene, film, ending]);
  const open = (id) => {
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
        ? state.tasks[id]
        : state.seen.includes(id);
  const showHint = () => {
    if (state.scene === 2) {
      if (state.funds.gap)
        setHint(
          state.funds.explained
            ? "纸条可以收回重排。除了先后顺序，还要引用设备采购资料里的发货条件。"
            : "陈叔问的是前十天能留下多少钱。点你刚才用过的那条经营收支记录。",
        );
      else dispatch({ type: "HINT" });
      return;
    }
    if (state.scene === 0)
      setHint(
        "点柜台、烤箱旁或门口的标记查看资料；核对后打开“调查笔记”。支线可以晚些再查。",
      );
    else if (state.scene === 1)
      setHint(
        "查看四处资料和三张说明，再打开“付款日历”。先点便签，再点原单据写的日期。",
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
            },
          ];
  // These new worktable photographs already frame people closely.
  // Keep the slow approach, but leave their faces in view.
  const focus = workOpen
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
      document.querySelector(".scene-controls > button")?.focus(),
    );
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
      (
        hotspot || document.querySelector(".scene-controls-left button")
      )?.focus();
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
      <button className="toolbar-button" onClick={() => setBag(true)}>
        <Icon name="notebook" size={18} />
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
    <div className="immersive-app">
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
          <section className={`immersive-scene ${focus ? "has-focus" : ""}`}>
            <SceneView
              key={scene.id}
              scene={scene}
              spots={spots}
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
                <p>{scene.task}</p>
              </div>
              {tools}
            </header>
            <div className="scene-subtitle">
              <strong>{characters[scene.person].name}</strong>
              <p>{scene.quote}</p>
            </div>
            <footer className="scene-controls">
              <div className="scene-controls-left">
                <Button secondary onClick={() => setClues(true)}>
                  <Icon name="search" size={17} />
                  调查清单
                </Button>
                {state.scene < 2 && (
                  <Button
                    secondary
                    onClick={() =>
                      open(state.scene === 0 ? "notes" : "calendar")
                    }
                  >
                    <Icon
                      name={state.scene === 0 ? "notebook" : "calendar"}
                      size={17}
                    />
                    {state.scene === 0 ? "调查笔记" : "付款日历"}
                    <small>
                      {state.scene === 0
                        ? `${state.solved.filter((id) => id !== "risk").length}/3`
                        : `${Object.keys(state.calendar).length}/8`}
                    </small>
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
        <Modal title="调查清单" onClose={() => setClues(false)}>
          <p className="muted">{scene.task}</p>
          <div className="clue-list">
            {spots.map((spot) => (
              <button
                key={spot.id}
                aria-label={`调查${spot.label}`}
                onClick={() =>
                  spot.id === "workbench" ? openWork() : open(spot.id)
                }
              >
                <Icon
                  name={
                    (spot.id === "workbench" ? done : spotDone(spot.id))
                      ? "check"
                      : "search"
                  }
                  size={18}
                />
                {spot.label}
                <Icon name="caret" size={16} />
              </button>
            ))}
          </div>
          {state.scene === 1 && (
            <>
              <h3>桌上的说明</h3>
              <div className="clue-list">
                {["lease", "opening", "forecast"].map((id) => (
                  <button key={id} onClick={() => open(id)}>
                    <Icon
                      name={state.seen.includes(id) ? "check" : "file"}
                      size={17}
                    />
                    {byId[id].title}
                    <Icon name="caret" size={16} />
                  </button>
                ))}
              </div>
              <h3>和小禾聊聊</h3>
              <div className="clue-list">
                <button onClick={() => open("survey")}>
                  小禾的访谈本<small>可以稍后再聊</small>
                </button>
                <button onClick={() => open("invitation")}>
                  小禾的邀请函<small>可以稍后再聊</small>
                </button>
              </div>
            </>
          )}
          <Button
            secondary
            onClick={() => {
              setClues(false);
              showHint();
            }}
          >
            给点提示
            <Icon name="hint" size={17} />
          </Button>
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
          className={`scene-overlay inspection-overlay ${active === "calendar" ? "calendar-overlay" : ""}`}
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
      {bag && (
        <Modal title="资料包" wide onClose={() => setBag(false)}>
          <p className="muted">
            资料保留原话、来源和时间。看过资料，和查清一件事，分别记录。
          </p>
          {state.seen.length ? (
            <div className="bag-documents">
              {state.seen.map((id) => (
                <button key={id} onClick={() => setSource(id)}>
                  <Icon name="file" />
                  <span>
                    <strong>{byId[id].title}</strong>
                    <small>
                      {byId[id].nature}
                      <br />
                      {byId[id].date}
                    </small>
                  </span>
                  <Icon name="caret" size={16} />
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-note">
              资料包还是空的。到店里翻开第一份资料吧。
            </p>
          )}
          <h3>已经确认的发现</h3>
          {state.solved.length ? (
            findings
              .filter((f) => state.solved.includes(f.id))
              .map((f) => (
                <div className="note" key={f.id}>
                  <h4>{f.title}</h4>
                  <p>{f.correct}</p>
                  <p className="open-question">还要问：{f.question}</p>
                </div>
              ))
          ) : (
            <p className="muted">在场景里完成核对后，调查笔记会保存在这里。</p>
          )}
          <h3>同行的人</h3>
          <div className="character-list">
            {Object.entries(characters).map(([id, person]) => (
              <div key={id}>
                <Portrait person={id} />
                <span>
                  <strong>{person.name}</strong>
                  <small>{person.role}</small>
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
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
