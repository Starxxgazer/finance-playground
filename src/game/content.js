// 本轮实现的内部内容模块，尚不是队友录入标准。金额统一使用整数元。
export const money = (amount) => new Intl.NumberFormat('zh-CN').format(amount);
export const wan = (amount) => `${Number((amount / 10000).toFixed(2))}万`;
export const assumption = '假设贷款到账，按原计划试算';

export const scenes = [
  { id: 'bakery', title: '调查老店', place: '留灯烘焙 · 老店', time: '上午', heading: '生意这么好，钱够用吗？', task: '查看店里的五处线索，了解经营与付款安排。', quote: '“先结清老店烤箱的钱。新店还得添设备、装修，才能开起来。”', speaker: '陈叔', next: '去看看新铺子', evidence: ['reviews', 'ledger', 'cash', 'oven', 'schedule'] },
  { id: 'newshop', title: '查看新铺', place: '街角 · 待租新铺', time: '下午', heading: '一家新店，要花多少钱？', task: '核对完整预算、付款日期与开业条件。', quote: '“先付十二万启动。后面的六万，我想着用老店收款接上。”', speaker: '陈叔', next: '把资料放上资金桌', evidence: ['budget', 'calendar', 'procurement', 'forecast'] },
  { id: 'desk', title: '核对资金', place: '老店 · 打烊后的资金桌', time: '傍晚', heading: '把每一笔钱，放回时间里。', task: '先算整个月，再看看第10天能不能付款。', next: '交回调查发现', evidence: [] },
  { id: 'bank', title: '整理发现', place: '银行 · 调查小组', time: '次日', heading: '你的判断，依据是什么？', task: '用已获得的证据组成三条发现。', next: '交回调查 · 查看尾声', evidence: [] },
];

