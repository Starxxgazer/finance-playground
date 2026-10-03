import { useEffect, useRef, useState } from "react";
import { byId, assumption, chain } from "../game/content.js";
import { amounts, calculatePlan, evaluateProof, getLine, validChain } from "../game/model.js";
import { Icon } from "./Ui.jsx";
import Evidence, { Feedback } from "./Evidence.jsx";
import { Month } from "./Calendar.jsx";

export function EvidencePicker({ seen, refs, onChange, max = 2, label = "选取依据", onSource, suggestedDoc = "", suggestedCanonical = "" }) {
  const [doc, setDoc] = useState(seen.includes(suggestedDoc) ? suggestedDoc : "");
  const [showAll, setShowAll] = useState(false);
  const lines = doc ? byId[doc].lines : [];
  const focused = suggestedCanonical && !showAll && doc === suggestedDoc;
  return (
    <div className="evidence-picker simple-evidence-picker">
      {refs.length > 0 && <div className="reference-slots">
        {refs.map((ref, i) => <div className="reference-slot filled" key={`${ref.doc}-${ref.line}-${i}`}>
          <small>{byId[ref.doc].title}</small>
          <p>{getLine(ref)?.text}</p>
          <button className="text-button" aria-label={`收起第${i + 1}份依据`} onClick={() => onChange(refs.filter((_, j) => j !== i))}>换一条</button>
        </div>)}
      </div>}
      {refs.length < max && <>
        <label className="evidence-select">
          {suggestedDoc ? "引用原文" : label}
          <select aria-label="选择原资料" value={doc} onChange={(event) => { setDoc(event.target.value); setShowAll(true); }}>
            <option value="">选资料，点原文</option>
            {seen.filter((id) => byId[id]).map((id) => <option key={id} value={id}>{byId[id].title}</option>)}
          </select>
        </label>
        {doc && <div className="selectable-lines">
          <div className="document-source">
            {byId[doc].title} · {byId[doc].nature} / {byId[doc].date}
            {onSource && <button className="text-button" onClick={() => onSource(doc)}>完整原件</button>}
          </div>
          {lines.filter((line) => !focused || line.canonical === suggestedCanonical).map((line) => <button className="funds-action funds-quote" data-next-action={line.canonical === suggestedCanonical || undefined} key={line.id} onClick={() => {
            onChange([...refs, { doc, line: line.id }]);
            if (!suggestedDoc) setDoc("");
          }}><span>{line.text}</span>{suggestedDoc ? <strong className="funds-action-label">点此引用 <Icon name="link" size={16} /></strong> : <Icon name="link" size={16} />}</button>)}
          {focused && <button className="text-button" onClick={() => setShowAll(true)}>展开其他原文</button>}
        </div>}
      </>}
    </div>
  );
}

const moneyCards = [
  { id: "oldDebt", label: "旧设备尾款", source: "debt", side: "payment", hint: "欠款 → 要付" },
  { id: "cash", label: "当前可用现金", source: "ledger", side: "available", hint: "手头的钱 → 可用" },
  { id: "startup", label: "新店首批付款", source: "budget", side: "payment", hint: "开店付款 → 要付" },
  { id: "loan", label: "假设贷款到账", source: "calculation", side: "available", hint: "假设到账 → 可用（未获批）" },
];

