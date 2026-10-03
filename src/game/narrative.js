// Presentation only: no answers, evidence collection or reducer actions.
export const mission = {
  identity: "你是一名刚入职银行的新员工，今天要做第一次企业调查。",
  chapter: "第一章 · 排队的面包店",
  premise: "留灯烘焙的陈叔想借20万元开新店。老店门外排着队，但生意热闹，钱就一定够用吗？",
  people: "林姐是带教你的银行前辈，负责复核。小禾在店里帮忙，也是你的朋友；这层关系，你已向林姐说明。",
  task: "你去看原件、问情况，把查清的事和没查清的问题带回来。贷款还在申请中，你不负责决定批不批。",
};

export const fieldTools = [
  { id: "bag", name: "资料包（档案袋）", image: "ui/satchel.webp", text: "点右上角的包。看过的单据和谈话会自动收进去，随时能再翻；灰色格子是还没拿到的资料。" },
  { id: "file", name: "原件", image: "items/receipt.webp", text: "就是账本、合同和回执本身。先读上面写的内容，再点旁边的答案；打开过，不代表核对正确。" },
  { id: "calendar", name: "付款日历", icon: "calendar", text: "到新铺后使用。先看当前问哪笔钱，再从原件找日期，点日历上那一天；选错可以改。" },
  { id: "notes", name: "调查手记", image: "items/proof-record.webp", text: "核对正确后自动记下发现和待查问题，放进资料包。最后要亲手点“交给林姐”，她才会接收。" },
];

export const sceneBriefs = [
  "上午，先到老店。点柜台账本、付款清单、首款回执，按原件核对。三项主线查完就能去新铺；顾客和支线想看再看，做到一半也不拦路。",
  "下午，陈叔带你到还空着的新铺。查看租金、装修、设备和筹备资料，把八项计划日期对到日历上。计划开业，不等于一定能按时开业。",
  "打烊后，你和陈叔、小禾把资料摊上桌。分清哪些钱可用、哪些钱要付，再找日期和两条不同的原始依据；算术由系统完成。预测和假设到账都不是已经拿到的钱。",
  "次日上午，回银行向林姐交接。把已收集资料、核对过的发现和待查问题一起交给她。她接收后才出现公司透视图；完成调查不等于贷款获批。",
];

// Seconds on the actual video clock: pausing/loading never advances a caption.
export const filmNarration = {
  intro: [
    { at: 0, title: "你的身份 · 银行新人", text: "你刚入职银行。今天，要做第一次企业调查。" },
    { at: 4.6, title: "带教人 · 林姐", text: "林姐交来一份申请：留灯烘焙想借20万元开新店。" },
    { at: 9.4, title: "这次要查什么", text: "生意怎么样？钱够不够？老板的计划有没有漏算？" },
    { at: 14.1, title: "你和小禾", text: "店里的小禾是你的朋友。这层关系，已向林姐说明。" },
    { at: 18.8, title: "带回证据，再谈判断", text: "你负责调查，林姐负责复核。贷款还没批准。" },
  ],
  bakery: [
    { at: 0, title: "第一章 · 排队的面包店", text: "陈叔的老店正排着队。热闹背后，账要从头看。" },
    { at: 3.9, title: "随身道具 · 资料包", text: "看过的原件自动装进右上角的包，随时可以翻。", tool: "bag" },
    { at: 7.8, title: "随身道具 · 日历与手记", text: "日历用来对日期；核对成功，手记才记下发现。", tool: "calendar" },
  ],
  newshop: [
    { at: 0, title: "下午 · 还空着的新铺", text: "陈叔带你来看新店。开门前，哪些钱要先付？" },
    { at: 4, title: "拿出付款日历", text: "从原件找日期，再点日历。开业时间仍是计划。", tool: "calendar" },
  ],
  desk: [
    { at: 0, title: "打烊后 · 一起摊开账", text: "你和陈叔、小禾坐下来：收钱与付钱，谁先谁后？" },
    { at: 3.9, title: "先分清，再核对", text: "先分“可用”和“要付”，再拿原件找日期、对依据。", tool: "file" },
    { at: 7.8, title: "不用心算", text: "算术交给系统。预计的钱，不能当作已经到账。" },
  ],
  bank: [
    { at: 0, title: "次日上午 · 回到银行", text: "林姐等你交接：哪些查清了，哪些还得问？" },
    { at: 3.7, title: "把资料亲手交给林姐", text: "带上原件与手记。完成调查，不等于批准贷款。", tool: "notes" },
  ],
};

export function narrationAt(id, seconds) {
  return filmNarration[id]?.findLast(cue => seconds >= cue.at) || filmNarration[id]?.[0];
}
