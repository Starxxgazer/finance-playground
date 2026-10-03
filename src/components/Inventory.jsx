import { useRef, useState } from "react";
import { byId, evidence, findings } from "../game/content.js";
import { inventoryCategories, itemAppearance } from "../game/inventory.js";
import { Icon, Modal, Portrait, characters } from "./Ui.jsx";
import Evidence from "./Evidence.jsx";
import ItemIcon from "./ItemIcon.jsx";

export default function Inventory({ state, onClose, initialSection = "items", initialSelected = null }) {
  const [section, setSection] = useState(initialSection);
  const [selected, setSelected] = useState(initialSelected);
  const lastItem = useRef(null);
  const board = useRef(null);
  const preview = useRef(null);
  const collected = selected && state.seen.includes(selected);
  function moveFocus(target) {
    const previous = document.activeElement;
    requestAnimationFrame(() => {
      // A click or Tab on another control takes priority over deferred focus.
      if (
        document.activeElement === previous ||
        document.activeElement === document.body
      ) {
        target()?.focus();
      }
    });
  }
  function inspect(id) {
    setSelected(id);
    lastItem.current = id;
    moveFocus(() => preview.current);
  }
  function returnToBoard() {
    setSelected(null);
    moveFocus(() =>
      board.current?.querySelector(`[data-item-id="${lastItem.current}"]`),
    );
  }
  return (
    <Modal
      title="资料包"
      className={`inventory-modal ${selected ? "inventory-detail-modal" : ""}`}
      onClose={onClose}
    >
      <nav className="inventory-sections" aria-label="资料包内容">
        {[
          ["items", "随身资料"],
          ["findings", "已记发现"],
          ["people", "人物"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={section === id}
            onClick={() => {
              setSection(id);
              setSelected(null);
            }}
          >
            {label}
            {id === "findings" && <small>{state.solved.length}</small>}
          </button>
        ))}
        <span
          className="inventory-total"
          aria-label={`已收集 ${state.seen.length} 份，共 ${evidence.length} 份`}
        >
          <small>归档</small>
          {state.seen.length}
          <i>/</i>
          {evidence.length}
        </span>
      </nav>
      {section === "items" && !selected && (
        <section
          ref={board}
          className="inventory-board"
          aria-label="调查物品栏"
        >
          {[
            ["accounts", "voices"],
            ["papers", "notes"],
          ].map((categories, column) => (
            <div
              className={`inventory-column inventory-column-${column}`}
              key={column}
            >
              {categories.map((categoryId) => {
                const category = inventoryCategories.find(
                  (item) => item.id === categoryId,
                );
                const ids = evidence
                  .filter(
                    (item) => itemAppearance(item.id).category === category.id,
                  )
                  .map((item) => item.id);
                const count = ids.filter((id) =>
                  state.seen.includes(id),
                ).length;
                return (
                  <section
                    className={`inventory-group inventory-group-${category.id}`}
                    key={category.id}
                    aria-label={category.label}
                  >
                    <h3 className="inventory-group-label">
                      <span>{category.label}</span>
                      <small>
                        {count} / {ids.length}
                      </small>
                    </h3>
                    <div className="inventory-grid">
                      {ids.map((id) => {
                        const seen = state.seen.includes(id);
                        return (
                          <button
                            key={id}
                            data-item-id={id}
                            className={`inventory-slot ${seen ? "is-collected" : "is-uncollected"}`}
                            aria-label={`${seen ? "查看" : "未收集："}${byId[id].title}`}
                            title={`${byId[id].title}${seen ? "" : " · 未收集"}`}
                            onClick={() => inspect(id)}
                          >
                            <ItemIcon id={id} />
                            <strong>{itemAppearance(id).label}</strong>
                            <span className="slot-status" aria-hidden="true">{seen && <Icon name="check" size={10} />}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ))}
          <p className="inventory-footnote">轻触物件翻阅 · 灰暗位置等待收集</p>
        </section>
      )}
      {section === "items" && selected && (
        <section
          ref={preview}
          tabIndex={-1}
          className="inventory-preview"
          aria-label="选中资料原件"
        >
          <button
            className="inventory-return text-button"
            onClick={returnToBoard}
          >
            <Icon name="back" size={17} />
            返回物品栏
          </button>
          {collected ? (
            <div className="inventory-original" key={selected}>
              <div className="original-heading">
                <ItemIcon id={selected} small />
                <span>
                  资料原件<small>已收集 · 可回看</small>
                </span>
              </div>
              <Evidence id={selected} />
              <p className="original-note">
                收进资料包，不代表已经核实。完成核对的发现另记在笔记里。
              </p>
            </div>
          ) : (
            <div className="inventory-uncollected-detail">
              <ItemIcon id={selected} />
              <h3>{byId[selected].title}</h3>
              <p>尚未收集</p>
              <small>找到这份资料后，就能在这里翻阅。</small>
            </div>
          )}
        </section>
      )}
      {section === "findings" && (
        <section className="inventory-findings" aria-label="已经确认的发现">
          {state.solved.length ? (
            findings
              .filter((f) => state.solved.includes(f.id))
              .map((f) => (
                <article className="inventory-note" key={f.id}>
                  <span className="stamp">
                    <Icon name="check" size={14} />
                    核对后记下
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.correct}</p>
                  <p className="open-question">还要问：{f.question}</p>
                </article>
              ))
          ) : (
            <div className="inventory-empty">
              <Icon name="notebook" size={48} weight="thin" />
              <h3>笔记还没落笔</h3>
              <p>在现场完成核对后，有依据的发现会留在这里。</p>
            </div>
          )}
        </section>
      )}
      {section === "people" && (
        <div className="inventory-people">
          {Object.entries(characters).map(([id, person]) => (
            <div key={id}>
              <Portrait person={id} large />
              <h3>{person.name}</h3>
              <p>{person.role}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
