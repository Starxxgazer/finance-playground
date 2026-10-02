import { useState } from 'react';
import { fundingCards, money, wan, assumption, chain } from '../game/content.js';
import { cardBalance, calculatePlan } from '../game/model.js';
import { Icon, Button, Dialogue } from './Ui.jsx';

const stageNames = ['启动款', '完整月份', '付款日期', '开业条件'];
export default function Funds({ state, dispatch, onSource }) {
  const [time, setTime] = useState('month');
  const [feedback, setFeedback] = useState('');
  const stage = state.fundStage;
  const plan = calculatePlan();
  const cards = fundingCards.filter((card) => card.group === (stage === 0 ? 'start' : 'month'));
  const ready = cards.every((card) => state.cards.includes(card.id));
  const next = () => { dispatch({ type: 'FUND_NEXT' }); setFeedback(''); if (stage === 1) setTime('day10'); };
  return <div className="fund-workspace">
    <div className="fund-top"><ol className="fund-stages">{stageNames.map((label, i) => <li key={label} className={i === stage ? 'current' : i < stage ? 'finished' : ''}><span>{i < stage ? <Icon name="check" size={14} /> : i + 1}</span>{label}</li>)}</ol><span className="assumption"><Icon name="file" size={15} />{assumption}</span></div>
    {stage < 2 ? <div className="fund-sheet">
      <div className="fund-instruction"><span>资金核对 / {stage + 1}</span><h2>{stage === 0 ? '启动的钱，正好够？' : '把完整月份算进去。'}</h2><p>{stage === 0 ? '点击下方四张卡片，将资金来源和首期付款放上桌。' : '首期付款后余额为0。再把经营、后续付款与还款放进来。'}</p></div>
      <div className="fund-cards">{cards.map((card) => <div key={card.id} className={`fund-card ${state.cards.includes(card.id) ? 'included' : ''}`}>
        <button className="fund-card-main" onClick={() => dispatch({ type: 'CARD', id: card.id })} aria-pressed={state.cards.includes(card.id)} aria-label={`${state.cards.includes(card.id) ? '移出' : '加入'}${card.label}`}><span className="card-check">{state.cards.includes(card.id) ? <Icon name="check" size={16} /> : '+'}</span><span>{card.label}</span><strong>{card.amount > 0 ? '+' : '−'}{wan(Math.abs(card.amount))}<small>元</small></strong><span className="card-time">{card.id === 'newNet' ? '以按期开业为前提' : card.id === 'repayment' ? '第30天支付 · 案例条件' : stage === 0 ? '第1天' : card.id === 'followup' ? '第10天支付' : '第1至30天逐步产生'}</span></button>
        <button className="card-source" onClick={() => onSource(card.source)}><Icon name="link" size={14} />查看依据</button>
      </div>)}</div>
      <div className="balance-line"><div><span>{ready ? stage === 0 ? '首期付款后模型结余' : '月底预计结余' : '已选卡片合计'}</span><strong data-testid="card-balance">{cardBalance(state.cards) < 0 ? '−' : ''}{money(Math.abs(cardBalance(state.cards)))}<small>元</small></strong></div><div className="balance-message">{ready ? stage === 0 ? <><b>“那不是正好？”</b><p>桌边还有经营、后续付款与还款资料。</p></> : <><b>月底看起来有结余。</b><p>但新店的预计收款，以按期开业为前提。</p></> : <p>还需加入 {cards.filter((card) => !state.cards.includes(card.id)).length} 张卡片</p>}</div></div>
      {stage === 1 && ready && <details className="calculation"><summary>展开完整计算与资金总额</summary><p>2＋20＋20＋6－10－12－14－6－4－1.8＝0.2万元</p><p>资金来源合计48万元，付款用途合计47.8万元。</p></details>}
      <div className="fund-actions"><span>金额由案例资料计算</span><Button disabled={!ready} onClick={next}>{stage === 0 ? '再看看完整月份' : '检查第10天能否付款'}<Icon name="arrow" size={18} /></Button></div>
    </div> : stage === 2 ? <div className="fund-sheet timeline-sheet">
      <div className="fund-instruction"><span>资金核对 / 3</span><h2>钱，赶得上付款日吗？</h2><p>点击日期，对比当时能够产生的现金。</p></div>
      <div className="timeline-tabs" role="group" aria-label="选择试算时间"><button aria-pressed={time === 'start'} onClick={() => setTime('start')}><span>第1天</span><small>支付首期款</small></button><button aria-pressed={time === 'day10'} onClick={() => setTime('day10')}><span>第10天</span><small>后续款到期</small></button><button aria-pressed={time === 'month'} onClick={() => setTime('month')}><span>第30天</span><small>月底与还款</small></button></div>
      <div className={`time-result ${time === 'day10' ? 'has-gap' : ''}`}><div><span>{time === 'day10' ? '截至第10天 · 预计资金缺口' : time === 'month' ? '月底 · 预计结余' : '首期付款后 · 模型结余'}</span><strong data-testid="time-result">{money(Math.abs(time === 'day10' ? plan.day10 : time === 'month' ? plan.month : plan.initial))}<small>元</small></strong></div><Icon name={time === 'day10' ? 'calendar' : 'wallet'} size={44} /></div>
      <div className="time-equation">{time === 'day10' ? <><span>首期付款后 <b>0</b></span><i>＋</i><span>老店前10天结余 <b>1万</b></span><i>−</i><span>新店后续付款 <b>6万</b></span><i>＝</i><span>预计不足 <b>5万</b></span></> : time === 'month' ? <p>0＋6－6＋2－1.8＝0.2万元；试营业收款以按期开业为前提。</p> : <p>当前现金2万＋假设贷款20万－旧设备尾款10万－新店启动12万＝0。</p>}</div>
      <p className="model-note">{time === 'day10' ? '此时新店还没开门，老店的整月结余也没有全部产生。预计不足不等于真实账户负余额，也不是已核实的全月最低点。' : time === 'month' ? '这个结果建立在原计划全部实现的条件下，不能证明月内每天都能付款。' : '贷款到账是试算条件，不代表贷款已经获批。'}</p>
      <details className="calculation"><summary>核对计算来源</summary><p>{time === 'day10' ? '2＋20＋6－10－12－5－6＝－5万元' : time === 'month' ? '2＋20＋20＋6－10－12－14－6－4－1.8＝0.2万元' : '2＋20－10－12＝0万元'}</p><button className="text-button" onClick={() => onSource('schedule')}>查看经营排期</button><button className="text-button" onClick={() => onSource('budget')}>查看付款预算</button></details>
      <div className="fund-actions"><span>接下来：新店的收入从哪里来？</span><Button onClick={next}>检查付款与开业的关系<Icon name="arrow" size={18} /></Button></div>
    </div> : <div className="fund-sheet chain-sheet">
      <div className="fund-instruction"><span>资金核对 / 4</span><h2>后面的收款，需要前面的钱。</h2><p>按发生顺序点击下方五个环节，连接这条开业路径。</p></div>
      <button className="contract-clause" onClick={() => onSource('procurement')}><Icon name="receipt" size={28} /><span><small>新设备采购条款</small><strong>剩余2万元付清后，安排发货。</strong></span><Icon name="caret" /></button>
      <div className="dependency-chain">{chain.map((label, index) => <div key={label}><button aria-pressed={index < state.chainCount} onClick={() => { if (index === state.chainCount) { dispatch({ type: 'CHAIN', index }); setFeedback(index === chain.length - 1 ? '已连接：预计营业收款依赖前面的付款、交付与准备完成。' : `已连接“${label}”，继续寻找下一个环节。`); } else if (index >= state.chainCount) setFeedback(`先确认“${chain[state.chainCount]}”，后面的环节才能成立。`); }}><span>{index < state.chainCount ? <Icon name="check" size={18} /> : index + 1}</span><strong>{label}</strong></button>{index < chain.length - 1 && <Icon name="arrow" size={18} />}</div>)}</div>
      <p role="status" className="inline-feedback">{feedback || (state.chainCount === chain.length ? '条件关系已核对。可以把发现带回银行。' : '从第10天的付款开始。')}</p>
      <Dialogue person="chen">“得先把这笔付上，后面的生意才能开始。”</Dialogue>
      <p className="model-note">这里展示条件关系。资金缺口本身不等于企业倒闭，也不能据此判断老板造假。</p>
    </div>}
  </div>;
}
