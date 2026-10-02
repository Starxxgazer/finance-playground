import { useState } from "react";
import { byId, assumption, chain } from "../game/content.js";
import {
  calculatePlan,
  evaluateProof,
  getLine,
  validChain,
} from "../game/model.js";
import { Button, Icon, Dialogue } from "./Ui.jsx";
import Evidence, { Feedback } from "./Evidence.jsx";
import { Month } from "./Calendar.jsx";

export function EvidencePicker({
  seen,
  refs,
  onChange,
  max = 2,
  hint = false,
  label = "选取依据",
}) {
  const [doc, setDoc] = useState("");
  const [feedback, setFeedback] = useState("");
  function add(line) {
    if (refs.length >= max) {
      setFeedback("桌上已经放满了。先收起一条，再换别的依据。");
      return;
    }
    onChange([...refs, { doc, line }]);
    setFeedback("");
  }
  return (
    <div className="evidence-picker">
      <div className="reference-slots">
        {Array.from({ length: max }, (_, i) => {
          const ref = refs[i];
          return (
            <div className={`reference-slot ${ref ? "filled" : ""}`} key={i}>
              {ref ? (
                <>
                  <small>{byId[ref.doc].title}</small>
                  <p>{getLine(ref)?.text}</p>
                  <button
                    className="text-button"
                    aria-label={`收起第${i + 1}份依据`}
                    onClick={() => onChange(refs.filter((_, j) => j !== i))}
                  >
                    <Icon name="close" size={14} />
                    收起，换一条
                  </button>
                </>
              ) : (
                <>
                  <Icon name="file" size={24} />
                  <p>第{i + 1}份依据</p>
                  <small>从原资料圈出一行</small>
                </>
              )}
            </div>
          );
        })}
      </div>
      <label className="form-label">
        {label}
        <select
          aria-label={label}
          value={doc}
          onChange={(e) => {
            setDoc(e.target.value);
            setFeedback("");
          }}
        >
          <option value="">翻开资料包中的一份资料</option>
          {seen.map((id) => (
            <option value={id} key={id}>
              {byId[id].title}
            </option>
          ))}
        </select>
      </label>
      {doc && (
        <div className="selectable-lines">
          <div className="document-source">
            {byId[doc].nature} / {byId[doc].date}
          </div>
          {byId[doc].lines.map((line) => (
            <button
              key={line.id}
              className={
                hint && ["old-early", "new-later"].includes(line.canonical)
                  ? "hint-line"
                  : ""
              }
              onClick={() => add(line.id)}
            >
              <span>{line.text}</span>
              <Icon name="link" size={18} />
            </button>
          ))}
        </div>
      )}
      <Feedback>{feedback}</Feedback>
    </div>
  );
}
export default function Funds({ state, dispatch, onSource }) {
  const f = state.funds;
  const [sheet, setSheet] = useState(false);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [chainFeedback, setChainFeedback] = useState("");
  const plan = calculatePlan();
  const gapWan = Math.abs(plan.day10) / 10000;
  function openSheet() {
    dispatch({ type: "READ", id: "calculation" });
    setSheet(!sheet);
  }
  return (
    <div className={`funds-workspace ${f.gap ? "has-gap" : "is-selecting"}`}>
      <div className="desk-intro">
        <div>
          <span className="section-caption">桌上的计算表</span>
          <h2>月底剩两千，中间呢？</h2>
          <p className="assumption">{assumption}</p>
        </div>
        <Button secondary onClick={openSheet} aria-expanded={sheet}>
          <Icon name="book" />
          {sheet ? "收起计算表" : "展开陈叔的计算表"}
        </Button>
      </div>
      {sheet && (
        <div className="calculation-sheet">
          <Evidence id="calculation" />
          {f.initial ? (
            <Feedback success>月初首批付款后剩0元，已核对。</Feedback>
          ) : (
            <form
              className="initial-form"
              onSubmit={(e) => {
                e.preventDefault();
                dispatch({ type: "INITIAL", value });
                setFeedback(
                  value.trim() === "0"
                    ? ""
                    : "按表上的2＋20－10－12再算一遍。这是首批付款后的余额。",
                );
              }}
            >
              <label className="form-label">
                月初首批付款后，剩多少万元？
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  inputMode="decimal"
                  placeholder="填写你的计算结果"
                />
              </label>
              <Button type="submit">核对月初余额</Button>
              <Feedback>{feedback}</Feedback>
            </form>
          )}
        </div>
      )}
      {!f.gap ? (
        <>
          <div className="funds-grid">
            <section>
              <h3>你最想检查哪一天？</h3>
              <Month
                day={f.day}
                onDay={(day) => {
                  dispatch({ type: "DAY", day });
                  setFeedback("");
                }}
              />
              <p className="muted">没有具体收付款资料的日期，不能推算余额。</p>
            </section>
            <section className="desk-evidence">
              <h3>把两份依据放到桌上</h3>
              <EvidencePicker
                seen={state.seen}
                refs={f.refs}
                onChange={(refs) => {
                  dispatch({ type: "REFS", refs });
                  setFeedback("");
                }}
                hint={f.hint === 3}
              />
              <Button
                onClick={() => {
                  const result = evaluateProof(
                    f.day,
                    f.refs,
                    f.initial,
                    state.seen,
                  );
                  dispatch({ type: "CALCULATE" });
                  setFeedback(result.ok ? "" : result.message);
                }}
              >
                一起算算
                <Icon name="arrow" />
              </Button>
              <Feedback>{feedback}</Feedback>
            </section>
          </div>
          <div className="hint-row">
            <Button secondary onClick={() => dispatch({ type: "HINT" })}>
              <Icon name="hint" />
              给点提示
            </Button>
            {f.hint > 0 && (
              <p role="status">
                {
                  [
                    "",
                    "先花钱，还是先收到钱？翻翻每笔付款前需要发生什么。",
                    "把付款日和同一段时间的经营收支放在一起，别把整月的钱提前用掉。",
                    "看看新店预算的后续付款，再找老店“1至10日”的经营收支。相关段落已在选资料时标出，日期仍由你来选。",
                  ][f.hint]
                }
              </p>
            )}
          </div>
        </>
      ) : !f.explained ? (
        <section className="gap-discovery">
          <div className="section-title">
            <h3>这一天，接不上了。</h3>
            <span className="stamp">按原计划估算</span>
          </div>
          <div className="equation">
            <span>
              月初余款<strong>0</strong>
            </span>
            <b>＋</b>
            <span>
              前十天预计经营结余<strong>1</strong>
            </span>
            <b>－</b>
            <span>
              当天付款<strong>6</strong>
            </span>
            <b>＝</b>
            <span className="shortfall">
              预计余额
              <strong>
                −{gapWan}
                <small> 万元</small>
              </strong>
            </span>
          </div>
          <div
            className="payment-gap"
            aria-label={`6万元付款位置，预计可用1万元，缺${gapWan}万元`}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={i === 0 ? "available" : ""}>
                <Icon name={i === 0 ? "wallet" : "receipt"} size={24} />
                <strong>1万元</strong>
                <small>{i === 0 ? "预计可用" : "付款空位"}</small>
              </div>
            ))}
          </div>
          <p className="gap-caption">
            11月10日要付6万元，预计只能填上一格，缺{gapWan}万元。
          </p>
          <div className="proof-links">
            {f.refs.map((ref, i) => (
              <button key={i} onClick={() => onSource(ref.doc)}>
                <Icon name="link" size={15} />
                {byId[ref.doc].title}
              </button>
            ))}
          </div>
          {!f.explained ? (
            <>
              <Dialogue person="chen">老店一个月不是能剩六万吗？</Dialogue>
              <p>点刚才圈出的前十天记录，接着和陈叔说。</p>
              <div className="choices">
                {f.refs.map((ref, i) => (
                  <button
                    className="sentence-choice"
                    key={i}
                    onClick={() => {
                      dispatch({ type: "EXPLAIN", ref });
                      setFeedback(
                        getLine(ref).canonical === "old-early"
                          ? ""
                          : "这是要付的钱。陈叔问的是，那时已经能留下多少钱。",
                      );
                    }}
                  >
                    {getLine(ref).text}
                  </button>
                ))}
              </div>
              <Feedback>{feedback}</Feedback>
            </>
          ) : (
            <Dialogue person="chen">
              我把后面才能挣的钱，算到前面去了。
            </Dialogue>
          )}
        </section>
      ) : null}
      {f.explained && (
        <div className="previous-finding">
          <Dialogue person="chen">我把后面才能挣的钱，算到前面去了。</Dialogue>
          <button
            className="text-button"
            onClick={() => onSource("calculation")}
          >
            回看原计算表
          </button>
        </div>
      )}
      {f.explained && (
        <section className="sequence-section">
          <Dialogue person="xiaohe">
            那等开门收到钱，再把前面这笔补上呢？
          </Dialogue>
          <h3>试着把四件事排个先后</h3>
          <p className="muted">
            依次点选纸条。点已经放好的纸条，可以收回重排；也能拖动交换位置。
          </p>
          <div className="sequence-slots">
            {Array.from({ length: 4 }, (_, i) => {
              const card = chain.find((c) => c.id === f.order[i]);
              return (
                <button
                  key={i}
                  disabled={f.noted}
                  className={card ? "filled" : ""}
                  draggable={!!card && !f.noted}
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", String(i))
                  }
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number(e.dataTransfer.getData("text/plain"));
                    if (
                      Number.isInteger(from) &&
                      from >= 0 &&
                      from < f.order.length &&
                      i < f.order.length
                    ) {
                      const order = [...f.order];
                      [order[from], order[i]] = [order[i], order[from]];
                      dispatch({ type: "ORDER", order });
                    }
                  }}
                  onClick={() => {
                    if (card)
                      dispatch({
                        type: "ORDER",
                        order: f.order.filter((id) => id !== card.id),
                      });
                  }}
                >
                  <small>{i + 1}</small>
                  <strong>{card?.label || "放一张纸条"}</strong>
                  {card?.id === "deliver" &&
                    getLine(f.condition)?.canonical === "delivery" && (
                      <span className="waiting">等待付清余款</span>
                    )}
                </button>
              );
            })}
          </div>
          <div className="paper-options">
            {[chain[2], chain[0], chain[3], chain[1]]
              .filter((c) => !f.order.includes(c.id))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    dispatch({ type: "ORDER", order: [...f.order, c.id] })
                  }
                >
                  {c.label}
                  <Icon name="arrow" size={16} />
                </button>
              ))}
          </div>
          {!f.noted && (
            <>
              <h3>哪句话能证明设备什么时候发货？</h3>
              <EvidencePicker
                seen={state.seen}
                max={1}
                refs={f.condition ? [f.condition] : []}
                label="引用发货依据"
                onChange={(refs) => {
                  if (refs[0]) dispatch({ type: "CONDITION", ref: refs[0] });
                  else dispatch({ type: "CLEAR_CONDITION" });
                }}
              />
              <Button
                onClick={() => {
                  const okay = validChain(f.order, f.condition, state.seen);
                  dispatch({ type: "CHECK_CHAIN" });
                  setChainFeedback(
                    okay
                      ? ""
                      : !f.condition ||
                          getLine(f.condition)?.canonical !== "delivery"
                        ? "顺序还需要原资料支持。找找设备采购资料里，什么条件满足后才能发货。"
                        : "有了依据，再想想：如果还没付清余款，后面的事能开始吗？可以收回纸条重排。",
                  );
                }}
              >
                拿着依据，看看顺序
              </Button>
              <Feedback>{chainFeedback}</Feedback>
            </>
          )}
          {f.chainDone && (
            <>
              <Dialogue person="xiaohe">
                得先付上，后面的生意才做得起来。
              </Dialogue>
              <p className="open-question">
                付完款也还要核实安装、人员和手续，不能保证十五号一定能开。
              </p>
              {!f.noted ? (
                <>
                  <Dialogue person="chen">
                    这笔钱怎么接上，设备什么时候能到，还得问清楚。
                  </Dialogue>
                  <p>
                    小禾把邀请函翻到背面：“那先写要问的。”正面的日期仍然空着。
                  </p>
                  <Button onClick={() => dispatch({ type: "SAVE_RISK" })}>
                    记下发现
                    <Icon name="notebook" />
                  </Button>
                </>
              ) : (
                <>
                  <Evidence id="risk-note" />
                  <Feedback success>
                    原计算表、两份缺口依据和发货条件都已保存，明天直接带给林姐。
                  </Feedback>
                </>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
