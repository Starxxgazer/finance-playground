import { useState } from 'react';
import { findings, dimensions, evidence, byId } from '../game/content.js';
import { Icon, Button, Dialogue } from './Ui.jsx';

export function CompanyView({ onSource }) {
  return <div className="company-view"><div className="company-title"><Icon name="seal" size={32} /><div><span>留灯烘焙 / 调查成果</span><h2>公司透视图</h2></div></div><div className="assessment"><span><Icon name="check" size={16} />三条发现有依据</span><span><Icon name="check" size={16} />四类信号已覆盖</span><span><Icon name="check" size={16} />未知问题已保留</span></div>{dimensions.map((dimension) => <div className="dimension" key={dimension.label}><strong>{dimension.label}</strong><div><p>{dimension.text}</p><div className="source-chips">{dimension.sources.map((id) => <button key={id} onClick={() => onSource(id)}><Icon name="link" size={13} />{byId[id].short}</button>)}</div></div></div>)}<p className="model-note">本次任务是交回有依据的调查发现。后续核实与贷款审批由银行上级处理。</p></div>;
}

export default function Findings({ state, dispatch, onSource }) {
  const [active, setActive] = useState(() => findings.find((f) => !state.solved.includes(f.id))?.id || 'use');
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [postponed, setPostponed] = useState(false);
  const allDone = state.solved.length === findings.length;
  const current = findings.find((f) => f.id === active);
  const solved = state.solved.includes(active);
  const chooseFinding = (id) => { setActive(id); setSelected([]); setMessage(''); };
  const submit = () => {
    if (current.required.length === selected.length && current.required.every((id) => selected.includes(id))) {
      dispatch({ type: 'SOLVE', id: current.id, evidence: selected }); setMessage('依据已连接。这条发现可以追溯到原资料。');
    } else setMessage(active === 'use' ? '需要分别证明旧设备付款与新店投入；口碑和收款预测不能直接证明这两项用途。' : '需要同时看到经营现金的产生时间、新店付款日期和资金试算结果。可以重新选择。');
  };
  return <div className={`findings-workspace ${allDone ? 'findings-complete' : ''}`}>
    <aside className="findings-list"><span className="small-heading">待整理的发现</span>{findings.map((finding, i) => <button key={finding.id} className={finding.id === active ? 'active' : ''} aria-pressed={finding.id === active} onClick={() => chooseFinding(finding.id)}><span className="finding-number">{state.solved.includes(finding.id) ? <Icon name="check" size={18} /> : `0${i + 1}`}</span><span>{finding.title}<small>{state.solved.includes(finding.id) ? '依据已连接' : '等待整理'}</small></span></button>)}<Dialogue person="lin">{allDone ? '“查清楚了。后续核实和安排，我来接着做。”' : '把发现和依据放在一起，未知的问题也要留下来。'}</Dialogue></aside>
    <div className="findings-paper">{allDone ? <CompanyView onSource={onSource} /> : <><div className="fund-instruction"><span>调查发现 / {findings.indexOf(current) + 1}</span><h2>{current.title}</h2><p>{current.subtitle}</p></div>
      {solved ? <div className="finding-result"><Icon name="seal" size={38} /><h3>这条发现已整理</h3><p>{current.result}</p><div className="source-chips">{current.required.map((id) => <button key={id} onClick={() => onSource(id)}><Icon name="link" size={14} />{byId[id].short}</button>)}</div><Button secondary onClick={() => chooseFinding(findings.find((f) => !state.solved.includes(f.id)).id)}>继续整理下一条<Icon name="arrow" size={18} /></Button></div> : active === 'debt' ? <div className="postpone-experiment"><div className="postpone-papers"><div className={postponed ? 'postponed' : ''}><Icon name="file" size={26} /><h3>新店完整预算</h3><strong>18<small>万元</small></strong><span>{postponed ? '暂缓新店投入' : '计划中的新店支出'}</span></div><div className="debt-remains"><Icon name="receipt" size={26} /><h3>旧设备尾款</h3><strong>10<small>万元</small></strong><span>已交付使用，尾款仍需履行</span><button className="text-button" onClick={() => onSource('oven')}>查看付款资料</button></div></div><Button secondary onClick={() => { setPostponed(!postponed); setMessage(!postponed ? '新店支出可以减少，但已交付的老店烤箱尾款仍然存在。' : '已恢复原计划示意。'); }}>{postponed ? '恢复原计划示意' : '暂缓新店，看看变化'}</Button><p role="status" className="inline-feedback">{message || '这个按钮只改变示意，不代表已经签订延期协议。'}</p><Button disabled={!postponed} onClick={() => dispatch({ type: 'SOLVE', id: 'debt', evidence: ['oven'] })}>记录这条发现<Icon name="check" size={18} /></Button></div> : <><div className="evidence-picker">{evidence.filter((item) => state.seen.includes(item.id)).map((item) => <div key={item.id} className={selected.includes(item.id) ? 'picked' : ''}><button aria-pressed={selected.includes(item.id)} onClick={() => { setSelected((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]); setMessage(''); }}><Icon name={item.icon} size={20} /><span>{item.short}</span><span className="picker-check">{selected.includes(item.id) && <Icon name="check" size={14} />}</span></button><button onClick={() => onSource(item.id)} aria-label={`回看${item.short}`}><Icon name="search" size={15} /></button></div>)}</div><div className="selection-status"><span>已选 {selected.length} 条依据</span><Button onClick={submit} disabled={selected.length === 0}>连接证据，形成发现<Icon name="link" size={18} /></Button></div><p className="inline-feedback" role="status">{message || '可以随时回看资料、取消选择并重新组合。'}</p></>}
    </>}</div>
  </div>;
}
