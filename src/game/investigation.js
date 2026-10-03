import { calendarNotes } from "./content.js";

export const newShopSources = {
  rent: ["rent", "lease"],
  renovation: ["renovation"],
  equipment: ["equipment"],
  preparation: ["preparation", "opening", "forecast"],
};

export function investigationDone(state, id) {
  if (Object.hasOwn(state.tasks, id)) return state.tasks[id];
  if (newShopSources[id]) {
    const sources = newShopSources[id];
    return sources.every((source) => state.seen.includes(source)) &&
      calendarNotes.filter((note) => sources.includes(note.source))
        .every((note) => state.calendar[note.id] === note.day);
  }
  if (id === "calendar")
    return calendarNotes.every((note) => state.calendar[note.id] === note.day);
  if (id === "customer") return state.solved.includes("reputation");
  if (id === "contract") return state.branches.aRequested;
  if (id === "transfer") return state.branches.b;
  if (id === "survey") return state.branches.c;
  if (id === "invitation") return ["wish", "talk"].every((key) => state.seen.includes(key));
  if (id === "workbench") return state.scene === 2 && state.funds.noted;
  return false;
}

export function completionMessage(id) {
  const messages = {
    ledger: "已核对：现在可用2万元；11月预计结余6万元，随经营逐步形成。",
    debt: "已核对：尾款10万元，11月1日到期；延期未生效。",
    receipt: "已核对：首款6万元按约付清，不能再算作现金。",
    contract: "已追问备选安排，次日收回执；当前尾款约定仍有效。",
    transfer: "旧投入6万元已付设备首款；现在余额仍为2万元。",
    survey: "8位是老客，不能算新增，也不能直接换成销售额。",
    invitation: "小禾有带班意愿，具体安排还要商量；开业日期仍待确认。",
    calendar: "付款与计划开业日期已核对，能否按计划实现还要继续查。",
    workbench: "已记下：按原计划，11月10日预计缺5万元；补款和开业仍待核实。",
  };
  if (id === "customer") return "顾客说法与口碑发现已记下。";
  return messages[id] || "日期已核对，原件已收好；付款与开业仍是计划。";
}
