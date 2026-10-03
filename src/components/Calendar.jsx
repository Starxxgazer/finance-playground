import { useState } from "react";
import { calendarNotes } from "../game/content.js";
import { Feedback } from "./Evidence.jsx";
export function Month({
  day,
  onDay,
  children,
  disabled = false,
  onDrop,
  markers = {},
  hintDay,
}) {
  return (
    <div className="month">
      <div className="month-title">
        <strong>十一月</strong>
        <span>2026</span>
      </div>
      <div className="weekdays" aria-hidden="true">
        {"一二三四五六日".split("").map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="days">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
          <button
            data-idle-hint={n === hintDay ? "0" : undefined}
            key={n}
            type="button"
            className={day === n ? "selected" : ""}
            aria-label={`11月${n}日`}
            aria-pressed={day === n}
            disabled={disabled}
            onClick={() => onDay(n)}
            onDragOver={onDrop ? (e) => e.preventDefault() : undefined}
            onDrop={
              onDrop
                ? (e) => {
                    e.preventDefault();
                    onDrop(e.dataTransfer.getData("text/plain"), n);
                  }
                : undefined
            }
          >
            {n}
            {markers[n] > 0 && (
              <small className="day-note-count" aria-hidden="true">
                {markers[n]}
              </small>
            )}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
const dateQuestions = {
  rent: "押金和首期租金，哪天付？",
  "decor-first": "装修首款，哪天付？",
  "equipment-first": "设备预付款，哪天付？",
  "decor-last": "装修验收款，哪天付？",
  "equipment-last": "设备尾款，哪天付？",
  staff: "人员筹备费，哪天付？",
  stock: "备货试制费，哪天付？",
  open: "计划哪天开业？",
};

export default function Calendar({ state, dispatch, onSource, sources }) {
  const [attempt, setAttempt] = useState(null);
  const [feedback, setFeedback] = useState("");
  const notes = calendarNotes.filter((n) => state.seen.includes(n.source) && (!sources || sources.includes(n.source)));
  const checked = notes.filter((n) => state.calendar[n.id] === n.day);
  const total = sources ? calendarNotes.filter((n) => sources.includes(n.source)).length : calendarNotes.length;
  const complete = total > 0 && checked.length === total;
  const current = notes.find((n) => state.calendar[n.id] !== n.day);
  function place(date) {
    if (!current) return;
    setAttempt({ id: current.id, day: date });
    if (current.day !== date) {
      setFeedback("还没对上，再看原件的日期。");
      return;
    }
    dispatch({ type: "PLACE", id: current.id, day: date });
    setFeedback("");
  }
  return (
    <div className={`${sources ? "scoped-calendar" : "full-calendar"} simple-calendar`}>
      <div className="date-question">
        <span className="date-progress">已核对 {checked.length} / {total}</span>
        <h3>{current ? dateQuestions[current.id] : complete ? "日期已核对" : "先找一份原件"}</h3>
        {current && <p>{current.amount}{current.id !== "open" && <small> · 计划付款</small>}</p>}
        {current && onSource && <button className="text-button" onClick={() => onSource(current.source)}>看原件</button>}
      </div>
      {current && <p className="choice-guidance">{current.id === "open"
        ? "按原件在日历选计划开业日，用来核对开业收款与付款的先后；计划日期不代表能如期开业。"
        : "按原件在日历选本项付款日，排清收付先后。选对自动记录并转到下一项，选错可重选。"}</p>}
      {current && <div className="calendar-workspace">
        <Month
          day={attempt?.id === current.id ? attempt.day : null}
          onDay={place}
          hintDay={current.day}
        />
      </div>}
      <Feedback success={complete}>
        {complete ? "日期仍是计划，能否实现还待核实。" : feedback}
      </Feedback>
      {checked.length > 0 && <details className="calendar-history">
        <summary>已核对日期 · {checked.length}</summary>
        {checked.map((note) => <div className="calendar-history-row" key={note.id}>
          <span>{note.text}</span><strong>11月{state.calendar[note.id]}日</strong>
          {onSource && <button className="text-button" onClick={() => onSource(note.source)}>原件</button>}
        </div>)}
      </details>}
    </div>
  );
}
