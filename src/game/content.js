// 本轮程序内部内容。不是队友录入规范；唯一故事设计仍为根目录《游戏设计.md》。
// 金额统一为整数元，文案明确区分事实、预测与未生效约定。
export const money = (n) => new Intl.NumberFormat("zh-CN").format(n);
export const assumption = "假设11月1日拿到贷款、新店按时开业；这些还没发生。";
const line = (id, text, canonical = id) => ({ id, text, canonical });
const doc = (id, title, nature, source, date, lines) => ({
  id,
  title,
  nature,
  source,
  date,
  lines,
});
export const evidence = [
  doc(
    "ledger",
    "柜台账本",
    "当前记录 / 未来预测",
    "陈叔提供的余额与11月经营账本",
    "10月29日查看",
    [
      line("cash", "现在可用：2万元。贷款20万元仍在申请中。"),
      line(
        "monthly",
        "11月预计经营收款20万元，日常现金支出14万元，经营结余6万元。",
        "old-month",
      ),
      line(
        "early",
        "11月1至10日：预计经营收款6万元，日常现金支出5万元。",
        "old-early",
      ),
      line("middle", "11月11至20日：预计经营收款7万元，日常现金支出5万元。"),
      line("late", "11月21至30日：预计经营收款7万元，日常现金支出4万元。"),
      line(
        "scope",
        "经营结余随经营逐步形成，不是利润；不含旧设备尾款、新店投入、贷款还款。每天具体何时收付还没查清。",
      ),
    ],
  ),
  doc(
    "schedule",
    "老店收付款安排",
    "预计发生",
    "柜台账本所附11月收付款安排",
    "10月29日查看",
    [
      line(
        "early",
        "11月1至10日：预计经营收款6万元，日常现金支出5万元。",
        "old-early",
      ),
      line("middle", "11月11至20日：预计经营收款7万元，日常现金支出5万元。"),
      line("late", "11月21至30日：预计经营收款7万元，日常现金支出4万元。"),
      line(
        "monthly",
        "全月预计经营结余6万元，随经营逐步形成，不能当作月初已有现金。",
        "old-month",
      ),
    ],
  ),
  doc(
    "debt",
    "旧设备付款清单",
    "当前付款义务",
    "烤箱旁的旧设备尾款通知",
    "10月29日查看",
    [
      line("due", "旧设备尾款10万元，11月1日到期。"),
      line("status", "目前未支付，也没有已生效的延期安排。"),
    ],
  ),
  doc(
    "receipt",
    "旧设备首款回执与约定",
    "已经发生",
    "公司付款回执及旧设备首款约定",
    "历史记录（具体日期未提供）",
    [
      line("agreed", "约定：公司向老孟支付旧设备首款6万元，按约定首款日支付。"),
      line(
        "paid",
        "回执：公司向老孟支付6万元；付款时间与约定相符，用于这台旧设备。",
      ),
    ],
  ),
  doc(
    "taste",
    "顾客的话：味道",
    "人物说法",
    "老店门口顾客，现场访谈",
    "10月29日",
    [line("comment", "“经常来买，面包好吃。”")],
  ),
  doc(
    "queue",
    "顾客的话：排队",
    "人物说法",
    "老店门口顾客，现场访谈",
    "10月29日",
    [line("comment", "“早上排队有点久。”")],
  ),
  doc(
    "contract",
    "旧设备完整合同",
    "现有约定",
    "烤箱旁的合同夹",
    "10月29日查看",
    [line("total", "总价16万元，已付首款6万元，还欠10万元，11月1日到期。")],
  ),
  doc(
    "meng-call",
    "与老孟的当面沟通",
    "人物说法 / 只是答应",
    "设备商老孟，老店门外当面沟通",
    "10月29日",
    [
      line(
        "promise",
        "老孟愿意商量，但不同意一边开新店、一边拖旧款；将提供备选安排。尚未形成生效延期。",
      ),
    ],
  ),
  doc(
    "alternative",
    "老孟签字的备选安排",
    "有条件，尚未生效",
    "老孟次日发来的签字回执",
    "10月30日收到",
    [
      line("condition", "须放弃这次新店，并在10月31日前确认。"),
      line("payments", "11月1日付2万元，11月30日付4万元，12月30日付4万元。"),
      line(
        "effective",
        "第一笔按时付，安排才生效。目前仍按原约定欠款，玩家不代陈叔决定。",
      ),
    ],
  ),
  doc(
    "transfer",
    "陈叔转入公司的旧回执",
    "已发生的转账 / 人物说法",
    "夹在旧设备首款资料中的转账回执",
    "历史记录（早于设备首款）",
    [
      line("transfer", "陈叔 → 公司：6万元；转入先于公司支付旧设备首款。"),
      line(
        "chen-claim",
        "陈叔说：买这台烤箱的第一笔钱，是从自己的积蓄里拿的。这是陈叔对来源的说法。",
      ),
    ],
  ),
  doc(
    "investment",
    "历史出资记录",
    "已经发生",
    "向陈叔索取的公司出资记录",
    "历史记录（具体日期未提供）",
    [
      line(
        "capital",
        "这6万元是陈叔投入公司的钱，不是公司向陈叔借的款；用途为旧设备首款。",
      ),
    ],
  ),
  doc(
    "capital-note",
    "旧投入去向笔记",
    "核对后的发现",
    "转账回执、出资记录与旧设备首款回执",
    "10月29日核对",
    [
      line(
        "trace",
        "陈叔 → 公司：6万元 → 老孟：旧设备首款6万元。同一笔钱转入再花出，不能当成12万元；公司现在可用仍为2万元。",
      ),
    ],
  ),
  doc("rent", "租金报价", "计划付款", "新铺门口的租赁资料", "10月29日查看", [
    line("rent", "11月1日：押金及首期租金3万元。"),
  ]),
  doc(
    "renovation",
    "装修付款安排",
    "计划付款",
    "新铺装修报价与付款安排",
    "10月29日查看",
    [
      line("first", "11月1日：装修首款3万元。"),
      line("later", "11月10日：装修验收款2万元。"),
    ],
  ),
  doc(
    "equipment",
    "新设备采购资料",
    "报价与交付条件",
    "新铺设备预留位旁的采购资料",
    "10月29日查看",
    [
      line("first", "11月1日：新设备预付6万元。"),
      line("later", "11月10日：设备余款2万元。"),
      line(
        "delivery",
        "付清余款后发货。之后还要安装；交付和安装日期需要核实。",
        "delivery",
      ),
    ],
  ),
  doc(
    "preparation",
    "人员与备货安排",
    "计划付款",
    "新铺开业筹备清单",
    "10月29日查看",
    [line("later", "11月10日：人员筹备1万元，备货试制1万元。")],
  ),
  doc(
    "budget",
    "新店付款预算汇总",
    "计划付款",
    "租金、装修、设备和筹备资料汇总",
    "10月29日整理",
    [
      line(
        "first",
        "11月1日：租金押金3＋装修首款3＋设备预付6，共12万元。",
        "new-first",
      ),
      line(
        "later",
        "11月10日：装修验收2＋设备余款2＋人员筹备1＋备货试制1，共6万元。",
        "new-later",
      ),
      line(
        "total",
        "开业前两批付款共18万元。设备预付款与余款均已包含，不重复计算。",
      ),
    ],
  ),
  doc("lease", "房东留铺说明", "尚未签约", "房东留铺说明", "10月29日查看", [
    line("hold", "房东只留到10月31日，目前还没签约。"),
  ]),
  doc(
    "opening",
    "计划开业说明",
    "计划，尚未实现",
    "陈叔与小禾的新店筹备计划",
    "10月29日查看",
    [
      line(
        "target",
        "目标11月15日开业。设备付清余款才发货，之后还要安装、安排人员、办好新址手续。",
      ),
    ],
  ),
  doc(
    "forecast",
    "新店经营预测",
    "有条件的预计发生",
    "新店11月15至30日经营预测",
    "10月29日查看",
    [
      line(
        "net",
        "如果按时开业，11月15至30日预计经营收款6万元，日常现金支出4万元，经营结余2万元；需要在开业后逐步形成。",
      ),
    ],
  ),
  doc(
    "survey",
    "小禾的访谈本",
    "访谈记录",
    "小禾访问的20位老店常客",
    "10月29日查看",
    [
      line(
        "sample",
        "共访问20位老店常客，其中8位更想去新铺。所有受访者都是老店常客。",
      ),
    ],
  ),
  doc(
    "survey-note",
    "客源核对笔记",
    "核对后的发现",
    "小禾访谈本及追问",
    "10月29日",
    [
      line(
        "result",
        "有些老客可能换一家店买，不能把新店客人全算成新增。20人的回答不能直接换成销售额；新客从哪里来还要查。",
      ),
    ],
  ),
  doc("wish", "小禾想试着负责什么", "人物说法", "与小禾的聊天", "10月29日", [
    line("wish", "“我想试着带一班。”有带班意愿，不代表已经能独立开店。"),
  ]),
  doc("talk", "小禾与陈叔聊过吗", "人物说法", "与小禾的聊天", "10月29日", [
    line("talk", "具体带班安排还没定，需要再和陈叔商量。"),
  ]),
  doc(
    "calculation",
    "陈叔的计算表",
    "假设条件下的试算",
    "陈叔在打烊后的资金桌提供",
    "10月29日晚",
    [
      line("assumption", assumption),
      line(
        "initial",
        "11月1日首批付款后：2＋20－10－12＝0（万元）。",
        "initial",
      ),
      line("month", "月底：0＋6－6＋2－1.8＝0.2万元，即预计现金余额2,000元。"),
      line(
        "repayment",
        "11月30日首期本息1.8万元是本故事的试算条件。旧出资已花出，备选分期未生效，均不能加到表中。",
      ),
    ],
  ),
  doc(
    "proof-record",
    "资金桌举证记录",
    "核对后的发现",
    "玩家选定日期及两份资料中的原始条目",
    "10月29日晚",
    [
      line(
        "result",
        "按月初付完剩0元算，11月10日：0＋1－6＝－5万元。只说明按原计划估算的付款缺口，不是已发生的账户负余额。",
      ),
    ],
  ),
  doc(
    "risk-note",
    "昨晚的风险笔记",
    "核对后的发现",
    "陈叔计算表、缺口依据与设备发货条件",
    "10月29日晚",
    [
      line(
        "result",
        "按原计划，月末预计现金余额2,000元，11月10日却先缺5万元；开业收款还得等前面的付款和设备到位。",
      ),
      line(
        "questions",
        "还要问：十号差的5万元怎么补？设备付清后哪天送到、装好？人员、手续和开业时间能否赶上？",
      ),
    ],
  ),
];
export const byId = Object.fromEntries(evidence.map((d) => [d.id, d]));
// The first-scene tutorial and exit gate use the same required investigations.
// Optional conversations and the historical-receipt branch never replace them.
export const oldMainTasks = ["ledger", "debt", "receipt"];
export const oldRequired = ["ledger", "schedule", "debt", "receipt"];
export const newRequired = [
  "rent",
  "renovation",
  "equipment",
  "preparation",
  "budget",
  "lease",
  "opening",
  "forecast",
];
export const calendarNotes = [
  {
    id: "rent",
    text: "押金及首期租金",
    amount: "3万元",
    day: 1,
    source: "rent",
  },
  {
    id: "decor-first",
    text: "装修首款",
    amount: "3万元",
    day: 1,
    source: "renovation",
  },
  {
    id: "equipment-first",
    text: "设备预付",
    amount: "6万元",
    day: 1,
    source: "equipment",
  },
  {
    id: "decor-last",
    text: "装修验收",
    amount: "2万元",
    day: 10,
    source: "renovation",
  },
  {
    id: "equipment-last",
    text: "设备余款",
    amount: "2万元",
    day: 10,
    source: "equipment",
  },
  {
    id: "staff",
    text: "人员筹备",
    amount: "1万元",
    day: 10,
    source: "preparation",
  },
  {
    id: "stock",
    text: "备货试制",
    amount: "1万元",
    day: 10,
    source: "preparation",
  },
  {
    id: "open",
    text: "计划开业",
    amount: "日期尚待落实",
    day: 15,
    source: "opening",
  },
];
export const findings = [
  {
    id: "finance",
    title: "现在的钱与预计的钱",
    correct: "现在可用2万元，11月预计经营结余6万元，需要随经营逐步形成。",
    wrong: "11月预计剩6万元，所以今天一共有8万元可用。",
    question: "经营收款和日常现金支出能否按计划发生？",
    sources: ["ledger", "schedule"],
  },
  {
    id: "credit",
    title: "已经付了与还没付",
    correct: "这笔旧首款按时付了，尾款还没安排好。",
    wrong: "过去按时付过钱，这次尾款也一定能付上。",
    question: "尾款从哪里出，是否有已生效的新约定？",
    sources: ["debt", "receipt"],
  },
  {
    id: "reputation",
    title: "老店的口碑",
    correct: "有人喜欢老店，新店客人还要查。",
    wrong: "生意好、有人排队，所以钱够用，新店也一定有人来。",
    question: "新店客人是否够多？",
    sources: ["taste", "queue"],
  },
  {
    id: "risk",
    title: "钱与时间能不能接上",
    correct: byId["risk-note"].lines[0].text,
    question: "缺的钱怎么补，交付和开业时间能否赶上？",
    sources: ["calculation", "proof-record", "equipment", "risk-note"],
  },
];
export const chain = [
  { id: "pay", label: "付设备余款" },
  { id: "deliver", label: "发货安装" },
  { id: "open", label: "开门营业" },
  { id: "receive", label: "收到营业款" },
];
export const scenes = [
  {
    id: "bakery",
    title: "老店",
    place: "留灯烘焙",
    time: "10月29日 上午",
    heading: "热闹的生意，账上是什么样？",
    task: "核对现在的钱和已付、未付的单据。",
    person: "lin",
    quote: "看看这家店的20万元贷款申请。哪些事查清了，哪些还得问，回来告诉我。",
    next: "前往新铺",
  },
  {
    id: "newshop",
    title: "新铺",
    place: "街角的新铺",
    time: "10月29日 下午",
    heading: "还没开门，哪些钱要先付？",
    task: "看看新铺的钱要在哪些日子付出去。",
    person: "xiaohe",
    quote: "邀请函做好了，日期还没敢填。",
    next: "等打烊，一起看账",
  },
  {
    id: "desk",
    title: "资金桌",
    place: "打烊后的老店",
    time: "10月29日 晚",
    heading: "钱，能接得上吗？",
    task: "点“开始核对资金”，看看付款时钱够不够。",
    person: "chen",
    quote: "照这个算，月底还能剩两千。你帮我们看看，中间接不接得上。",
    next: "次日去见林姐",
  },
  {
    id: "bank",
    title: "林姐办公室",
    place: "银行调查小组",
    time: "10月30日 上午",
    heading: "带着依据，回来交接。",
    task: "昨晚的笔记和单据都在这里，也可以返回补查。",
    person: "lin",
    quote: "昨晚看出什么问题了？把你的发现和资料给我看看。",
    next: "查看小禾的消息",
  },
];
export const films = scenes.map((scene, i) => ({
  id: i,
  clips: (i === 0 ? ["intro", scene.id] : [scene.id]).map((id) => ({
    id,
    src: `videos/${id}.mp4`,
    poster: `videos/${id}-poster.webp`,
  })),
  captions: "",
  image: scene.id,
  title: ["排队的面包店", "一间还空着的新铺", "打烊以后", "带回你的发现"][i],
  text: [
    "一家排长队的面包店，想借20万元开新店。今天，你跟着林姐做第一次企业调查。",
    "陈叔带你来到新铺。墙还是空的，邀请函上的日期也是。",
    "你、陈叔和小禾回到老店。小禾拿出邀请函，笔停在日期栏旁：“这回能写十五号了吗？”",
    "次日早上，你带着昨晚的笔记和单据，回到林姐的办公室。",
  ][i],
}));
export const dimensions = [
  {
    id: "finance",
    label: "财务",
    sources: ["ledger", "schedule", "transfer", "investment", "capital-note"],
    optional: ["transfer", "investment", "capital-note"],
  },
  {
    id: "credit",
    label: "信用",
    sources: ["receipt", "debt", "contract", "meng-call", "alternative"],
    optional: ["contract", "meng-call", "alternative"],
  },
  {
    id: "risk",
    label: "风险",
    sources: [...newRequired, "calculation", "proof-record", "risk-note"],
    optional: [],
  },
  {
    id: "reputation",
    label: "口碑与经营",
    sources: ["taste", "queue", "survey", "survey-note", "wish", "talk"],
    optional: ["survey", "survey-note", "wish", "talk"],
  },
];
