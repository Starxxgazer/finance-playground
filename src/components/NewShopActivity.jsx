import Evidence from "./Evidence.jsx";
import Calendar from "./Calendar.jsx";
import { byId, calendarNotes } from "../game/content.js";
import { newShopSources } from "../game/investigation.js";

export default function NewShopActivity({ id, state, dispatch }) {
  const sources = newShopSources[id];
  const current = calendarNotes.find((note) => sources.includes(note.source) && state.calendar[note.id] !== note.day);
  const primarySource = current?.source || sources[0];
  return (
    <div className="newshop-workspace simple-newshop">
      <section className="newshop-dates" aria-label="本项日期核对">
        <Calendar state={state} dispatch={dispatch} sources={sources} />
      </section>
      <section className="newshop-documents" aria-label="本项调查原件">
        <Evidence key={primarySource} id={primarySource} collapsibleSource />
        {sources.filter((source) => source !== primarySource).map((source) => (
          <details className="related-original" key={source}>
            <summary>{byId[source].title}</summary>
            <Evidence id={source} collapsibleSource />
          </details>
        ))}
      </section>
    </div>
  );
}
