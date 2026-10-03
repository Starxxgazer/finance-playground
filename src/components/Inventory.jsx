import { useRef, useState } from "react";
import { byId, findings } from "../game/content.js";
import { inventoryCategories, itemAppearance } from "../game/inventory.js";
import { Icon, Modal, Portrait, characters } from "./Ui.jsx";
import Evidence from "./Evidence.jsx";
import ItemIcon from "./ItemIcon.jsx";

export default function Inventory({ state, onClose }) {
  const [section, setSection] = useState("items");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const lastItem = useRef(null);
  const preview = useRef(null);
  const ids = state.seen.filter(
    (id) => category === "all" || itemAppearance(id).category === category,
  );
  const current = ids.includes(selected) ? selected : ids[0];
  const count = (id) =>
    state.seen.filter(
      (key) => id === "all" || itemAppearance(key).category === id,
    ).length;
  function inspect(id, button) {
    setSelected(id);
    setInspecting(true);
    lastItem.current = button;
    requestAnimationFrame(() => preview.current?.focus());
  }
  return (
    <Modal title="资料包" className="inventory-modal" onClose={onClose}>
      <div className="inventory-topline">
        <p>把带回来的东西，一件件摊开。</p>
        <span>
          <Icon name="bag" size={16} />
          已收集 {state.seen.length} 件
        </span>
      </div>
      <nav className="inventory-sections" aria-label="资料包内容">
        {[
          ["items", "随身资料", "bag"],
          ["findings", "已记发现", "notebook"],
          ["people", "人物", "people"],
        ].map(([id, label, icon]) => (
          <button
            key={id}
            aria-pressed={section === id}
            onClick={() => {
              setSection(id);
              setInspecting(false);
            }}
          >
            <Icon name={icon} size={18} />
            {label}
            {id === "findings" && <small>{state.solved.length}</small>}
          </button>
        ))}
      </nav>
      {section === "items" && (
        <div
          className={`inventory-workspace ${inspecting ? "is-inspecting" : ""}`}
        >
          <section className="inventory-storage" aria-label="已收集的物品">
            <div
              className="inventory-filters"
              role="group"
              aria-label="资料分类"
            >
              {inventoryCategories.map((cat) => (
                <button
                  key={cat.id}
                  aria-pressed={category === cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setInspecting(false);
                  }}
                >
                  {cat.label}
                  <small>{count(cat.id)}</small>
                </button>
              ))}
            </div>
            {ids.length ? (
              <div className="inventory-grid">
                {ids.map((id) => (
                  <button
                    key={id}
                    className="inventory-slot"
                    aria-label={`查看${byId[id].title}`}
                    aria-pressed={current === id}
                    onClick={(e) => inspect(id, e.currentTarget)}
                  >
                    <span className="slot-number">
                      {String(state.seen.indexOf(id) + 1).padStart(2, "0")}
                    </span>
                    <ItemIcon id={id} />
                    <strong>{byId[id].title}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="inventory-empty">
                <Icon
                  name={
                    category === "all"
                      ? "bag"
                      : inventoryCategories.find((c) => c.id === category).icon
                  }
                  size={52}
                  weight="thin"
                />
                <h3>
                  {state.seen.length
                    ? "这一格，还没有资料"
                    : "调查，从第一份资料开始"}
                </h3>
                <p>
                  {state.seen.length
                    ? "继续调查，找到的资料会自动归入这里。"
                    : "翻开现场的物品，听听人物的话，资料会留在这里。"}
                </p>
              </div>
            )}
            <p className="inventory-footnote">
              <Icon name="search" size={15} />
              选中物品，查看原话、来源与时间。
            </p>
          </section>
          <section
            ref={preview}
            tabIndex={-1}
            className="inventory-preview"
            aria-label="选中资料原件"
          >
            <button
              className="inventory-return text-button"
              onClick={() => {
                setInspecting(false);
                requestAnimationFrame(() => lastItem.current?.focus());
              }}
            >
              <Icon name="back" size={17} />
              返回物品栏
            </button>
            {current ? (
              <div className="inventory-original" key={current}>
                <div className="original-heading">
                  <ItemIcon id={current} small />
                  <span>
                    资料原件
                    <small>
                      第{" "}
                      {String(state.seen.indexOf(current) + 1).padStart(2, "0")}{" "}
                      件 · 已收集
                    </small>
                  </span>
                </div>
                <Evidence id={current} />
                <p className="original-note">
                  收进资料包，不代表已经核实。完成核对的发现另记在笔记里。
                </p>
              </div>
            ) : (
              <div className="inventory-preview-empty">
                <Icon name="search" size={32} weight="thin" />
                <p>在左侧翻开一份资料</p>
              </div>
            )}
          </section>
        </div>
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
