import { FACTS, formatMoney } from './model.js';

const money = (amount) => `${formatMoney(amount)} 万元`;

// Story and numerical basis: 这笔钱借给谁_第一章故事重设计草案.md.
// Eight separately inspectable source documents. All people and firms are fictional.
export const DOCUMENTS = {
  application: {
    id: 'application',
    title: '贷款申请与走访备注',
    source: '留灯烘焙 · 陈叔提供；调查助理记录现场',
    kind: '申请 / 演算假设 / 现场观察',
    summary: '这是一份申请，不是一笔已经到账的钱。',
    lines: [
      { label: '申请人', value: '留灯烘焙', note: '虚构社区烘焙公司，目前经营一家老店。' },
      { label: '申请金额', value: money(FACTS.loan), note: '申请中，尚未批准；用于老店设备尾款与新店首期投入。' },
      { label: '到账假设', value: '明天付款前', note: '仅为原方案演算条件；没有获批或到账事实。' },
      { label: '走访备注', value: '初次走访时 · 调查助理记录', note: '顾客排队购买，陈叔与小禾持续备货。仅说明当时的现场情况，不能证明新店一定成功。' },
      { label: '资料授权', value: '本公司经营与设备款', note: '陈叔同意提供本公司资料，并授权向老孟核对本公司的设备款。' },
    ],
    note: '贷款到账不属于经营收入。演算中用到申请金额，不等于审批结论。',
  },
  repayment: {
    id: 'repayment',
    title: '还款条件示例',
    source: '银行调查组 · 本案例演算条件',
    kind: '演算假设 / 非审批结果',
    summary: '先看清借来的钱何时要还，再计算未来可用的钱。',
    lines: [
      { label: '对应申请', value: money(FACTS.loan), note: '对应留灯烘焙的原贷款申请，尚未批准。' },
      { label: '首期还款', value: money(FACTS.repayment), note: '案例固定的首期还款额，不要求玩家计算利率。' },
      { label: '演算期限', value: '未来 30 天内', note: '假设贷款按时到账并执行原方案，计入本期现金支出。' },
      { label: '条件性质', value: '仅用于本案例演算', note: '不是正式放款承诺，也不代表贷款已获批准或到账。' },
    ],
    note: '本章只演算未来 30 天，不能据此断言整个贷款期限内都能偿还。',
  },
  account: {
    id: 'account',
    title: '公司账户余额快照',
    source: '留灯烘焙 · 陈叔出示的当日账户记录',
    kind: '已发生的记录',
    summary: '眼下能用于付款的，是已到账的余额。',
    lines: [
      { label: '所属公司', value: '留灯烘焙', note: '本案例使用公司可用现金，不收集个人账户或资产。' },
      { label: '记录时点', value: '调查当日', note: '当前余额快照，不是未来一个月的收款预算。' },
      { label: '当前可用现金', value: money(FACTS.cash), note: '已到账；可以纳入眼下的付款安排。' },
      { label: '历史付款', value: '已反映在余额内', note: '已经付出的烤箱前期款不应再次从这份余额中扣除。' },
    ],
    note: '柜台上的热闹与账户里的余额，回答的是不同问题。',
  },
  operations: {
    id: 'operations',
    title: '老店经营记录与预算',
    source: '留灯烘焙老店 · 陈叔出示，小禾协助核对',
    kind: '经营记录 / 未来 30 天预测',
    summary: '预计能留下的钱，仍需要经过未来的经营。',
    lines: [
      { label: '记录页', value: '收银、备货与排队记录', note: '有顾客等候后离开，老店空间和产能有限；不能据此保证新店需求。' },
      { label: '预算期间', value: '从今天起的未来 30 天', note: '以下金额为预测，尚未发生或到账。' },
      { label: '预计实际收款', value: money(FACTS.receipts), note: '老店预计收到的经营款项，不是当前现金。' },
      { label: '日常现金支出', value: money(FACTS.operating), note: '同期预计支出；不含烤箱尾款、新店投入、筹备支出与贷款还款。' },
      { label: '预计经营现金净流入', value: money(FACTS.receipts - FACTS.operating), note: '预计收款减日常现金支出；不是净利润，也不是眼下已经到账的钱。' },
    ],
    note: '这是一份期间预算，没有逐日收付款资料；不能保证期间内每一天都付得出钱。',
  },
  contract: {
    id: 'contract',
    title: '烤箱合同 · 尾款约定',
    source: '设备供应商服务点 · 老孟经授权出示',
    kind: '合同约定 / 到期通知',
    summary: '设备已在老店工作，付款责任仍在。',
    lines: [
      { label: '设备所属', value: '留灯烘焙老店', note: '烤箱已投入使用，不是准备为新店购买的设备。' },
      { label: '本期尾款', value: money(FACTS.oven), note: '合同约定的剩余款项，不含已结清的前期付款。' },
      { label: '付款期限', value: '明天到期', note: '到期通知与合同付款节点一致。' },
      { label: '延期安排', value: '未确认', note: '目前没有供应商已经同意延期的书面安排。' },
    ],
    note: '合同确认应付责任；是否已经支付，还需要与付款记录对照。',
  },
  payments: {
    id: 'payments',
    title: '设备款收款核对页',
    source: '设备供应商服务点 · 老孟提供的本公司款项记录',
    kind: '已发生的记录',
    summary: '过去按时付款，不代表这一笔已经结清。',
    lines: [
      { label: '核对对象', value: '留灯烘焙老店烤箱', note: '与尾款合同属于同一台设备、同一家公司。' },
      { label: '前期付款阶段', value: '已收讫、已结清', note: '历史支付已计入当前账户余额，不重复扣减。' },
      { label: '本期尾款阶段', value: `${money(FACTS.oven)} · 未支付`, note: '截至本次核对，供应商尚未收到这笔尾款。' },
      { label: '对应付款期限', value: '明天', note: '按照现有合同执行；暂无已确认延期。' },
    ],
    note: '仅核对留灯烘焙自身款项，不展示其他客户或私人账户信息。',
  },
  budget: {
    id: 'budget',
    title: '新店投入与筹备预算',
    source: '留灯烘焙 · 陈叔提供的待签约方案',
    kind: '未启动的计划 / 支出预测',
    summary: '签约时的一笔钱，只是开店支出的开始。',
    lines: [
      { label: '当前状态', value: '尚未签约、尚未付款', note: '新店方案仍可由陈叔决定是否启动。' },
      { label: '原计划首期投入', value: money(FACTS.initial), note: '计划明天签约时支付；与筹备期的后续支出分开。' },
      { label: '筹备期间另需', value: money(FACTS.preparation), note: '未来 30 天另行发生的预计支出；不包含在首期投入或老店日常支出内。' },
      { label: '合计新增支出', value: money(FACTS.initial + FACTS.preparation), note: '属于原扩张方案；暂缓尚未签约的新店后，这两项不按原计划启动。' },
    ],
    note: '暂缓新店能减少新增支出，但不能取消老店已经存在的烤箱尾款责任。',
  },
  schedule: {
    id: 'schedule',
    title: '新店开业排期',
    source: '留灯烘焙 · 陈叔提供，小禾说明现场安排',
    kind: '筹备计划 / 演算假设',
    summary: '邀请函的日期，仍要等准备工作完成。',
    lines: [
      { label: '明天', value: '原计划签约并付首期投入', note: '尚未发生；只有方案启动才进入后续筹备。' },
      { label: '未来 30 天', value: '施工、安装与筹备', note: '这段时间仍需付款，新店尚不能提供收款支持。' },
      { label: '预计具备营业条件', value: '30 天后', note: '属于计划，不保证当天开业，也不保证开业后立刻赚到钱。' },
      { label: '本期新店收款', value: money(FACTS.newReceipts), note: '本章按排期对未来 30 天作出的演算假设。' },
    ],
    note: '新店将来的收款，不能提前填进开业之前的付款位置。',
  },
};

