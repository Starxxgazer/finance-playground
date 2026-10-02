import { useState } from "react";
import { byId, dimensions, findings } from "../game/content.js";
import { canSubmit } from "../game/state.js";
import { getLine } from "../game/model.js";
import { Button, Icon, Dialogue, asset } from "./Ui.jsx";
import Evidence, { Feedback } from "./Evidence.jsx";
import { EvidencePicker } from "./Funds.jsx";

export default function Findings({ state, dispatch, onSource }) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("finance");
  if (!state.submitted)
    return (
      <section className="handover">
        <Dialogue person="lin">昨晚看出什么问题了？</Dialogue>
        {state.branches.aRequested && !state.seen.includes("alternative") && (
          <button
            className="receipt-notice"
            onClick={() => {
              dispatch({ type: "READ", id: "alternative" });
              onSource("alternative");
            }}
          >
            <Icon name="receipt" />
            <span>
              <strong>老孟的签字回执到了</strong>
              <small>10月30日，点击拆开并收入资料包</small>
            </span>
            <Icon name="arrow" />
          </button>
        )}
        <div className="section-title">
          <h2>昨晚的记录，已经摊开。</h2>
          <span className="stamp">4条发现</span>
        </div>
        <div className="handover-notes">
          {findings.map((f) => (
            <article key={f.id}>
              <h3>{f.title}</h3>
              <p>{f.correct}</p>
              <p className="open-question">还要问：{f.question}</p>
              <div className="proof-links">
                {f.sources
                  .filter((id) => state.seen.includes(id))
                  .map((id) => (
                    <button key={id} onClick={() => onSource(id)}>
                      <Icon name="link" size={14} />
                      {byId[id].title}
                    </button>
                  ))}
              </div>
            </article>
          ))}
        </div>
        <section className="review-citations">
          <div className="section-title">
            <h3>昨晚用过的两份缺口依据</h3>
            <button
              className="text-button"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "收起引用编辑" : "查看或调整引用"}
            </button>
          </div>
          {editing ? (
            <EvidencePicker
              seen={state.seen}
              refs={state.reviewRefs ?? state.funds.refs}
              onChange={(refs) => dispatch({ type: "REVIEW_REFS", refs })}
            />
          ) : (
            <div className="reference-slots">
              {(state.reviewRefs ?? state.funds.refs).map((ref, i) => (
                <div className="reference-slot filled" key={i}>
                  <small>{byId[ref.doc].title}</small>
                  <p>{getLine(ref).text}</p>
                </div>
              ))}
            </div>
          )}
          {!canSubmit(state) && (
            <>
              <Feedback>
                调整后的引用还不能支持昨晚的发现。请补回对应依据，或恢复昨晚的记录。
              </Feedback>
              <Button
                secondary
                onClick={() => dispatch({ type: "RESTORE_REFS" })}
              >
                恢复昨晚的记录
              </Button>
            </>
          )}
        </section>
        <div className="handover-action">
          <p>
            本次将交出全部已收集的 {state.seen.length}{" "}
            份资料，包括尚未核对完的支线材料。还没查清的事也一并留下。
          </p>
          <Button
            disabled={!canSubmit(state)}
            onClick={() => dispatch({ type: "SUBMIT" })}
          >
            把发现和资料交给林姐
            <Icon name="arrow" />
          </Button>
        </div>
      </section>
    );
  const dimension = dimensions.find((d) => d.id === tab);
  const finding = findings.find((f) => f.id === tab);
  return (
    <section className="company-view" aria-label="公司透视图">
      <Dialogue person="lin">
        你找到了钱接不上的那一天，也拿出了依据。剩下的补款、设备和开业时间，我接着核实。
      </Dialogue>
      <div className="section-title">
        <div>
          <span className="section-caption">
            林姐已接收全部 {state.submittedIds.length} 份资料
          </span>
          <h2>留灯烘焙 · 公司透视图</h2>
        </div>
        <span className="stamp">
          <Icon name="check" size={16} />
          调查已交接
        </span>
      </div>
      <p className="muted">
        亮起的是收到的资料。查到了什么，和还要问什么，放在一起看。
      </p>
      <div className="company-layout">
        <div className="company-nav" role="tablist" aria-label="公司透视图分区">
          {dimensions.map((d) => (
            <button
              role="tab"
              id={`tab-${d.id}`}
              aria-controls={`panel-${d.id}`}
              aria-selected={tab === d.id}
              key={d.id}
              onClick={() => setTab(d.id)}
            >
              <Icon
                name={
                  {
                    finance: "wallet",
                    credit: "receipt",
                    risk: "calendar",
                    reputation: "chat",
                  }[d.id]
                }
                size={25}
              />
              <span>{d.label}</span>
              <Icon name="caret" size={18} />
            </button>
          ))}
        </div>
        <article
          className="company-panel"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          <h3>查到了什么</h3>
          <p>{finding.correct}</p>
          {tab === "finance" && state.branches.b && (
            <p className="extended-finding">
              陈叔投过的6万元，已用于旧设备首款；现在的可用现金仍是2万元。
            </p>
          )}
          {tab === "credit" && state.submittedIds.includes("alternative") && (
            <p className="extended-finding">
              收到有条件的备选安排，尚未生效，当前仍按原约定欠款。
            </p>
          )}
          {tab === "reputation" && state.branches.c && (
            <p className="extended-finding">
              有些老客可能换一家店买，不能全算新增；访谈回答不能直接换算销售额。
            </p>
          )}
          {tab === "reputation" && state.submittedIds.includes("wish") && (
            <p className="extended-finding">
              小禾有带班意愿，具体安排还要商量，不能认定她已能独立开店。
            </p>
          )}
          {tab === "reputation" && state.submittedIds.includes("talk") && (
            <p className="extended-finding">与陈叔的具体带班安排尚未确定。</p>
          )}
          <h3>还要问什么</h3>
          <p className="open-question">{finding.question}</p>
          <h3>收到的资料</h3>
          <div className="dimension-evidence">
            {dimension.sources.map((id) => {
              const collected = state.submittedIds.includes(id);
              const pending =
                collected &&
                ((["transfer", "investment"].includes(id) &&
                  !state.branches.b) ||
                  (id === "survey" && !state.branches.c));
              return (
                <button
                  key={id}
                  disabled={!collected}
                  className={collected ? "collected" : "uncollected"}
                  onClick={() => onSource(id)}
                >
                  <Icon name={collected ? "file" : "lock"} size={18} />
                  <span>
                    {byId[id].title}
                    <small>
                      {!collected
                        ? "未收集"
                        : pending
                          ? "已收集，待确认"
                          : byId[id].nature}
                    </small>
                  </span>
                  {collected && <Icon name="caret" size={16} />}
                </button>
              );
            })}
          </div>
        </article>
      </div>
      <div className="handover-action">
        <p>完成首次企业调查。贷款还没批准，钱还没放出，备选分期也未生效。</p>
        <Button onClick={() => dispatch({ type: "END" })}>
          看看小禾发来的消息
          <Icon name="arrow" />
        </Button>
      </div>
    </section>
  );
}
export function Ending({ onReview }) {
  const [back, setBack] = useState(false);
  return (
    <section className="ending">
      <img
        className="ending-image"
        src={asset("scenes/invitation.webp")}
        srcSet={`${asset("scenes/invitation-960.webp")} 960w, ${asset("scenes/invitation.webp")} 1672w`}
        sizes="100vw"
        alt="小禾在面包店柜台前拿着日期空白的邀请函，手边放着背面笔记、付款单和笔"
      />
      <div className="ending-content">
        <span className="section-caption">完成首次企业调查</span>
        <h1>
          日期还空着，
          <br />
          邀请还在。
        </h1>
        <Dialogue person="xiaohe">
          先把钱和设备的时间问清楚。等日期定下来，这张留给你。
        </Dialogue>
        <button
          className={`invitation-card ${back ? "back" : ""}`}
          onClick={() => setBack(!back)}
          aria-label={back ? "翻到邀请函正面" : "翻到邀请函背面"}
        >
          {back ? (
            <>
              <small>先写要问的</small>
              <p>十号差的5万元怎么补？</p>
              <p>设备付清后，哪天能送到、装好？</p>
              <span>
                轻点翻回正面
                <Icon name="reset" size={14} />
              </span>
            </>
          ) : (
            <>
              <small>留灯烘焙</small>
              <strong>邀请函</strong>
              <p>
                开业日期 <span className="blank-date" aria-label="日期空白" />
              </p>
              <span>
                轻点看看背面
                <Icon name="reset" size={14} />
              </span>
            </>
          )}
        </button>
        <p className="ending-note">
          调查完成，剩下的问题由林姐继续核实。贷款尚未批准，分期安排尚未生效。
        </p>
        <Button secondary onClick={onReview}>
          回看调查交接
          <Icon name="notebook" />
        </Button>
      </div>
    </section>
  );
}
