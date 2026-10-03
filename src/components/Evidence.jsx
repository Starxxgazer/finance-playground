import { useState } from "react";
import { byId, findings } from "../game/content.js";
import ItemIcon from "./ItemIcon.jsx";
import { Icon, Button, Dialogue } from "./Ui.jsx";

export default function Evidence({ id, children, compact = false }) {
  const item = byId[id];
  return (
    <article className={`document ${compact ? "compact" : ""}`}>
      <div className="document-meta">
        <span>{item.nature}</span>
        <ItemIcon id={id} small />
      </div>
      <h3>{item.title}</h3>
      <div className="document-source">
        <span>来源：{item.source}</span>
        <span>{item.date}</span>
      </div>
      <div className="document-lines">
        {item.lines.map((line) => (
          <p key={line.id}>{line.text}</p>
        ))}
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
export function OldActivity({ id, state, dispatch }) {
  const [values, setValues] = useState({});
  const [feedback, setFeedback] = useState("");
  const set = (k, v) => {
    setValues({ ...values, [k]: v });
    setFeedback("");
  };
  const done = state.tasks[id];
  function submit() {
    const okay =
      id === "ledger"
        ? values.cash === "now" && values.net === "forecast"
        : id === "debt"
          ? values.day === "1" && values.status === "unpaid"
          : values.amount && values.date && values.status === "paid";
    if (okay) {
      dispatch({ type: "CLASSIFY", id, ...values, day: Number(values.day) });
      setFeedback("核对好了。有依据的发现与待查问题已记入手记。");
    } else
      setFeedback(
        id === "ledger"
          ? "看看记录的时间：哪些已经在账上，哪些要等经营后才形成？"
          : id === "debt"
            ? "再看原单据的到期日，以及现在是否已经支付。"
            : "把回执和约定放在一起，比较金额与付款时间。",
      );
  }
  return (
    <>
      <Evidence id={id} />
      {done ? (
        <Feedback success>这组资料已核对，可随时回看。</Feedback>
      ) : (
        <section className="activity">
          <h3>
            {id === "ledger"
              ? "把钱放对位置"
              : id === "debt"
                ? "这张单，什么时候付？"
                : "回执和约定对得上吗？"}
          </h3>
          {id === "ledger" && (
            <div className="classify-grid">
              {[
                ["cash", "2万元"],
                ["net", "6万元"],
              ].map(([key, label]) => (
                <fieldset key={key}>
                  <legend>{label}</legend>
                  {[
                    ["now", "现在可用"],
                    ["forecast", "预计经营结余"],
                  ].map(([value, text]) => (
                    <label className="choice" key={value}>
                      <input
                        type="radio"
                        name={key}
                        checked={values[key] === value}
                        onChange={() => set(key, value)}
                      />
                      {text}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          )}
          {id === "debt" && (
            <>
              <label className="form-label">
                尾款到期日
                <select
                  value={values.day || ""}
                  onChange={(e) => set("day", e.target.value)}
                >
                  <option value="">选择11月的日期</option>
                  {Array.from({ length: 30 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      11月{i + 1}日
                    </option>
                  ))}
                </select>
              </label>
              <div className="choice-row">
                {[
                  ["unpaid", "还没付"],
                  ["paid", "已经付了"],
                ].map(([value, text]) => (
                  <label className="choice" key={value}>
                    <input
                      type="radio"
                      name="payment"
                      checked={values.status === value}
                      onChange={() => set("status", value)}
                    />
                    {text}
                  </label>
                ))}
              </div>
            </>
          )}
          {id === "receipt" && (
            <>
              <div className="receipt-pair">
                <div>
                  <small>付款约定</small>
                  <strong>公司 → 老孟</strong>
                  <p>
                    旧设备首款 6万元
                    <br />
                    约定首款日支付
                  </p>
                </div>
                <div>
                  <small>付款回执</small>
                  <strong>公司 → 老孟</strong>
                  <p>
                    旧设备首款 6万元
                    <br />
                    付款时间与约定相符
                  </p>
                </div>
              </div>
              {[
                ["amount", "金额一致"],
                ["date", "付款时间符合约定"],
              ].map(([key, label]) => (
                <label className="choice" key={key}>
                  <input
                    type="checkbox"
                    checked={!!values[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
              <div className="choice-row">
                {[
                  ["paid", "已经付了"],
                  ["unpaid", "还没付"],
                ].map(([value, text]) => (
                  <label className="choice" key={value}>
                    <input
                      type="radio"
                      name="paid"
                      checked={values.status === value}
                      onChange={() => set("status", value)}
                    />
                    {text}
                  </label>
                ))}
              </div>
            </>
          )}
          <Button onClick={submit}>
            确认核对
            <Icon name="check" size={18} />
          </Button>
          <Feedback>{feedback}</Feedback>
        </section>
      )}
    </>
  );
}
export function CustomerActivity({ state, dispatch }) {
  return (
    <div className="activity">
      <p className="muted">门口还有人在排队。你可以自己选先问什么。</p>
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
      {["taste", "queue"]
        .filter((id) => state.seen.includes(id))
        .map((id) => (
          <Evidence key={id} id={id} compact />
        ))}
    </div>
  );
}
export function Notes({ state, dispatch }) {
  const [feedback, setFeedback] = useState("");
  return (
    <div className="notes-list">
      <p className="muted">只记下有依据的发现。还没查清的事，留着继续问。</p>
      {findings
        .filter(
          (f) =>
            state.solved.includes(f.id) ||
            (f.id === "reputation" &&
              ["taste", "queue"].every((id) => state.seen.includes(id))),
        )
        .map((f) => {
          const done = state.solved.includes(f.id);
          const ready =
            f.id === "finance"
              ? state.tasks.ledger
              : f.id === "credit"
                ? state.tasks.debt && state.tasks.receipt
                : ["taste", "queue"].every((id) => state.seen.includes(id));
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
                    {ready ? "选一句写进笔记。" : "先完成相关资料的核对。"}
                  </p>
                  {ready &&
                    [f.wrong, f.correct].map((text, i) => (
                      <button
                        className="sentence-choice"
                        key={text}
                        disabled={!ready}
                        onClick={() => {
                          dispatch({
                            type: "NOTE",
                            id: f.id,
                            choice: i === 1 ? "supported" : "unsupported",
                          });
                          setFeedback(
                            i === 1
                              ? "发现和保留问题已记下。"
                              : "这句话超出了现有资料能说明的范围。回到相关资料再看看，随时可以改。",
                          );
                        }}
                      >
                        {text}
                        <Icon name="caret" size={16} />
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
  const set = (key, value) => setV({ ...v, [key]: value });
  if (id === "contract")
    return (
      <>
        <Evidence id="contract" />
        <Dialogue person="meng">
          尾款的事可以商量。不过，一边开新店，一边拖旧款，我不同意。
        </Dialogue>
        {state.branches.aRequested ? (
          <Feedback success>
            已追问备选安排。老孟会在次日发来签字回执，当前尾款约定仍然有效。
          </Feedback>
        ) : (
          <Button onClick={() => dispatch({ type: "CONTACT_MENG" })}>
            当面追问：尾款能不能晚一点付？
          </Button>
        )}
      </>
    );
  if (id === "transfer")
    return (
      <>
        <Dialogue person="chen">
          买这台烤箱的第一笔钱，是我从积蓄里拿的。
        </Dialogue>
        <Evidence id="transfer" />
        {!state.seen.includes("investment") ? (
          <Button onClick={() => dispatch({ type: "REQUEST_INVESTMENT" })}>
            向陈叔索取当时的出资记录
          </Button>
        ) : (
          <>
            <Evidence id="investment" compact />
            <Evidence id="receipt" compact />
            {state.branches.b ? (
              <>
                <Evidence id="capital-note" />
                <Dialogue person="chen">
                  那时候就想先把炉子买好，把面包做好。
                </Dialogue>
              </>
            ) : (
              <section className="activity">
                <h3>把来路和去向接起来</h3>
                <div className="money-trace">
                  陈叔 <span>6万元 →</span> 公司 <span>6万元 →</span> 老孟
                </div>
                {[
                  ["parties", "核对收付款双方"],
                  ["order", "转入早于设备首款付款"],
                  ["amount", "两张回执金额均为6万元"],
                  ["purpose", "去向是这台旧设备的首款"],
                ].map(([key, text]) => (
                  <label className="choice" key={key}>
                    <input
                      type="checkbox"
                      checked={!!v[key]}
                      onChange={(e) => set(key, e.target.checked)}
                    />
                    {text}
                  </label>
                ))}
                <div className="choices">
                  {[
                    ["twice", "两笔6万元，所以共增加了12万元"],
                    ["same", "同一笔钱转入又花出，现在余额仍为2万元"],
                  ].map(([choice, text]) => (
                    <button
                      className="sentence-choice"
                      key={choice}
                      onClick={() => {
                        dispatch({ type: "TRACE_CAPITAL", ...v, choice });
                        setFeedback(
                          choice === "twice"
                            ? "看看钱从谁手里出去，又到了谁手里。"
                            : Object.values(v).filter(Boolean).length < 4
                              ? "先把双方、先后、金额和设备用途都对一遍。"
                              : "钱的来路和去向已记入资料包。",
                        );
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <Feedback>{feedback}</Feedback>
              </section>
            )}
          </>
        )}
      </>
    );
  if (id === "survey")
    return (
      <>
        <Evidence id="survey" />
        {state.branches.c ? (
          <>
            <Evidence id="survey-note" />
            <Dialogue person="xiaohe">也是我们原来的客人。</Dialogue>
          </>
        ) : (
          <section className="activity">
            <h3>圈出想去新铺的8位受访者</h3>
            <p className="muted">
              看看他们的身份标记。点选可以圈出，再点可以取消。
            </p>
            <div className="survey-grid">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  aria-label={`受访者${n}：老店常客，${n <= 8 ? "想去新铺" : "更想留在老店"}`}
                  aria-pressed={selected.includes(n)}
                  className={selected.includes(n) ? "selected" : ""}
                  onClick={() =>
                    setSelected(
                      selected.includes(n)
                        ? selected.filter((x) => x !== n)
                        : [...selected, n],
                    )
                  }
                >
                  <strong>{String(n).padStart(2, "0")}</strong>
                  <span>老店常客</span>
                  <small>{n <= 8 ? "想去新铺" : "仍选老店"}</small>
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                dispatch({ type: "SURVEY", selected });
                setFeedback(
                  selected.length === 8 && selected.every((n) => n <= 8)
                    ? ""
                    : "对照访谈本，圈出8位“想去新铺”的老店常客。",
                );
              }}
            >
              追问：这些都是新增加的客人吗？
            </Button>
            <Feedback>{feedback}</Feedback>
          </section>
        )}
      </>
    );
  return (
    <>
      <div className="invitation-card">
        <small>留灯烘焙</small>
        <strong>邀请函</strong>
        <p>
          开业日期 <span className="blank-date" aria-label="日期空白" />
        </p>
      </div>
      <Dialogue person="xiaohe">
        {v.dateAsked ||
        state.seen.includes("wish") ||
        state.seen.includes("talk")
          ? "设备哪天到、什么时候能开门还没定，我怕写早了。其实我还想问……不开新店，也能让我试着带班吗？"
          : "邀请函做好了，日期还没敢填。"}
      </Dialogue>
      {!v.dateAsked &&
        !state.seen.includes("wish") &&
        !state.seen.includes("talk") && (
          <Button onClick={() => set("dateAsked", true)}>
            日期为什么还空着？
          </Button>
        )}
      {(v.dateAsked ||
        state.seen.includes("wish") ||
        state.seen.includes("talk")) && (
        <div className="choices">
          {[
            ["wish", "你最想试着负责什么？"],
            ["talk", "你和陈叔聊过吗？"],
          ].map(([key, text]) => (
            <Button
              key={key}
              secondary
              onClick={() => dispatch({ type: "ASK_XIAOHE", id: key })}
            >
              {text}
              {state.seen.includes(key) && <Icon name="check" />}
            </Button>
          ))}
        </div>
      )}
      {["wish", "talk"]
        .filter((key) => state.seen.includes(key))
        .map((key) => (
          <Evidence id={key} key={key} />
        ))}
      <p className="muted">
        愿意带班，和已经能够独立开店，是两件事。问到什么就记录什么。
      </p>
    </>
  );
}