function ProofDesk({ state, dispatch, onSource, error }) {
  const f = state.funds;
  const [target, setTarget] = useState(f.refs.length === 1 ? 1 : 0);
  const [pickerVersion, setPickerVersion] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  return <div className="simple-proof-desk">
    <details className="funds-date-source">
      <summary>付款原件 · 11月10日到期</summary>
      <p className="funds-source-label">{byId.budget.title} · {byId.budget.nature}</p>
      {byId.budget.lines.slice(0, 2).map((line) => <p key={line.id}>{line.text}</p>)}
      <details><summary>预算补充说明</summary><p>{byId.budget.lines[2].text}</p></details>
      <button className="text-button" onClick={() => onSource("budget")}>完整原件与来源</button>
    </details>
    <div className="simple-date-choice">
      <button className="funds-date-shortcut funds-action" data-next-action={f.day !== 10 || undefined} aria-pressed={f.day === 10} onClick={() => dispatch({ type: "DAY", day: 10 })} aria-label="选11月10日">{f.day === 10 ? "✓ 已选11月10日" : "点这里 · 选11月10日"}</button>
    <details className="proof-date" open={calendarOpen} onToggle={(event) => setCalendarOpen(event.currentTarget.open)}>
      <summary>{f.day ? `已选11月${f.day}日 · 修改` : "其他日期"}</summary>
      <Month day={f.day} onDay={(day) => { dispatch({ type: "DAY", day }); setCalendarOpen(false); }} />
    </details>
    </div>
    {f.day && <div className="proof-work">
      <div className="proof-targets">
        {["① 前十天能攒多少", "② 10日要付多少"].map((label, index) => <button
          key={label} className={`proof-target ${target === index ? "current" : ""}`} aria-pressed={target === index}
          disabled={index === 1 && !f.refs[0]} onClick={() => { setTarget(index); setPickerVersion((value) => value + 1); }}>
          <strong>{label}</strong>
          {f.refs[index] ? <><span>✓ 已引用</span><small>点此更换</small></> : <span>{target === index ? "点下方原文 ↓" : "待引用"}</span>}
        </button>)}
      </div>
      <Feedback>{error}</Feedback>
      {error && <p className="funds-repair">日期点“10”；先引用前十天收支，再引用10日付款。</p>}
      <EvidencePicker key={`${target}-${pickerVersion}`} seen={state.seen} refs={[]} max={1} suggestedDoc={target === 0 ? "ledger" : "budget"}
        suggestedCanonical={target === 0 ? "old-early" : "new-later"}
        label={target === 0 ? "找能用的钱" : "找要付的钱"} onSource={onSource}
        onChange={([ref]) => {
          const next = [...f.refs];
          next[target] = ref;
          dispatch({ type: "REFS", refs: next });
          if (target === 0 && !f.refs[1]) setTarget(1);
        }} />
    </div>}
  </div>;
}

function OrderDesk({ state, dispatch, onSource }) {
  const f = state.funds;
  const wrongIndex = f.order.findIndex((id, index) => id !== chain[index].id);
  const nextHint = wrongIndex !== -1
    ? `第${wrongIndex + 1}步应是“${chain[wrongIndex].label}”。点已放纸条可撤回。`
    : f.order.length < chain.length
      ? `第${f.order.length + 1}步：点“${chain[f.order.length].label}”。`
      : "最后点“付清余款后发货”的原文。";
  return <div className="simple-order-desk">
    <div>
      <p className="choice-guidance">排出开业顺序，再点发货条件原文。</p>
      <p className="funds-next-action" role="status">{nextHint}</p>
      <div className="sequence-slots">
        {Array.from({ length: 4 }, (_, i) => {
          const card = chain.find((c) => c.id === f.order[i]);
          return <button key={i} className={card ? "filled" : ""} disabled={!card}
            aria-label={card ? `收回${card.label}` : `第${i + 1}步`}
            onClick={() => dispatch({ type: "ORDER", order: f.order.filter((id) => id !== card.id) })}>
            <small>{i + 1}</small><strong>{card?.label || "…"}</strong>
          </button>;
        })}
      </div>
      <div className="paper-options">
        {chain.filter((c) => !f.order.includes(c.id)).map((c) =>
          <button className="funds-action" data-next-action={wrongIndex === -1 && c.id === chain[f.order.length]?.id || undefined} data-action={wrongIndex === -1 && c.id === chain[f.order.length]?.id ? "下一步 · 点击" : `第${chain.findIndex(item => item.id === c.id) + 1}步`} aria-label={c.label} key={c.id} onClick={() => dispatch({ type: "ORDER", order: [...f.order, c.id] })}>{c.label}</button>)}
      </div>
      {f.order.length > 0 && wrongIndex === -1 && <small>点已选步骤可撤回。</small>}
    </div>
    <EvidencePicker seen={state.seen} max={1} refs={f.condition ? [f.condition] : []} suggestedDoc="equipment" suggestedCanonical="delivery"
      label="什么条件满足后才能发货？" onSource={onSource}
      onChange={(refs) => dispatch(refs[0] ? { type: "CONDITION", ref: refs[0] } : { type: "CLEAR_CONDITION" })} />
  </div>;
}

