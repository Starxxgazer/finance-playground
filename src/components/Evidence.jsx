import { useState } from "react";
import "./capital-trace.css";
import { byId, findings } from "../game/content.js";
import ItemIcon from "./ItemIcon.jsx";
import { Icon, Button, Dialogue } from "./Ui.jsx";

export default function Evidence({ id, children, compact = false, foldedLines = [], collapsibleSource = false }) {
  const item = byId[id];
  const folded = item.lines.filter((line) => foldedLines.includes(line.id));
  return (
    <article className={`document ${compact ? "compact" : ""}`}>
      <div className="document-meta">
        <span>{item.nature}</span>
        <ItemIcon id={id} small />
      </div>
      <h3>{item.title}</h3>
      {collapsibleSource ? (
        <details className="document-extra">
          <summary>来源与日期</summary>
          <div className="document-source">
            <span>来源：{item.source}</span>
            <span>{item.date}</span>
          </div>
        </details>
      ) : <div className="document-source">
        <span>来源：{item.source}</span>
        <span>{item.date}</span>
      </div>}
      <div className={`document-lines ${id === "receipt" ? "simple-receipt-pair" : ""}`}>
        {item.lines.map((line) => foldedLines.includes(line.id) ? (
          line.id === folded[0]?.id && (
            <details className="document-extra" key={line.id}>
              <summary>分段收付记录 · {folded.length} 条</summary>
              {folded.map((entry) => <p key={entry.id}>{entry.text}</p>)}
            </details>
          )
        ) : <p key={line.id}>{line.text}</p>)}
      </div>
      {children}
    </article>
  );
}
export function Feedback({ children, success = false }) {
  return children ? (
    <p className={`feedback ${success ? "success" : ""}`} role="status">
      <Icon name={success ? "check" : "hint"} size={18} />
      {children}
    </p>
  ) : null;
}
function Pick({ label, value, options, onChange }) {
  return <fieldset className="simple-pick"><legend>{label}</legend><div className="simple-options">
    {options.map(([key, text]) => <button type="button" key={String(key)} aria-pressed={value === key} className={value === key ? "selected" : ""} onClick={() => onChange(key)}>{text}</button>)}
  </div></fieldset>;
}
export function OldActivity({ id, state, dispatch }) {
  const [values, setValues] = useState({});
  const [feedback, setFeedback] = useState("");
  const done = state.tasks[id];
  const question = id === "ledger" ? "这两笔钱，哪些现在能用？" : id === "debt" ? "尾款哪天付？现在付了吗？" : "首款的金额、时间对得上吗？";
  const guidance = {
    ledger: "分别判断2万元和6万元是现在可用的钱，还是未来预计的结余，弄清眼下能拿多少钱付款。",
    debt: "按付款清单选到期日和当前支付状态，弄清这笔尾款何时还要付。",
    receipt: "对照约定与回执，分别选金额是否一致、付款是否按时、首款是否已付，核实过去的履约情况。",
  };
  function choose(key, value) {
    const next = { ...values, [key]: value };
    setValues(next);
    const fields = id === "ledger" ? ["cash", "net"] : id === "debt" ? ["day", "status"] : ["amount", "date", "status"];
    const ready = fields.every((field) => next[field] !== undefined && next[field] !== "");
    const okay = id === "ledger" ? next.cash === "now" && next.net === "forecast" : id === "debt" ? Number(next.day) === 1 && next.status === "unpaid" : next.amount === true && next.date === true && next.status === "paid";
    setFeedback(ready && !okay ? "还没对上，再看原件。" : "");
    if (ready && okay) dispatch({ type: "CLASSIFY", id, ...next, day: Number(next.day) });
  }
  return <section className="simple-investigation">
    <h3 className="simple-question">{done ? "已核对" : question}</h3>
    <div className="simple-investigation-grid">
      <Evidence id={id} collapsibleSource foldedLines={id === "ledger" ? ["early", "middle", "late"] : []} />
      {done ? <Feedback success>已记下，可回看原件。</Feedback> : <div className="activity simple-answer">
        <p className="choice-guidance">{guidance[id]}每项选一个，核对正确后自动记录。</p>
        {id === "ledger" && [["cash", "2万元"], ["net", "6万元"]].map(([key, label]) => <Pick key={key} label={label} value={values[key]} options={[["now", "现在可用"], ["forecast", "预计结余"]]} onChange={(value) => choose(key, value)} />)}
        {id === "debt" && <>
          <label className="form-label">尾款到期日<select value={values.day || ""} onChange={(event) => choose("day", event.target.value)}><option value="">选择日期</option>{Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>11月{i + 1}日</option>)}</select></label>
          <Pick label="支付状态" value={values.status} options={[["unpaid", "未付"], ["paid", "已付"]]} onChange={(value) => choose("status", value)} />
        </>}
        {id === "receipt" && <>
          <Pick label="金额" value={values.amount} options={[[true, "一致"], [false, "不一致"]]} onChange={(value) => choose("amount", value)} />
          <Pick label="付款时间" value={values.date} options={[[true, "符合约定"], [false, "不符合"]]} onChange={(value) => choose("date", value)} />
          <Pick label="支付状态" value={values.status} options={[["paid", "已付"], ["unpaid", "未付"]]} onChange={(value) => choose("status", value)} />
        </>}
        <Feedback>{feedback}</Feedback>
      </div>}
    </div>
  </section>;
}
export function CustomerActivity({ state, dispatch }) {
  return (
    <div className="activity side-conversation">
      <div className="side-paper">
      <h3 className="simple-question">问问排队的顾客</h3>
      <p className="choice-guidance">排队能说明生意好吗？点选想问的话，了解口味评价与排队原因，再判断能支持什么结论。</p>
      <div className="choices">
        {[
          ["taste", "您觉得面包怎么样？"],
          ["queue", "平时也要排这么久吗？"],
        ].map(([id, text]) => (
          <Button
            secondary
            key={id}
            onClick={() => dispatch({ type: "ASK_CUSTOMER", id })}
          >
            {text}
            {state.seen.includes(id) && <Icon name="check" />}
          </Button>
        ))}
      </div>
      </div>
      <div className="side-paper">
      {["taste", "queue"]
        .filter((id) => state.seen.includes(id))
        .map((id) => (
          <Evidence key={id} id={id} compact />
        ))}
      {["taste", "queue"].every((id) => state.seen.includes(id)) && (
        <ReputationNote state={state} dispatch={dispatch} />
      )}
      </div>
    </div>
  );
}
function ReputationNote({ state, dispatch }) {
  const [feedback, setFeedback] = useState("");
  return (
    <div className="notes-list">

      {findings
        .filter((f) => f.id === "reputation")
        .map((f) => {
          const done = state.solved.includes(f.id);
          return (
            <section className="note" key={f.id}>
              <div className="section-title">
                <h3>{f.title}</h3>
                {done && <span className="stamp">已确认</span>}
              </div>
              {done ? (
                <>
                  <p>{f.correct}</p>
                  <p className="open-question">还要问：{f.question}</p>
                </>
              ) : (
                <>
                  <p className="muted">
                    根据顾客的回答，选一句有依据的结论，记下已核实的口碑；没有问到的仍待查。
                  </p>
                  {[f.wrong, f.correct].map((text, i) => (
                      <button
                        className="sentence-choice"
                        key={text}
                        onClick={() => {
                          dispatch({
                            type: "NOTE",
                            id: f.id,
                            choice: i === 1 ? "supported" : "unsupported",
                          });
                          setFeedback(
                            i === 1
                              ? "发现和保留问题已记下。"
                              : "顾客的话还不能说明这一点。",
                          );
                        }}
                      >
                        {text}

                      </button>
                    ))}
                </>
              )}
            </section>
          );
        })}
      <Feedback>{feedback}</Feedback>
    </div>
  );
}
export function SideActivity({ id, state, dispatch }) {
  const [v, setV] = useState({});
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState("");
  function trace(key, value) {
    // Each combined answer explicitly includes both facts; nothing is preselected.
    const answer = key === "route" ? { parties: value, order: value }
      : key === "payment" ? { amount: value, purpose: value } : { [key]: value };
    const next = { ...v, ...answer };
    setV(next);
    const ready = ["parties", "order", "amount", "purpose", "choice"].every((field) => next[field] !== undefined);
    const correct = next.parties && next.order && next.amount && next.purpose && next.choice === "same";
    setFeedback(next.parties === false || next.order === false
      ? "看回执①：陈叔先转给公司；再看回执②：公司付给老孟。"
      : next.amount === false || next.purpose === false
        ? "回执①转入6万元，回执②付出6万元，用于旧设备首款。"
        : next.choice === "twice" ? "这6万元已经付出，不能再加进余额；现在仍有2万元。" : "");
    if (ready && correct) dispatch({ type: "TRACE_CAPITAL", ...next });
  }
  function survey(group, identity) {
    setSelected(group);
    setV({ ...v, identity });
    const correctGroup = group.length === 8 && group.every((n) => n >= 1 && n <= 8);
    setFeedback(group.length && identity ? !correctGroup ? "找的是想去新铺的那组。" : identity !== "regular" ? "看看访谈对象是谁。" : "" : "");
    if (correctGroup && identity === "regular") dispatch({ type: "SURVEY", selected: group });
  }
  if (id === "contract") return <div className="simple-side side-conversation">
    <div className="side-paper">
    <h3 className="simple-question">尾款能晚点付吗？</h3>
    {!state.branches.aRequested && <p className="choice-guidance">点下方追问，了解延期付款的条件，留作备选；询问不代表新安排已生效。</p>}
    <Dialogue person="meng">尾款可以商量。但一边开新店，一边拖旧款，我不同意。</Dialogue>
    {state.branches.aRequested ? <Feedback success>老孟次日发签字回执；当前尾款约定仍有效。</Feedback> : <Button onClick={() => dispatch({ type: "CONTACT_MENG" })}>能商量个备选安排吗？</Button>}
    </div>
    <div className="side-paper"><Evidence id="contract" collapsibleSource /></div>
  </div>;
  if (id === "transfer") return <div className="simple-side">
    <h3 className="simple-question">陈叔投入的6万元，去了哪里？</h3>
    <div className="trace-workspace">
      <section className="trace-documents" aria-label="投入去向原件，可滚动查看" tabIndex={0}>
        <div className="trace-receipt-summary">
          <p><strong>回执① · 转入公司</strong><br />陈叔 → 公司：6万元，先转入。</p>
          {state.seen.includes("investment") && <p><strong>回执② · 付给老孟</strong><br />公司 → 老孟：6万元，后付旧设备首款。</p>}
        </div>
        <details className="document-extra trace-originals">
          <summary>展开回执①原件与陈叔说法</summary>
          <Evidence id="transfer" collapsibleSource />
        </details>
        {state.seen.includes("investment") && <>
          <details className="document-extra trace-originals"><summary>展开回执②原件与付款约定</summary><Evidence id="receipt" compact collapsibleSource /></details>
          <details className="document-extra trace-originals"><summary>展开出资记录（补充说明，不是回执）</summary><Evidence id="investment" compact collapsibleSource /></details>
        </>}
      </section>
      <section className="trace-check" aria-label="核对投入来路和去向">
        {!state.branches.b && <p className="choice-guidance">{state.seen.includes("investment") ? "看回执①的钱转入、回执②的钱付出。下面三项各点一个，查清这6万元还能不能用。" : "先点“看看出资记录”，把转入与付出的回执放在一起核对。"}</p>}
        {!state.seen.includes("investment") ? <><Dialogue person="chen">第一笔买烤箱的钱，是我的积蓄。</Dialogue><Button onClick={() => dispatch({ type: "REQUEST_INVESTMENT" })}>看看出资记录</Button></> : state.branches.b ? <Evidence id="capital-note" /> : <div className="activity simple-answer">
          <Pick label="1 · 钱先后给了谁？" value={v.parties} options={[[true, "先陈叔 → 公司，再公司 → 老孟"], [false, "先老孟 → 公司，再公司 → 陈叔"]]} onChange={(value) => trace("route", value)} />
          <Pick label="2 · 付了多少，买什么？" value={v.amount} options={[[true, "转入6万，再付6万旧设备首款"], [false, "转入6万，再付2万新铺设备款"]]} onChange={(value) => trace("payment", value)} />
          <Pick label="3 · 这6万元还能用吗？" value={v.choice} options={[["twice", "现在多了12万元"], ["same", "同一笔转入又花出，仍余2万元"]]} onChange={(value) => trace("choice", value)} />
          <Feedback>{feedback}</Feedback>
        </div>}
      </section>
    </div>
  </div>;
  if (id === "survey") return <section className="simple-investigation">
    <h3 className="simple-question">想去新铺的，是新客吗？</h3>
    <div className="simple-investigation-grid">
      <Evidence id="survey" collapsibleSource />
      {state.branches.c ? <Evidence id="survey-note" /> : <div className="activity simple-answer">
        <p className="choice-guidance">先选表示想去新铺的受访者组，再选他们的身份，判断这些意愿能否算作新增客源。访谈意愿不等于实际销量。</p>
        <Pick label="哪组想去新铺？" value={selected.length || undefined} options={[[8, "8位 · 想去新铺"], [12, "其余12位"]]} onChange={(count) => survey(Array.from({ length: count }, (_, i) => count === 8 ? i + 1 : i + 9), v.identity)} />
        <Pick label="这组人的身份" value={v.identity} options={[["new", "新增加的客人"], ["regular", "老店常客"]]} onChange={(value) => survey(selected, value)} />
        <Feedback>{feedback}</Feedback>
      </div>}
    </div>
  </section>;
  return <div className="simple-side side-conversation">
    <div className="side-paper">
    <h3 className="simple-question">小禾想负责什么？</h3>
    <div className="invitation-card"><small>留灯烘焙</small><strong>邀请函</strong><p>开业日期 <span className="blank-date" aria-label="日期空白" /></p></div>
    <Dialogue person="xiaohe">设备哪天到、什么时候开门还没定，日期不敢填。我也想问……不开新店，能让我试着带班吗？</Dialogue>
    <p className="choice-guidance">点选想问的话，了解小禾的带班意愿和商量进展，分清个人愿望与已确定的安排。</p>
    <div className="choices">{[["wish", "你想负责什么？"], ["talk", "和陈叔聊过吗？"]].map(([key, text]) => <Button key={key} secondary onClick={() => dispatch({ type: "ASK_XIAOHE", id: key })}>{text}{state.seen.includes(key) && <Icon name="check" />}</Button>)}</div>
    </div>
    <div className="side-paper">
    {["wish", "talk"].filter((key) => state.seen.includes(key)).map((key) => <Evidence id={key} key={key} compact collapsibleSource />)}
    </div>
  </div>;
}
