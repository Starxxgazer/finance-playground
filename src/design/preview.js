import { initialState, reducer } from "../game/state.js";
import { calendarNotes } from "../game/content.js";

export const directions = [
  { id: "cinema", letter: "A", name: "街角电影", description: "大留白 · 宋体字幕 · 暖白细线", note: "让现场成为主角。文字轻轻浮在画面上，资料像电影里的特写。" },
  { id: "notebook", letter: "B", name: "铅笔手记", description: "手写标题 · 透光纸面 · 铅笔批注", note: "像带着一本调查手记。资料、选择与核对，都延续纸与笔的质感。" },
  { id: "archive", letter: "C", name: "夜访档案", description: "清晰黑体 · 冷绿标记 · 克制网格", note: "更冷静的调查视角。用规整的网格和明确的标记区分资料与判断。" },
];

export const surfaces = [
  ["cover", "开场", "场景"], ["old", "老店现场", "场景"], ["new", "新铺现场", "场景"],
  ["ledger", "账本核对", "调查"], ["debt", "付款核对", "调查"], ["receipt", "回执核对", "调查"],
  ["conversation", "当面对话", "调查"], ["survey", "走访记录", "调查"], ["invitation", "窗边交谈", "调查"],
  ["bag", "资料包", "资料"], ["document", "资料详情", "资料"], ["uncollected", "未收集资料", "资料"],
  ["people", "人物记录", "资料"], ["findings", "已记发现", "资料"], ["notes", "当前手记", "资料"],
  ["calendar", "付款日历", "资金"], ["money", "月初分类", "资金"], ["date", "寻找日期", "资金"],
  ["proof", "引用依据", "资金"], ["order", "收付顺序", "资金"],
  ["handover", "交接资料", "结尾"], ["company", "公司透视", "结尾"], ["ending", "邀请函结尾", "结尾"],
  ["settings", "游戏设置", "通用"],
];

export function installTheme(id) {
  const apply = value => {
    document.documentElement.dataset.ui = directions.some(d => d.id === value) ? value : "cinema";
  };
  apply(id);
  document.title = "账面之下 · 界面试览";
  window.addEventListener("message", event => {
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === "ui-direction") apply(event.data.variant);
  });
  if (window.parent !== window) window.parent.postMessage({ type: "ui-ready" }, location.origin);
}

// Build every example by playing the actual reducer, including all payment,
// date, independent-source and handover gates. No fabricated financial state.
export function makePreview(surface) {
  let state = structuredClone(initialState);
  const act = (...actions) => { state = actions.reduce(reducer, state); };
  const read = id => ({ type: "READ", id });
  if (surface === "cover") return { state };
  act({ type: "FILM", index: 0 });
  if (surface === "old") return { state };
  if (["ledger", "debt", "receipt"].includes(surface)) { act(read(surface)); return { state, active: surface }; }
  if (surface === "conversation") { act(read("contract")); return { state, active: "contract" }; }
  act(...["ledger", "debt", "receipt"].map(read),
    { type: "CLASSIFY", id: "ledger", cash: "now", net: "forecast" },
    { type: "CLASSIFY", id: "debt", day: 1, status: "unpaid" },
    { type: "CLASSIFY", id: "receipt", amount: true, date: true, status: "paid" });
  if (surface === "notes") return { state, clues: true };
  act(read("contract"), { type: "CONTACT_MENG" }, { type: "ADVANCE" }, { type: "FILM", index: 1 });
  if (surface === "new") return { state };
  if (surface === "invitation") return { state, active: "invitation" };
  if (surface === "survey") { act(read("survey")); return { state, active: "survey" }; }
  act(...["rent", "renovation", "equipment", "preparation"].map(read));
  if (surface === "calendar") return { state, active: "calendar" };
  if (["bag", "document", "uncollected", "people", "findings"].includes(surface)) return {
    state, bag: true,
    bagSection: ["people", "findings"].includes(surface) ? surface : "items",
    bagItem: surface === "document" ? "ledger" : surface === "uncollected" ? "survey" : null,
  };
  if (surface === "settings") return { state, settings: true };
  act(...calendarNotes.map(n => ({ type: "PLACE", id: n.id, day: n.day })),
    { type: "ADVANCE" }, { type: "FILM", index: 2 }, read("calculation"));
  if (surface === "money") return { state, workOpen: true };
  act(...["cash", "loan", "oldDebt", "startup"].map(id => ({ type: "INITIAL_PLACE", id, side: ["cash", "loan"].includes(id) ? "available" : "payment" })), { type: "INITIAL" });
  if (surface === "date") return { state, workOpen: true };
  act({ type: "DAY", day: 10 });
  if (surface === "proof") return { state, workOpen: true };
  const refs = [{ doc: "ledger", line: "early" }, { doc: "budget", line: "later" }];
  act({ type: "REFS", refs }, { type: "CALCULATE" }, { type: "EXPLAIN", ref: refs[0] });
  if (surface === "order") return { state, workOpen: true };
  act({ type: "ORDER", order: ["pay", "deliver", "open", "receive"] },
    { type: "CONDITION", ref: { doc: "equipment", line: "delivery" } },
    { type: "CHECK_CHAIN" }, { type: "SAVE_RISK" },
    { type: "ADVANCE" }, { type: "FILM", index: 3 });
  if (surface === "handover") return { state, workOpen: true };
  act({ type: "SUBMIT" });
  if (surface === "company") return { state, workOpen: true };
  if (surface === "ending") { act({ type: "END" }); return { state }; }
  return { state: structuredClone(initialState) };
}
