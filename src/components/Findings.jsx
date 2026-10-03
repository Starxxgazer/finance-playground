import { useState } from "react";
import "./office-review.css";
import { byId, dimensions, findings } from "../game/content.js";
import { needsRevisit } from "../game/revisit.js";
import { canSubmit } from "../game/state.js";
import { getLine } from "../game/model.js";
import { Button, Icon, Dialogue, asset } from "./Ui.jsx";
import { Feedback } from "./Evidence.jsx";
import { EvidencePicker } from "./Funds.jsx";

const shortFindings = {
  finance: "现在可用2万元；11月预计经营结余6万元。",
  credit: "旧首款已付，尾款未安排好。",
  reputation: "老店有人喜欢，新店需求待查。",
  risk: "按原计划，11月10日预计缺5万元。",
};

export default function Findings({ state, dispatch, onSource, onEnding }) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("finance");
  const ready = canSubmit(state);
  if (!state.submitted)
    return (
      <section className="handover simple-handover office-review">
        <div className="handover-context side-paper">
        <p className="office-instruction"><strong>林姐</strong>资料给我，没查清的我接着问。</p>
        <div className="section-title">
          <h2>{state.chapterCleared ? "补查资料，交给林姐" : "整理好了，交给林姐"}</h2>
          <span className="section-caption">{state.solved.length} 条已确认发现 · {state.seen.length} 份资料</span>
        </div>
        <div className="handover-action primary-handover-action">
          <span>{state.chapterCleared ? "第一章已通关 · 本次只补交资料" : "交接后还需点击“完成调查”通关。"}</span>
          <Button disabled={!ready} onClick={() => dispatch({ type: "SUBMIT" })}>交给林姐</Button>
        </div>
        {!ready && <div className="citation-recovery">
          <Feedback>依据未对齐，请恢复或调整引用。</Feedback>
          <Button secondary onClick={() => dispatch({ type: "RESTORE_REFS" })}>恢复昨晚的依据</Button>
        </div>}
        </div>
        <div className="handover-records side-paper">
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
              <small>点开收入资料包</small>
            </span>

          </button>
        )}

        <div className="handover-notes">
          {findings
            .filter((f) => state.solved.includes(f.id))
            .map((f) => (
              <article key={f.id}>
                <h3>{f.title}</h3>
                <p>{shortFindings[f.id]}</p>
                <p className="open-question">待查：{f.question}</p>
                <details className="finding-sources">
                  <summary>完整记录与依据</summary>
                  <p>{f.correct}</p>
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
                </details>
              </article>
            ))}
        </div>
        <details className="review-citations">
          <summary>核对引用</summary>
          <div className="section-title">
            <h3>原文引用</h3>
            <button
              className="text-button"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "收起引用编辑" : "调整引用"}
            </button>
          </div>
          {editing && <p className="choice-guidance">要交接的资金判断由哪两条原文支持？选择资料，再点原文，分别引用所查日期前可用的钱和到期要付的钱，供林姐复核。同一账目重复引用不算两条独立依据。</p>}
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
        </details>
        </div>
      </section>
    );
  const dimension = dimensions.find((d) => d.id === tab);
  const finding = findings.find((f) => f.id === tab);
  return (
    <section className="company-view simple-company office-review" aria-label="公司透视图">
      <div className="company-context side-paper">
      <p className="office-instruction"><strong>林姐</strong>{state.chapterCleared ? "第一章已通关。这里是回看与选看补查，不需要重新通关。" : "资料已接收。还差最后一步：点击“完成调查”，第一章就通关了。"}</p>
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
      <div className="handover-action primary-handover-action">
        <span>贷款未批准，备选分期未生效。</span>
        <Button onClick={() => {
          if (state.chapterCleared && state.complete) onEnding();
          else dispatch({ type: "END" });
        }}>{state.chapterCleared ? "返回通关画面" : "完成调查"}</Button>
      </div>
      </div>
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

            </button>
          ))}
        </div>
        <article
          className="company-panel"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          <div className="company-conclusions">
          <h3>查到了什么</h3>
          <p>
            {state.solved.includes(tab)
              ? shortFindings[tab]
              : "口碑未核实，暂不作结论。"}
          </p>
          {state.solved.includes(tab) && <details className="finding-sources">
            <summary>完整记录</summary>
            <p>{finding.correct}</p>
          </details>}
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
          <p className="open-question">
            {tab === "reputation" && !state.solved.includes(tab)
              ? "老店顾客怎么评价？这些评价能否代表新铺的需求？"
              : finding.question}
          </p>
          </div>
          <div className="company-documents">
          <div className="office-evidence-heading">
            <h3>收到的资料</h3>
            <span>{dimension.sources.filter(id => state.submittedIds.includes(id)).length} / {dimension.sources.length}</span>
          </div>
          <p className="office-evidence-help">亮色可回看，灰色可补查；补查后需重新交给林姐。</p>
          <div className="dimension-evidence">
            {dimension.sources.map((id) => {
              const collected = state.submittedIds.includes(id);
              const revisit = needsRevisit(state, id);
              const pending = collected && revisit;
              return (
                <button
                  key={id}
                  disabled={!collected && !revisit}
                  className={collected ? "collected" : "uncollected"}
                  onClick={() => revisit ? dispatch({ type: "REVISIT", id }) : onSource(id)}
                >
                  <Icon name={collected ? "file" : "lock"} size={18} />
                  <span>
                    {byId[id].title}
                    <small>
                      {!collected
                        ? "未收集 · 点此补查"
                        : pending
                          ? "已收集，待确认 · 点此继续"
                          : byId[id].nature}
                    </small>
                  </span>

                </button>
              );
            })}
          </div>
          </div>
        </article>
      </div>
    </section>
  );
}
export function Ending({ onReview }) {
  const [back, setBack] = useState(false);
  return (
    <section className="ending" aria-labelledby="chapter-complete-title">
      <img
        className="ending-image"
        src={asset("scenes/invitation.webp")}
        srcSet={`${asset("scenes/invitation-960.webp")} 960w, ${asset("scenes/invitation.webp")} 1672w`}
        sizes="100vw"
        alt="小禾在面包店柜台前拿着日期空白的邀请函，手边放着背面笔记、付款单和笔"
      />
      <div className="ending-content">
        <span className="section-caption">完成首次企业调查</span>
        <h1 id="chapter-complete-title">第一章通关</h1>
        <p>
          《排队的面包店》调查完成。<br />
          关键收付已核对，调查资料已交给林姐。
        </p>
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
        <p className="ending-note">本章已结束，可以关闭游戏。回看与补查仅供选看，不影响已通关状态。</p>
        <Button secondary onClick={onReview}>
          通关后回看（可选）
          <Icon name="notebook" />
        </Button>
      </div>
    </section>
  );
}
