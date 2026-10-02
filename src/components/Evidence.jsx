import { useState } from 'react';
import { Icon, Button } from './Ui.jsx';

export default function Evidence({ item, collected, onCollect, onSource, onLocate, compact = false }) {
  const [answer, setAnswer] = useState(null);
  return <article className={`evidence-document ${compact ? 'compact-document' : ''}`} aria-label={item.title}>
    <div className="document-category"><Icon name={item.icon} /><span>{item.category}资料</span><span className="document-nature">{item.nature}</span></div>
    <h2>{item.title}</h2><p className="document-lead">{item.lead}</p>
    <div className="document-meta"><span>适用时间</span><strong>{item.time}</strong></div>
    {item.quotes?.map((quote) => <blockquote key={quote}>“{quote}”</blockquote>)}
    {item.rows && <div className="table-scroll"><table><caption className="sr-only">{item.title}明细</caption>{item.columns && <thead><tr>{item.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>}<tbody>{item.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
    {item.id === 'budget' && onLocate && <button className="text-button" onClick={onLocate}><Icon name="pin" size={16} />定位新烤箱与冷藏柜</button>}
    <p className="document-note">{item.text}</p>
    {item.id === 'reviews' && <div className="question"><strong>这些反馈主要帮助理解什么？</strong><div className="answer-options">{['产品与顾客体验', '公司是否资金充足'].map((label, i) => <button key={label} aria-pressed={answer === i} className={answer === i ? 'selected' : ''} onClick={() => setAnswer(i)}>{label}</button>)}</div>{answer !== null && <p className="inline-feedback" role="status">{answer === 0 ? '是的。' : '这还不足以判断资金情况。'}{item.insight}</p>}</div>}
    <button className="source-link" onClick={() => onSource(item.id)}><Icon name="link" size={16} /><span>查看来源：{item.source}</span><Icon name="caret" size={14} /></button>
    {!compact && <Button disabled={!collected && item.id === 'reviews' && answer === null} secondary={collected} onClick={onCollect}><Icon name={collected ? 'check' : 'notebook'} size={18} />{collected ? '已记录 · 返回现场' : '记入调查记录'}</Button>}
  </article>;
}
