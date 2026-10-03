import { useEffect, useRef, useState } from "react";
import { byId, assumption, chain } from "../game/content.js";
import {
  amounts,
  calculatePlan,
  evaluateProof,
  getLine,
  validChain,
} from "../game/model.js";
import { Button, Icon, Dialogue } from "./Ui.jsx";
import Evidence, { Feedback } from "./Evidence.jsx";
import ItemIcon from "./ItemIcon.jsx";
import { Month } from "./Calendar.jsx";

export function EvidencePicker({
  seen,
  refs,
  onChange,
  max = 2,
  hint = false,
  label = "选取依据",
  onSource,
}) {
  const [doc, setDoc] = useState("");
  const [feedback, setFeedback] = useState("");
  function add(line) {
    if (refs.length >= max) {
      setFeedback("这处已经放好了。先收起原来的纸条，再换一条。");
      return;
    }
    onChange([...refs, { doc, line }]);
    setDoc("");
    setFeedback("");
  }
  return (
    <div className="evidence-picker object-picker">
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
                  <p>{max === 1 ? label : `第${i + 1}份依据`}</p>
                  <small>翻开物件，圈出一行原文</small>
                </>
              )}
            </div>
          );
        })}
      </div>
      {refs.length < max && (
        <>
          <p className="section-caption">{label} · 已收集的物件</p>
          <div className="evidence-objects" role="group" aria-label={label}>
            {seen
              .filter((id) => byId[id])
              .map((id) => (
                <button
                  key={id}
                  aria-pressed={doc === id}
                  onClick={() => {
                    setDoc(doc === id ? "" : id);
                    setFeedback("");
                  }}
                >
                  <ItemIcon id={id} small />
                  <span>{byId[id].title}</span>
                </button>
              ))}
          </div>
          {doc && (
            <div className="selectable-lines">
              <div className="document-source">
                {byId[doc].title} · {byId[doc].nature} / {byId[doc].date}
                {onSource && (
                  <button className="text-button" onClick={() => onSource(doc)}>
                    查看原件
                  </button>
                )}
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
        </>
      )}
      <Feedback>{feedback}</Feedback>
    </div>
  );
}

const moneyCards = [
  { id: "oldDebt", label: "旧设备尾款", source: "debt", side: "payment" },
  { id: "cash", label: "当前可用现金", source: "ledger", side: "available" },
  { id: "startup", label: "新店首批付款", source: "budget", side: "payment" },
  {
    id: "loan",
    label: "假设贷款到账",
    source: "calculation",
    side: "available",
  },
];
const phaseFor = (f) =>
  !f.initial
    ? "initial"
    : f.noted
      ? "saved"
      : f.chainDone
        ? "note"
        : f.explained
          ? "order"
          : f.gap
            ? "gap"
            : !f.day
              ? "date"
              : !f.refs.length
                ? "available"
                : "payment";