export const evidence = [
  { id: 'reviews', title: '顾客反馈', short: '顾客反馈', icon: 'chat', category: '口碑', nature: '现场观察', source: '店内顾客反馈', time: '本次到店时', x: 18, y: 35, lead: '熟悉的味道，也有等待。', quotes: ['经常来买，面包好吃。', '早上排队有点久。'], text: '两条反馈分别描述产品体验与排队感受。', sourceText: '本次到店记录了这两条反馈，仅代表部分顾客的体验，不是资金余额或完整满意度调查。', insight: '顾客评价帮助了解产品和服务，资金情况需要另外查看。' },
  { id: 'ledger', title: '收银记录与账本', short: '经营账本', icon: 'book', category: '经营', nature: '公司预测', source: '老店经营预测与历史记录摘要', time: '未来30天', x: 43, y: 63, lead: '预计收款，不等于现在能用的钱。', rows: [['预计收款', '20万元'], ['原料采购', '6万元'], ['工资', '4万元'], ['租金', '2万元'], ['水电、税费及其他日常付款', '2万元'], ['日常支出合计', '14万元'], ['预计经营现金结余', '6万元']], text: '14万元不包含旧设备尾款、新店投入和新贷款还款。这里的结余不是会计利润。', sourceText: '历史记录：案例提供经营记录供核对预测依据，未提供逐笔流水数值。未来预测：30天收款20万元、日常支出14万元；上述金额均为公司预测，并非已经到账。', insight: '老店预计有经营现金结余，但产生时间还要查看经营排期。' },
  { id: 'cash', title: '公司资金记录', short: '可用现金', icon: 'wallet', category: '资金', nature: '已查看的记录', source: '公司当前可用现金记录', time: '本次调查时', x: 71, y: 78, lead: '现在可用的现金，只有这一笔。', rows: [['当前可用现金', '2万元'], ['申请贷款', '20万元']], text: '贷款仍在申请中。后续模型仅假设第1天到账，不代表已经获批。', sourceText: '案例中的公司资金记录列示当前可用现金2万元；贷款申请列示20万元。这是虚构公司资料，不涉及真实账户。', insight: '现有现金与尚未获批的贷款需要分别看待。' },
  { id: 'oven', title: '烤箱付款资料', short: '旧设备尾款', icon: 'receipt', category: '信用', nature: '合同约定／已核对记录', source: '旧设备合同、尾款通知与付款记录摘要', time: '当前义务；试算第1天支付', x: 76, y: 37, lead: '烤箱已经在工作，尾款还没有付清。', rows: [['待付旧设备尾款', '10万元'], ['设备状态', '已交付使用'], ['历史付款', '已查付款与约定相符'], ['延期状态', '尚未达成新安排']], text: '历史付款有履约依据，当前尾款仍需要落实。新店设备采购是另一笔付款。', sourceText: '旧设备资料确认：设备已经交付，剩余尾款10万元；已查历史付款与约定相符；当前没有已确认的新延期安排。模型按第1天付清试算。', insight: '过去按约付款，不能替代当前尾款的安排。' },
  { id: 'schedule', title: '经营排期', short: '经营排期', icon: 'calendar', category: '时间', nature: '公司预测', source: '老店未来30天分段经营预测', time: '第1至30天', x: 88, y: 23, lead: '6万元，是一个月逐步攒出来的。', columns: ['时段', '收款', '支出', '结余'], rows: [['第1至10天', '6万', '5万', '＋1万'], ['第11至20天', '7万', '5万', '＋2万'], ['第21至30天', '7万', '4万', '＋3万'], ['合计', '20万', '14万', '＋6万']], text: '前10天预计只增加1万元现金。具体日内收付款顺序仍需核实。', sourceText: '公司按三个10天时段预测经营收支；这是分段预测，不能据此确定每一天的实际余额或全月最低点。', insight: '经营现金逐步产生，不能在月初把整月结余都用掉。' },
  { id: 'budget', title: '新店完整预算', short: '完整预算', icon: 'file', category: '投入', nature: '公司计划', source: '新店开业前完整预算', time: '第1天与第10天', x: 28, y: 71, lead: '开业前总投入18万元，不只是启动的12万元。', columns: ['日期', '用途', '金额'], rows: [['第1天', '租赁押金及首期租金', '3万'], ['第1天', '装修首付款', '3万'], ['第1天', '设备预付款', '6万'], ['第10天', '装修阶段验收款', '2万'], ['第10天', '设备发货前余款', '2万'], ['第10天', '人员筹备费用', '1万'], ['第10天', '首批备货与试制耗材', '1万']], text: '第1天12万元＋第10天6万元＝开业前总投入18万元。点击设备项目可定位新设备。', sourceText: '预算将租赁、装修、设备、筹备及备货分为两期。设备预付款6万元加发货前余款2万元，均为新店设备，与老店10万元尾款分开。', insight: '预算需要同时核对总额、用途和付款日期。' },
  { id: 'calendar', title: '开业日历', short: '开业日历', icon: 'calendar', category: '时间', nature: '公司计划', source: '新店原定开业排期', time: '第1至30天', x: 51, y: 31, lead: '日历上的开业日，还需要前面的事情都完成。', rows: [['第1天', '支付启动款，开始装修与采购'], ['第10天', '支付后续款、装修验收及设备发货'], ['第11至14天', '设备安装、调试、试制和员工准备'], ['第15天', '开始试营业'], ['第15至30天', '营业收款与运营支出']], text: '这是一份计划。付款、交付和准备都完成，才可能如期营业。', sourceText: '原计划安排第15天试营业；设备需在付款后交付，再完成安装调试。排期本身不是已经履行的事实。', insight: '“计划开业”需要与实际付款和交付条件一起看。' },
  { id: 'procurement', title: '设备采购单', short: '设备采购单', icon: 'receipt', category: '条件', nature: '合同约定', source: '新店设备采购条款', time: '第10天计划付余款', x: 74, y: 61, lead: '付清余款，才安排发货。', rows: [['新设备预付款', '6万元'], ['发货前余款', '2万元'], ['交付条件', '剩余2万元付清后发货']], text: '这2万元包含在第10天的6万元后续付款中，不能重复计算。', sourceText: '新店采购单约定：剩余2万元付清后安排发货。交付不是无条件发生，后续安装与试营业依赖这一步完成。', insight: '预计收款之前，还有必须先支付的钱。' },
  { id: 'forecast', title: '试营业预测', short: '试营业预测', icon: 'chart', category: '经营', nature: '有条件的公司预测', source: '新店第15至30天试营业预测', time: '第15至30天', x: 85, y: 78, lead: '新店的收入，以按期开业为前提。', rows: [['预计收款', '6万元'], ['追加原料采购', '2万元'], ['营业人员工资', '1万元'], ['水电及其他运营付款', '1万元'], ['运营现金支出合计', '4万元'], ['预计经营现金结余', '2万元']], text: '4万元是营业阶段新增付款，不重复包含启动款、筹备款及已预付租金。', sourceText: '按原计划第15天开始试营业，预计至月底收款6万元、运营支出4万元。筹备与营业人员费用按时段区分，追加原料不重复计算前期备货。', insight: '没有按期完成付款和开业，后面的收款预测也需要重估。' },
  { id: 'model', title: '资金核对记录', short: '资金模型', icon: 'chart', category: '试算', nature: '基于条件的计算', source: '已查看的资金、预算、经营排期与还款条件', time: '第1天、第10天与第30天', lead: '月底有结余，不代表月内都能付款。', rows: [['第1天首期付款后', '0元'], ['截至第10天', '预计缺口50,000元'], ['月底', '预计结余2,000元']], text: '假设贷款到账，按原计划试算。月底预测还以新店按期营业为前提；负数表示预计资金不足，不是真实账户负余额，也不是已核实的全月最低点。', sourceText: '第10天：2＋20＋6－10－12－5－6＝－5万元。月底：2＋20＋20＋6－10－12－14－6－4－1.8＝0.2万元。贷款首月还款1.8万元为虚构案例条件，第30天支付。' },
];
export const byId = Object.fromEntries(evidence.map((item) => [item.id, item]));
export const fundingCards = [
  { id: 'cash', label: '当前现金', amount: 20000, group: 'start', source: 'cash' },
  { id: 'loan', label: '假设贷款到账', amount: 200000, group: 'start', source: 'cash' },
  { id: 'oldDebt', label: '旧设备尾款', amount: -100000, group: 'start', source: 'oven' },
  { id: 'startup', label: '新店启动款', amount: -120000, group: 'start', source: 'budget' },
  { id: 'oldNet', label: '老店30天经营结余', amount: 60000, group: 'month', source: 'ledger' },
  { id: 'followup', label: '新店后续付款', amount: -60000, group: 'month', source: 'budget' },
  { id: 'newNet', label: '新店试营业结余', amount: 20000, group: 'month', source: 'forecast' },
  { id: 'repayment', label: '首月还款', amount: -18000, group: 'month', source: 'model' },
];
export const chain = ['第10天付款', '设备发货', '安装与准备', '第15天试营业', '预计营业收款'];
export const findings = [
  { id: 'use', title: '贷款究竟用在哪里？', subtitle: '找到两项用途的直接依据', required: ['oven', 'budget'], result: '贷款同时承担旧设备付款和新店投入。' },
  { id: 'timing', title: '为什么月底有余，仍可能付不出？', subtitle: '把经营排期、付款日期与计算结果放在一起', required: ['schedule', 'budget', 'model'], result: '月底预计结余2,000元，但截至第10天存在5万元预计缺口。月底预测以新店按期营业为前提。' },
  { id: 'debt', title: '暂缓扩张，就没有付款压力了吗？', subtitle: '移开新店预算，看看还剩下什么', required: ['oven'], result: '暂缓扩张可以减少新店支出，旧设备尾款仍需另行安排。' },
];
export const dimensions = [
  { label: '财务', text: '老店预计有经营现金结余，当前可用现金有限。', sources: ['ledger', 'cash'] },
  { label: '信用', text: '已查历史付款与约定相符，当前尾款仍需履行。', sources: ['oven'] },
  { label: '风险', text: '付款集中在前期，经营现金逐步产生；试营业预测依赖按期开业。', sources: ['schedule', 'budget', 'forecast', 'model'] },
  { label: '口碑', text: '部分顾客对产品评价正面，排队体验存在反馈。', sources: ['reviews'] },
  { label: '未知', text: '预测能否实现、具体日内付款顺序、调整安排与后续偿付能力仍待核实。', sources: ['schedule', 'forecast'] },
];
export const films = {
  intro: { title: '排队的面包店', kicker: '第一章', image: 'bakery', duration: '25–30秒', src: '', captions: '', summary: ['你是银行新人调查助理。留灯烘焙申请20万元贷款开新店，林姐让你查清资金用途与经营情况。', '你认出店员小禾是朋友，注明关系后出发，到店正常排队付款。店里生意热闹，小禾期待成为新店店长，邀请函上的日期却还空着。', '一通催款电话后，陈叔说：贷款要先结清老店烤箱尾款，再投入新店。'], next: '开始调查' },
  turning: { title: '后面的生意，需要前面的钱。', kicker: '打烊以后', image: 'desk', duration: '15–20秒', src: '', captions: '', summary: ['陈叔看着月底预计的结余，松了一口气：“老店继续卖，新店开起来，钱就能接上。”', '你把日历切到第10天：“这里要先付六万。到这一天，老店预计只留下了一万，新店还没开门。”', '陈叔看向“付清余款后发货”，放下效果图。小禾把邀请函翻到背面，帮他记下付款日期。'], next: '回银行整理发现' },
  ending: { title: '日期还空着，邀请还在。', kicker: '一个月后', image: 'bakery', duration: '12–15秒', src: '', captions: '', summary: ['陈叔暂缓新店签约，与老孟确认新的分期付款安排，并按约支付第一笔。剩余尾款仍需继续履行。', '小禾发来消息：“那个铺子租给别人了。”照片里，邀请函放在收支本旁，店长名字还在，日期仍空着。', '“邀请函没扔。陈叔说，下次定日期，我们一起看账。”陈叔核对着付款单，小禾端出新一炉面包。'], next: '查看公司透视图' },
};