export const SCENES = {
  bakery: {
    id: 'bakery',
    name: '留灯烘焙 · 老店',
    time: '雨后傍晚 · 面包刚出炉',
    question: '顾客这么多，公司现在能拿出多少钱？',
    intro: [
      { speaker: '旁白', text: '门铃又响了一次。小禾把最后一盘面包端上柜台，队伍只往前挪了一点。' },
      { speaker: '陈叔', text: '想看什么，我拿给你。账户在资料夹里，收支在这本账里。' },
      { speaker: '小禾', text: '收银忙的时候，我觉得店里特别有钱。陈叔算完账，表情就没那么高兴了。' },
    ],
    hotspots: [
      {
        id: 'bakery-account', label: '柜台资料夹', x: 76, y: 58, doc: 'account',
        dialogue: [
          { speaker: '陈叔', text: '这是今天的公司账户记录。已经花出去的，余额里都扣过了。' },
          { speaker: '旁白', text: '陈叔从自己的资料夹取出快照，递到你面前。' },
        ],
      },
      {
        id: 'bakery-book', label: '收支本', x: 53, y: 59, doc: 'operations',
        dialogue: [
          { speaker: '陈叔', text: '前面是经营记录，后面是未来一个月的预算。预测归预测，可不是已经收到的钱。' },
          { speaker: '小禾', text: '我每天记卖出去多少。原来还得一起看后面花出去多少。' },
        ],
      },
      {
        id: 'bakery-chen', label: '陈叔', x: 51, y: 37,
        dialogue: [
          { speaker: '陈叔', text: '有客人排到一半就走了，我看着着急。小禾也能独当一面了，我真想让她试试带一家店。' },
          { speaker: '陈叔', text: '设备款可以找老孟核对，我已跟他说过。新铺子的资料，小禾带你看。' },
        ],
      },
      {
        id: 'bakery-poster', label: '小禾', x: 75, y: 40,
        dialogue: [
          { speaker: '小禾', text: '陈叔把新店草图给我看过。窗边放座位，柜台往里挪一点。客人端着面包，也能坐下来慢慢吃。' },
          { speaker: '小禾', text: '我也很期待。可有张好看的草图，还不等于生意就一定会好吧。' },
        ],
      },
      {
        id: 'bakery-recipe', label: '新口味面包', x: 10, y: 55,
        dialogue: [
          { speaker: '小禾', text: '这款配方改了好几次。陈叔说盐再少一点，我说香味会跑掉。' },
          { speaker: '陈叔', text: '后来听她的。客人倒是先吃出来了。' },
        ],
      },
      {
        id: 'bakery-oven', label: '烤箱维修贴', x: 29, y: 37,
        dialogue: [
          { speaker: '旁白', text: '贴纸的边角微微卷起，写着设备服务点老孟的联系方式。' },
          { speaker: '陈叔', text: '上回温度不稳，他收了工又折回来。做生意，谁都不轻松。' },
        ],
      },
    ],
  },
  supplier: {
    id: 'supplier',
    name: '老孟的设备服务点',
    time: '沿街 · 机油与铁屑的气味',
    question: '设备已经在用，现在究竟还欠哪笔钱？',
    intro: [
      { speaker: '旁白', text: '风扇把工作台上的纸角吹起。老孟擦干手，取下耳后的铅笔。' },
      { speaker: '老孟', text: '陈叔打过招呼了。他们的合同、收款记录，我都找出来了。' },
      { speaker: '老孟', text: '烤箱已经天天干活了。剩下这笔，我也得安排回厂里。' },
    ],
    hotspots: [
      {
        id: 'supplier-contract', label: '合同文件夹', x: 36, y: 65, doc: 'contract',
        dialogue: [
          { speaker: '老孟', text: '这是老店烤箱的尾款页，旁边夹着到期通知。延期不能靠一句“再说”，得双方确认。' },
        ],
      },
      {
        id: 'supplier-payments', label: '收款核对页', x: 64, y: 64, doc: 'payments',
        dialogue: [
          { speaker: '老孟', text: '前面的款都结了，不能让人付两遍。现在等的是尾款，这里还空着。' },
          { speaker: '旁白', text: '老孟把留灯烘焙这一页抽出来，与你一起核对对应阶段。' },
        ],
      },
      {
        id: 'supplier-meng', label: '老孟', x: 55, y: 38,
        dialogue: [
          { speaker: '老孟', text: '我知道他们店忙，也信陈叔做面包的手艺。但工厂那边，不会因为面包卖得好就把我的付款日往后挪。' },
          { speaker: '老孟', text: '真有困难，大家把安排摆出来谈。现在可还没有谈妥延期。' },
        ],
      },
      {
        id: 'supplier-photo', label: '工作台上的扳手', x: 33, y: 47,
        dialogue: [
          { speaker: '老孟', text: '安装那天，小禾拿着抹布绕了好几圈，生怕新烤箱磕出一道痕。' },
          { speaker: '旁白', text: '老孟拿起手边的扳手，比画起那天安装烤箱的样子。那是已经在老店投入使用的设备。' },
        ],
      },
      {
        id: 'supplier-delivery', label: '旧送货单', x: 80, y: 55,
        dialogue: [
          { speaker: '老孟', text: '都是以前合作留下的。陈叔过去按约付款，我记得。' },
          { speaker: '老孟', text: '可这一回的钱，还是得看这一次怎么安排。' },
        ],
      },
      {
        id: 'supplier-machine', label: '待修的机器', x: 23, y: 36,
        dialogue: [
          { speaker: '老孟', text: '它一热就停，冷下来又好。机器有时也像人，忙起来才知道哪里撑不住。' },
          { speaker: '旁白', text: '老孟笑了一下，把拆下的螺丝按大小排回布上。' },
        ],
      },
    ],
  },
  newshop: {
    id: 'newshop',
    name: '还没开门的新铺子',
    time: '傍晚 · 街灯映进空铺子',
    question: '新店开始收钱之前，要先付出什么？',
    intro: [
      { speaker: '旁白', text: '玻璃门里没有面包香。地板上几道胶带，勾出了未来柜台的形状。' },
      { speaker: '小禾', text: '陈叔让我带你看排期和预算，都在这儿。现在还没签约。' },
      { speaker: '小禾', text: '开业的时候，我想站在这里。进门的人，一眼就能看见刚出炉的面包。' },
    ],
    hotspots: [
      {
        id: 'newshop-budget', label: '筹备预算夹', x: 40, y: 46, doc: 'budget',
        dialogue: [
          { speaker: '小禾', text: '这一页是签约时的首期投入。后面还有筹备期间要花的钱，陈叔特意分开写了。' },
          { speaker: '旁白', text: '两页之间夹着一枚回形针。首期之后，还没有结束。' },
        ],
      },
      {
        id: 'newshop-schedule', label: '墙边施工排期', x: 24, y: 28, doc: 'schedule',
        dialogue: [
          { speaker: '小禾', text: '照现在的安排，得等这些都完成，才具备营业条件。邀请函的日期，我一直没敢写。' },
          { speaker: '旁白', text: '施工、安装、筹备排在前面。第一笔新店收款，还在这段时间之外。' },
        ],
      },
      {
        id: 'newshop-xiaohe', label: '小禾', x: 63, y: 25,
        dialogue: [
          { speaker: '小禾', text: '我连开门第一天要说什么都想好了。可真站在这里，觉得要学的事还好多。' },
          { speaker: '小禾', text: '我想当店长，也想让跟着我的人知道，下一步有着落。' },
        ],
      },
      {
        id: 'newshop-invitation', label: '手作邀请函', x: 66, y: 35,
        dialogue: [
          { speaker: '旁白', visual: 'invitation', text: '店长一栏写着“小禾”。开业日期后面，是整整一行留白。' },
          { speaker: '小禾', visual: 'invitation', text: '纸是我挑的，字也练了好久。日期嘛……等真的准备好再写。' },
        ],
      },
      {
        id: 'newshop-mark', label: '地上的柜台标记', x: 54, y: 70,
        dialogue: [
          { speaker: '小禾', text: '这边留宽一点，老人推着买菜车也过得去。面包夹就放在这里。' },
          { speaker: '旁白', text: '她比画了一个还不存在的柜台，往旁边让开半步。' },
        ],
      },
      {
        id: 'newshop-leaflet', label: '未拆的纸箱', x: 8, y: 60,
        dialogue: [
          { speaker: '小禾', text: '这些旧展示道具是从老店搬过来的，还没拆。隔壁花店说开业可以送一束花，我们还没答应日期。' },
          { speaker: '旁白', text: '纸箱上落着薄薄的灰。被期待着的热闹，还需要等待。' },
        ],
      },
    ],
  },
};

