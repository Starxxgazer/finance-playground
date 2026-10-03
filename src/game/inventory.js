// Presentation only: physical filing categories never unlock findings or evidence.
export const inventoryCategories = [
  { id: "accounts", label: "账本测算", icon: "book" },
  { id: "papers", label: "合同单据", icon: "folder" },
  { id: "voices", label: "人物记录", icon: "chat" },
  { id: "notes", label: "调查笔记", icon: "notebook" },
];

const item = (category, icon, shape, label) => ({
  category,
  icon,
  shape,
  label,
});
export const inventoryItems = {
  ledger: item("accounts", "book", "book", "账本"),
  schedule: item("accounts", "calendar", "sheet", "收付表"),
  debt: item("papers", "clipboardBlank", "receipt", "尾款单"),
  receipt: item("papers", "receipt", "receipt", "首款回执"),
  taste: item("voices", "bread", "slip", "味道访谈"),
  queue: item("voices", "timer", "slip", "排队访谈"),
  contract: item("papers", "folder", "folder", "完整合同"),
  "meng-call": item("voices", "conversation", "slip", "当面沟通"),
  alternative: item("papers", "signature", "folder", "备选安排"),
  transfer: item("papers", "transfer", "receipt", "转账回执"),
  investment: item("papers", "coins", "sheet", "出资记录"),
  "capital-note": item("notes", "trace", "note", "投入去向"),
  rent: item("papers", "key", "sheet", "租金报价"),
  renovation: item("papers", "paint", "sheet", "装修安排"),
  equipment: item("papers", "oven", "folder", "设备采购"),
  preparation: item("papers", "people", "sheet", "人员备货"),
  budget: item("accounts", "stack", "book", "付款预算"),
  lease: item("papers", "shop", "slip", "留铺说明"),
  opening: item("papers", "calendarCheck", "slip", "开业计划"),
  forecast: item("accounts", "forecast", "book", "经营预测"),
  survey: item("voices", "addressBook", "book", "访谈本"),
  "survey-note": item("notes", "survey", "note", "客源笔记"),
  wish: item("voices", "person", "slip", "带班心愿"),
  talk: item("voices", "conversation", "slip", "带班商量"),
  calculation: item("accounts", "calculator", "sheet", "计算表"),
  "proof-record": item("notes", "proof", "note", "举证记录"),
  "risk-note": item("notes", "risk", "note", "风险笔记"),
};

export function itemAppearance(id) {
  return inventoryItems[id] || item("papers", "file", "sheet", "资料");
}
