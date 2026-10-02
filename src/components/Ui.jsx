import { useEffect, useRef, useId } from 'react';
import { ArrowRight, ArrowLeft, BookOpenText, CalendarBlank, ChartLine, ChatCircleText, Check, CheckCircle, ClipboardText, FileText, Lightbulb, LockSimple, MagnifyingGlass, Notebook, Pause, Play, Receipt, SealCheck, Wallet, X, ArrowCounterClockwise, CaretRight, MapPin, FilmSlate, Link as LinkIcon } from '@phosphor-icons/react';

const icons = { arrow: ArrowRight, back: ArrowLeft, book: BookOpenText, calendar: CalendarBlank, chart: ChartLine, chat: ChatCircleText, check: Check, done: CheckCircle, clipboard: ClipboardText, file: FileText, hint: Lightbulb, lock: LockSimple, search: MagnifyingGlass, notebook: Notebook, pause: Pause, play: Play, receipt: Receipt, wallet: Wallet, close: X, seal: SealCheck, reset: ArrowCounterClockwise, caret: CaretRight, pin: MapPin, film: FilmSlate, link: LinkIcon };
export function Icon({ name, size = 20, ...props }) { const Component = icons[name] || FileText; return <Component size={size} weight="regular" aria-hidden="true" {...props} />; }
export function Button({ children, secondary = false, className = '', ...props }) { return <button className={`${secondary ? 'button-secondary' : 'button-primary'} ${className}`} {...props}>{children}</button>; }
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
export const characters = {
  chen: { name: '陈叔', role: '留灯烘焙负责人' },
  lin: { name: '林姐', role: '银行调查小组负责人' },
  meng: { name: '老孟', role: '老店设备供应商' },
  xiaohe: { name: '小禾', role: '面包店店员，你的朋友' },
};
export function Portrait({ person, large = false }) {
  return <div role="img" aria-label={characters[person].name} className={`portrait portrait-${person} ${large ? 'portrait-large' : ''}`} style={{ backgroundImage: `url("${asset(`characters/${person}.webp`)}")` }} />;
}
export function Dialogue({ person, children }) { return <div className="dialogue"><Portrait person={person} /><div><strong>{characters[person].name}</strong><p>{children}</p></div></div>; }

export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={id} className={`modal ${wide ? 'modal-wide' : ''}`} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭窗口"><Icon name="close" /></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}