export const OPENING = [
  { speaker: '旁白', text: '你跟着队伍走进留灯烘焙。门铃、纸袋和烤箱的声音挤在一起。你付过钱，接下陈叔递来的面包。' },
  { speaker: '陈叔', text: '趁热。现在地方太小了，我画过新铺子的样子。再开一家，小禾就能当店长。' },
  { speaker: '小禾', visual: 'invitation', text: '邀请函我都做好了。店长写了我的名字，日期……还空着。' },
  { speaker: '旁白', text: '电话响起，陈叔到门外接听。小禾压低声音：“又是问烤箱尾款的。这笔钱下来，老店是不是也能踏实一点？”' },
  { speaker: '上级', text: '今天由你做第一次现场调查：公司现在有多少钱，接下来必须付什么，申请的贷款准备怎样使用。把依据带回来，审批由后续审查决定。' },
  { speaker: '陈叔', text: '公司的账我拿给你。老孟那边，我也同意你去核对我们这台烤箱的款。你帮我看看，这一步到底接不接得上。' },
];

export const ENDING = [
  { speaker: '陈叔', text: '新铺子的约，我先不签了。我给房东打电话。机会我还是相信，但不能只看开门那一天。' },
  { speaker: '上级', text: '报告收到了。暂缓新店能减少新增支出，明天的烤箱尾款还在：现有 2 万元，对着 10 万元尾款，还有 8 万元要落实。' },
  { speaker: '上级', text: '接下来继续核实融资能否批准并按时到账，或供应商是否书面确认延期。今天的演算与预测，都不是已经落实的承诺。' },
  { speaker: '小禾', text: '当晚，她发来一张照片：邀请函放在收支本旁，店长名字还在，日期仍然空着。“陈叔说，明天跟老孟继续谈付款。今晚先教我看账。下次先把钱算清楚，再写日期。”' },
];