export default function Funds({ state, dispatch, onSource }) {
  const f = state.funds;
  const [phase, setPhase] = useState(() => phaseFor(f));
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const plan = calculatePlan();
  const stepHeading = useRef(null);
  useEffect(() => {
    stepHeading.current
      ?.closest(".work-glass")
      ?.scrollTo({ top: 0, behavior: "instant" });
    stepHeading.current?.focus({ preventScroll: true });
  }, [phase]);
  const gapWan = Math.abs(plan.day10) / 10000;
  const placements = f.placements || {};
  function go(next) {
    setFeedback("");
    setPhase(next);
  }
  function readTable() {
    dispatch({ type: "READ", id: "calculation" });
    onSource("calculation");
  }
  function place(side) {
    if (!selected) {
      setFeedback("先拿起一张凭据，再放到相应的位置。");
      return;
    }
    dispatch({ type: "READ", id: "calculation" });
    dispatch({ type: "INITIAL_PLACE", id: selected, side });
    setSelected(null);
    setFeedback("");
  }
  function confirmInitial() {
    dispatch({ type: "READ", id: "calculation" });
    if (!moneyCards.every((c) => placements[c.id] === c.side)) {
      setFeedback(
        "再看一眼：手上已有的钱、假设借到的钱放一边；需要付出去的钱放另一边。点凭据可以重新摆。",
      );
      return;
    }
    dispatch({ type: "INITIAL" });
    go("balance");
  }
  function putRef(index, refs) {
    const next = [...f.refs];
    if (refs[0]) next[index] = refs[0];
    else next.splice(index);
    dispatch({ type: "REFS", refs: next });
    setFeedback("");
  }
  function calculate() {
    const result = evaluateProof(f.day, f.refs, f.initial, state.seen);
    if (!result.ok) {
      setFeedback(result.message);
      return;
    }
    if (getLine(f.refs[0])?.canonical !== "old-early") {
      setFeedback(
        "两张资料找对了，再把它们放回对应的位置：先放能留下的钱，再放要付的钱。",
      );
      return;
    }
    dispatch({ type: "CALCULATE" });
    go("gap");
  }
  const stage = ["initial", "balance"].includes(phase)
    ? 1
    : ["date", "available", "payment", "gap"].includes(phase)
      ? 2
      : 3;
  return (
    <div className="funds-workspace guided-desk">
      <header className="desk-chapter">
        <span className="section-caption">打烊后的资金桌 · {stage} / 3</span>
        <h2 ref={stepHeading} tabIndex={-1}>
          {
            [
              "",
              "先摆清月初的钱",
              "找到接不上的那一天",
              "后面的收入，能提前用吗？",
            ][stage]
          }
        </h2>
        <p className="assumption">{assumption}</p>
      </header>
      <div className="desk-tools">
        <button className="text-button" onClick={readTable}>
          <Icon name="book" />
          翻看陈叔的计算表
        </button>
        {f.initial && <span>月初余额已核对：{plan.initial / 10000} 万元</span>}
      </div>
      <section className="desk-step" aria-label={`资金桌第${stage}段`}>
        {phase === "initial" && (
          <>
            <Dialogue person="xiaohe">
              先别算月底。月初手上能用哪些钱，又得先付出去哪些？我来记数，你帮忙摆一摆。
            </Dialogue>
            <p className="muted">
              先点一张凭据，再点它应该放的位置。贷款只是计算假设，还没有实际到账。
            </p>
            <div className="money-cards">
              {moneyCards.map((c) => (
                <div
                  key={c.id}
                  className={`money-card ${selected === c.id ? "selected" : ""}`}
                >
                  <button
                    aria-pressed={selected === c.id}
                    onClick={() => setSelected(c.id)}
                  >
                    <ItemIcon id={c.source} small />
                    <span>{c.label}</span>
                    <strong>{amounts[c.id] / 10000} 万元</strong>
                    <small>
                      {placements[c.id]
                        ? placements[c.id] === "available"
                          ? "已放：可用的钱"
                          : "已放：要付的钱"
                        : "拿起凭据"}
                    </small>
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (c.source === "calculation")
                        dispatch({ type: "READ", id: "calculation" });
                      onSource(c.source);
                    }}
                  >
                    原件
                  </button>
                </div>
              ))}
            </div>
            <div className="money-trays">
              {[
                ["available", "可用的钱", "已有现金，以及假设到账的贷款"],
                ["payment", "要付的钱", "月初先要履行的付款"],
              ].map(([side, title, subtitle]) => (
                <button key={side} onClick={() => place(side)}>
                  <Icon
                    name={side === "available" ? "wallet" : "receipt"}
                    size={28}
                  />
                  <strong>{title}</strong>
                  <small>{subtitle}</small>
                  <span>
                    {moneyCards
                      .filter((c) => placements[c.id] === side)
                      .map((c) => c.label)
                      .join(" · ") || "把凭据放在这里"}
                  </span>
                </button>
              ))}
            </div>
            <Button onClick={confirmInitial}>摆好了，请小禾算一算</Button>
          </>
        )}
        {phase === "balance" && (
          <>
            <Dialogue person="xiaohe">
              两万现金，加上假设借到的二十万，付完这两笔，月初就没有余钱了。
            </Dialogue>
            <div className="desk-total">
              {amounts.cash / 10000} ＋ {amounts.loan / 10000} −{" "}
              {amounts.oldDebt / 10000} − {amounts.startup / 10000} ＝{" "}
              <strong>{plan.initial / 10000} 万元</strong>
            </div>
            <Dialogue person="chen">
              那后面的款，就得看店里什么时候能留下钱。
            </Dialogue>
            <Button onClick={() => go("date")}>看看后面还有哪笔付款</Button>
          </>
        )}
        {phase === "date" && (
          <>
            <Dialogue person="xiaohe">
              下一笔大额付款，单据上写的是哪一天？我们就看看，那时的钱够不够。
            </Dialogue>
            <div className="date-desk">
              <Month
                day={f.day}
                onDay={(day) => {
                  dispatch({ type: "DAY", day });
                  setFeedback("");
                }}
              />
              <div className="desk-documents">
                <p>翻原单据找日期，再圈日历。</p>
                {["budget", "equipment", "schedule"]
                  .filter((id) => state.seen.includes(id))
                  .map((id) => (
                    <button key={id} onClick={() => onSource(id)}>
                      <ItemIcon id={id} small />
                      <span>{byId[id].title}</span>
                    </button>
                  ))}
              </div>
            </div>
            <Button disabled={!f.day} onClick={() => go("available")}>
              检查{f.day ? `11月${f.day}日` : "选定日期"}的钱
            </Button>
          </>
        )}
        {["available", "payment"].includes(phase) && (
          <>
            <p className="desk-date-tag">
              正在核对：11月{f.day}日{" "}
              <button className="text-button" onClick={() => go("date")}>
                重选日期
              </button>
            </p>
            <Dialogue person="xiaohe">
              {phase === "available"
                ? "到你圈的这天，老店预计能留下多少钱？从原单据圈出收支记录，别把还没挣到的也算进来。"
                : "现在再找这一天要付的钱。把另一份资料里的付款记录放在旁边。"}
            </Dialogue>
            {phase === "payment" && (
              <button
                className="desk-kept-note"
                onClick={() => go("available")}
              >
                <Icon name="file" />
                <span>
                  到时能留下的钱：{getLine(f.refs[0])?.text || "尚未放好"}
                </span>
                <small>点击换依据</small>
              </button>
            )}
            <EvidencePicker
              key={phase}
              seen={state.seen}
              max={1}
              refs={
                f.refs[phase === "available" ? 0 : 1]
                  ? [f.refs[phase === "available" ? 0 : 1]]
                  : []
              }
              label={
                phase === "available" ? "到这时能留下的钱" : "这天要付的钱"
              }
              onChange={(refs) => putRef(phase === "available" ? 0 : 1, refs)}
              onSource={onSource}
            />
            {phase === "available" ? (
              <Button disabled={!f.refs[0]} onClick={() => go("payment")}>
                再找这一天要付的钱
              </Button>
            ) : (
              <Button disabled={f.refs.length !== 2} onClick={calculate}>
                两份放好了，请小禾算一算
              </Button>
            )}
            <div className="desk-help">
              <button
                className="text-button"
                onClick={() => dispatch({ type: "HINT" })}
              >
                <Icon name="hint" />
                问问小禾
              </button>
              {f.hint > 0 && (
                <p role="status">
                  {
                    [
                      "",
                      "先看付款的具体日期，再看那之前的经营收支。",
                      "整月结余不能提前拿来用，两份资料也不能引用同一条账目。",
                      "看看新店预算的后续付款，再翻老店按时间分段的经营收支。",
                    ][f.hint]
                  }
                </p>
              )}
            </div>
          </>
        )}
        {phase === "gap" &&
          f.gap &&
          evaluateProof(f.day, f.refs, f.initial, state.seen).ok && (
            <>
              <Dialogue person="xiaohe">
                两份单据对上了。到这一天，还接不上这笔付款。
              </Dialogue>
              <div className="desk-payment-proof">
                <div className="desk-payment-heading">
                  <h3>11月{f.day}日 · 六个付款位置</h3>
                  <span className="stamp">按原计划估算</span>
                </div>
                <p>每格代表1万元。预计能用的钱，只能填上其中一格。</p>
                <div
                  className="desk-payment-slots"
                  role="img"
                  aria-label={`到期付款6万元，预计可用1万元，五个付款位置空缺，共缺${gapWan}万元`}
                >
                  {Array.from({ length: amounts.followup / 10000 }, (_, i) => {
                    const available =
                      i <
                      (plan.initial +
                        amounts.oldReceipts[0] -
                        amounts.oldPayments[0]) /
                        10000;
                    return (
                      <div
                        key={i}
                        className={`desk-payment-slot ${available ? "available" : "empty"}`}
                      >
                        <Icon
                          name={available ? "wallet" : "receipt"}
                          size={28}
                        />
                        <strong>1万元</strong>
                        <small>{available ? "预计可用" : "付款空位"}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="desk-total">
                月初 {plan.initial / 10000} ＋ 前十天{" "}
                {(amounts.oldReceipts[0] - amounts.oldPayments[0]) / 10000} −
                到期付款 {amounts.followup / 10000}
                <strong>预计缺 {gapWan} 万元</strong>
              </div>
              <p className="muted">
                单位：万元。经营收支是预测，贷款仍是假设到账。
              </p>
              <Dialogue person="chen">老店一个月不是能剩六万吗？</Dialogue>
              <p>把能回答陈叔的那行原文指给他看。</p>
              <div className="choices">
                {f.refs.map((ref, i) => (
                  <button
                    className="sentence-choice"
                    key={i}
                    onClick={() => {
                      if (getLine(ref)?.canonical !== "old-early") {
                        setFeedback(
                          "这是要付的钱。陈叔想知道的是，这时已经能留下多少钱。",
                        );
                        return;
                      }
                      dispatch({ type: "EXPLAIN", ref });
                      go("order");
                    }}
                  >
                    {getLine(ref)?.text}
                  </button>
                ))}
              </div>
            </>
          )}
        {phase === "order" && (
          <>
            <Dialogue person="chen">
              我把后面才能挣的钱，算到前面去了。
            </Dialogue>
            <Dialogue person="xiaohe">
              那等新店开门收到钱，再把前面这笔补上呢？
            </Dialogue>
            <h3>把四张纸条依次摆好</h3>
            <p className="muted">
              点选纸条放入下一格；点已放好的纸条可以收回重排。
            </p>
            <div className="sequence-slots">
              {Array.from({ length: 4 }, (_, i) => {
                const card = chain.find((c) => c.id === f.order[i]);
                return (
                  <button
                    key={i}
                    className={card ? "filled" : ""}
                    disabled={!card}
                    onClick={() =>
                      dispatch({
                        type: "ORDER",
                        order: f.order.filter((id) => id !== card.id),
                      })
                    }
                  >
                    <small>{i + 1}</small>
                    <strong>{card?.label || "放一张纸条"}</strong>
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
            <Button
              disabled={f.order.length !== 4}
              onClick={() => go("condition")}
            >
              找一句原文，核实这个顺序
            </Button>
          </>
        )}
        {phase === "condition" && (
          <>
            <Dialogue person="xiaohe">
              设备什么时候能发货，不能光凭我们猜。哪句条款能说明？
            </Dialogue>
            <button className="desk-kept-note" onClick={() => go("order")}>
              <span>
                {f.order
                  .map((id) => chain.find((c) => c.id === id)?.label)
                  .join(" → ")}
              </span>
              <small>点击重排</small>
            </button>
            <EvidencePicker
              seen={state.seen}
              max={1}
              refs={f.condition ? [f.condition] : []}
              label="引用发货依据"
              onSource={onSource}
              onChange={(refs) =>
                dispatch(
                  refs[0]
                    ? { type: "CONDITION", ref: refs[0] }
                    : { type: "CLEAR_CONDITION" },
                )
              }
            />
            <Button
              onClick={() => {
                if (!validChain(f.order, f.condition, state.seen)) {
                  setFeedback(
                    getLine(f.condition)?.canonical !== "delivery"
                      ? "还需要发货条件的原文。翻翻设备采购资料，什么条件满足后才能发货？"
                      : "原文说要先付清余款。看看你摆的顺序，后面的事能提前发生吗？可以回去重排。",
                  );
                  return;
                }
                dispatch({ type: "CHECK_CHAIN" });
                go("note");
              }}
            >
              拿着依据，看看顺序
            </Button>
          </>
        )}
        {phase === "note" && (
          <>
            <Dialogue person="xiaohe">
              得先付上，后面的生意才做得起来。开业后的收入，补不了开业前必须付的款。
            </Dialogue>
            <p className="open-question">
              付完款还要核实安装、人员和手续，不能保证十五号一定开业。
            </p>
            <Dialogue person="chen">
              这笔钱怎么接上，设备什么时候能到，还得问清楚。
            </Dialogue>
            <Button
              onClick={() => {
                dispatch({ type: "SAVE_RISK" });
                go("saved");
              }}
            >
              记下发现
              <Icon name="notebook" />
            </Button>
          </>
        )}
        {phase === "saved" && (
          <>
            <Evidence id="risk-note" />
            <Feedback success>
              原计算表、两份缺口依据和发货条件都已保存，明天带给林姐。
            </Feedback>
            <div className="proof-links">
              {[
                ...new Set([
                  "calculation",
                  ...f.refs.map((r) => r.doc),
                  f.condition?.doc,
                ]),
              ]
                .filter(Boolean)
                .map((id) => (
                  <button key={id} onClick={() => onSource(id)}>
                    <Icon name="link" />
                    {byId[id].title}
                  </button>
                ))}
            </div>
          </>
        )}
        <Feedback>{feedback}</Feedback>
      </section>
    </div>
  );
}