export default function Funds({ state, dispatch, onSource }) {
  const f = state.funds;
  const [feedback, setFeedback] = useState("");
  const heading = useRef(null);
  const plan = calculatePlan();
  const stage = !f.initial ? "initial" : !f.gap ? "proof" : !f.explained ? "explain" : !f.noted ? "order" : "saved";
  const placements = f.placements || {};
  const stages = ["initial", "proof", "explain", "order"];
  const stageIndex = stage === "saved" ? 4 : stages.indexOf(stage);
  const proof = evaluateProof(f.day, f.refs, f.initial, state.seen);
  const chainValid = validChain(f.order, f.condition, state.seen);
  useEffect(() => { dispatch({ type: "READ", id: "calculation" }); }, [dispatch]);
  useEffect(() => {
    if (!f.initial && moneyCards.every((card) => placements[card.id] === card.side)) dispatch({ type: "INITIAL" });
    if (f.initial && !f.gap && proof.ok && getLine(f.refs[0])?.canonical === "old-early") dispatch({ type: "CALCULATE" });
    if (f.explained && !f.noted && chainValid) dispatch({ type: f.chainDone ? "SAVE_RISK" : "CHECK_CHAIN" });
  }, [f, placements, proof.ok, chainValid, dispatch]);
  useEffect(() => {
    heading.current?.closest(".work-glass")?.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
    setFeedback("");
  }, [stage]);
  const initialError = moneyCards.every((card) => placements[card.id]) && !moneyCards.every((card) => placements[card.id] === card.side);
  const proofError = f.day && f.refs.length === 2 && (!proof.ok ? proof.message : getLine(f.refs[0])?.canonical !== "old-early" ? "两条依据放反了：先选能用的钱，再选要付的钱。" : "");
  const chainError = f.order.length === 4 && f.condition && !chainValid
    ? getLine(f.condition)?.canonical !== "delivery" ? "点依据上的“换一条”，改选“付清余款后发货”开头的整句。" : "点已放的纸条收回，按“付设备余款 → 发货安装 → 开门营业 → 收到营业款”重排。" : "";
  return <div className="funds-workspace guided-desk simple-funds" data-stage={stage}>
    <div className="desk-context side-paper">
    <header className="desk-chapter">
      <ol className="funds-progress" aria-label="资金桌进度">{["分清钱", "对日期", "看原因", "排先后"].map((label, index) => <li key={label} aria-current={stageIndex === index ? "step" : undefined} className={stageIndex > index ? "done" : ""}>{stageIndex > index ? "✓" : index + 1} {label}</li>)}</ol>
      <h2 ref={heading} tabIndex={-1}>{({ initial: "哪些钱可用，哪些钱要付？", proof: "核对11月10日的收付", explain: "月底的钱，10日还用不上", order: "先付款，再开业", saved: "资金调查已记下" })[stage]}</h2>
      {stage !== "order" && <div className="funds-coach">
        <strong>林姐的小提示</strong>
        <p>{({ initial: "逐笔选“可用”或“要付”，系统自动算。", proof: "选10日，再点两条原文，核对够不够付。", explain: "点收支原文：前十天预计只攒下1万元。", saved: "关闭后，点“次日去见林姐”。" })[stage]}</p>
      </div>}
      <details className="desk-assumption"><summary>贷款到账、按期开业均为假设</summary><p className="assumption">{assumption}</p></details>
    </header>
    <div className="desk-tools">
      <button className="text-button" onClick={() => onSource("calculation")}>陈叔的计算表</button>
      {f.initial && <details className="funds-initial-result"><summary>月初预计剩 {plan.initial / 10000} 万元 · 看算式</summary><p>{amounts.cash / 10000} ＋ {amounts.loan / 10000} − {amounts.oldDebt / 10000} − {amounts.startup / 10000} ＝ {plan.initial / 10000} 万元（假设贷款到账）</p></details>}
    </div>
    </div>
    <section className="desk-step side-paper" aria-label="资金桌调查">
      {stage === "initial" && <>
        <div className="money-cards simple-money-cards">{moneyCards.map((card) => <div className="money-card" key={card.id}>
          <div className="money-caption"><span>{card.label}</span><strong>{amounts[card.id] / 10000} 万元</strong>
            <button className="text-button" onClick={() => onSource(card.source)}>原件</button></div>
          <small className="money-card-hint">{card.hint}</small>
          <div className="money-choice" role="group" aria-label={card.label}>
            {[["available", "可用"], ["payment", "要付"]].map(([side, label]) => <button key={side} className="funds-action" data-next-action={placements[card.id] !== card.side && side === card.side || undefined} aria-label={label}
              aria-pressed={placements[card.id] === side} onClick={() => dispatch({ type: "INITIAL_PLACE", id: card.id, side })}><span>{label}</span><small aria-hidden="true">{placements[card.id] === side ? "已选" : side === card.side ? "点这里" : "另选"}</small></button>)}
          </div>
          {placements[card.id] && <small className={`money-check ${placements[card.id] === card.side ? "correct" : "retry"}`}>{placements[card.id] === card.side ? "✓ 已核对" : `${card.side === "available" ? "这是手头或假设到账的钱，选“可用”。" : "这是支出，选“要付”。"}`}</small>}
        </div>)}</div>
        <Feedback>{initialError ? "请改正标错的收付。" : ""}</Feedback>
      </>}
      {stage === "proof" && <><ProofDesk state={state} dispatch={dispatch} onSource={onSource} error={proofError} /></>}
      {stage === "explain" && proof.ok && <>
        <div className="desk-total">11月{f.day}日：月初 {plan.initial / 10000} ＋ 前十天 {(amounts.oldReceipts[0] - amounts.oldPayments[0]) / 10000} − 到期款 {amounts.followup / 10000}<strong>预计缺 {Math.abs(plan.day10) / 10000} 万元</strong></div>
        <p className="muted">单位：万元。经营收支为预测，贷款假设到账。</p>
        <h3>陈叔：“老店整月预计能剩6万，为什么还不够？”</h3>
        <div className="choices">{f.refs.filter((ref) => getLine(ref)?.canonical === "old-early").map((ref, i) => <button className="sentence-choice funds-action funds-quote" data-next-action="true" key={i} onClick={() => {
          if (getLine(ref)?.canonical !== "old-early") { setFeedback("这句是付款。改点“11月1至10日：预计经营收款6万元，日常现金支出5万元。”"); return; }
          dispatch({ type: "EXPLAIN", ref });
        }}><span>{getLine(ref)?.text}</span><strong className="funds-action-label">点此说明原因 <Icon name="link" size={16} /></strong></button>)}</div>
        <Feedback>{feedback}</Feedback>
      </>}
      {stage === "order" && <><OrderDesk state={state} dispatch={dispatch} onSource={onSource} /><Feedback>{chainError}</Feedback></>}
      {stage === "saved" && <>
        <Evidence id="risk-note" />
        <div className="proof-links">{[...new Set(["calculation", ...f.refs.map((ref) => ref.doc), f.condition?.doc])].filter(Boolean).map((id) => <button key={id} onClick={() => onSource(id)}><Icon name="link" />{byId[id].title}</button>)}</div>
      </>}
    </section>
  </div>;
}
