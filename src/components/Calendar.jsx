import { useState } from "react";
import { calendarNotes } from "../game/content.js";
import { Icon } from "./Ui.jsx";
import { Feedback } from "./Evidence.jsx";
export function Month({
  day,
  onDay,
  children,
  disabled = false,
  onDrop,
  markers = {},
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
export default function Calendar({ state, dispatch, onSource }) {
  const [selected, setSelected] = useState(null);
  const [day, setDay] = useState(null);
  const [feedback, setFeedback] = useState("");
  const notes = calendarNotes.filter((n) => state.seen.includes(n.source));
  const placed = Object.keys(state.calendar).length;
  function place(id, date) {
    const note = notes.find((n) => n.id === id);
    if (!note) {
      setFeedback("先选一张已经找到的便签，再点日历日期。");
      return;
    }
    if (note.day !== date) {
      setFeedback("日期和原单据还没对上。点便签旁的“原单据”再看一下。");
      return;
    }
    dispatch({ type: "PLACE", id, day: date });
    setSelected(null);
    setDay(date);
    setFeedback(`${note.text}已放到11月${date}日。`);
  }
  return (
    <>
      <p className="muted">
        先点便签，再点日期。也可以直接把便签拖到日历上。所有日期都可以试。
      </p>
      <div className="calendar-workspace">
        <Month
          day={day}
          onDay={(n) => {
            setDay(n);
            place(selected, n);
          }}
          onDrop={place}
          markers={Object.values(state.calendar).reduce(
            (counts, n) => ({ ...counts, [n]: (counts[n] || 0) + 1 }),
            {},
          )}
        >
          {day && (
            <div className="calendar-pins">
              <h4>11月{day}日</h4>
              {notes.filter((n) => state.calendar[n.id] === day).length ? (
                notes
                  .filter((n) => state.calendar[n.id] === day)
                  .map((n) => (
                    <p key={n.id}>
                      <span>{n.text}</span>
                      <strong>{n.amount}</strong>
                    </p>
                  ))
              ) : (
                <p className="muted">这天还没贴便签</p>
              )}
            </div>
          )}
        </Month>
        <div className="sticky-list">
          {notes.map((n) => (
            <div
              className={`sticky-note ${selected === n.id ? "selected" : ""} ${state.calendar[n.id] ? "placed" : ""}`}
              key={n.id}
            >
              <button
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", n.id);
                  setSelected(n.id);
                }}
                onClick={() => {
                  setSelected(n.id);
                  setFeedback("");
                }}
                aria-pressed={selected === n.id}
              >
                <span>{n.text}</span>
                <strong>{n.amount}</strong>
                <small>
                  {state.calendar[n.id]
                    ? `已贴：11月${state.calendar[n.id]}日`
                    : "点击后放到日历"}
                </small>
              </button>
              <button
                className="text-button"
                onClick={() => onSource(n.source)}
              >
                原单据
                <Icon name="caret" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      {notes.length < calendarNotes.length && (
        <p className="muted">还有便签没找到，先回新铺查看剩下的资料。</p>
      )}
      <Feedback success={placed === calendarNotes.length}>
        {placed === calendarNotes.length
          ? "付款和计划开业日期已核对。日期仍是计划，能否实现还要继续查。"
          : feedback}
      </Feedback>
      <div className="count-line">
        已贴好 {placed} / {calendarNotes.length} 张便签
      </div>
    </>
  );
}
