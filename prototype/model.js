/* 所有金额以千元整数计算；仅展示时换成万元，防止浮点误差。 */
(function (root) {
  const money = Object.freeze({ cash: 20, receipts: 180, operating: 160, due: 100, launch: 120, extra: 60, newReceipts: 0, expandLoan: 200, adjustLoan: 100, expandRepayment: 18, adjustRepayment: 9 });
  const format = n => String(n / 10);
  function calculate(plan) {
    const net = money.receipts - money.operating;
    if (plan === 'expand') {
      const immediate = money.cash + money.expandLoan - money.due - money.launch;
      return { immediate, net, repayment: money.expandRepayment, extra: money.extra, end: immediate + net + money.newReceipts - money.extra - money.expandRepayment };
    }
    if (plan === 'adjust') {
      const immediate = money.cash + money.adjustLoan - money.due;
      return { immediate, net, repayment: money.adjustRepayment, extra: 0, end: immediate + net - money.adjustRepayment };
    }
    return { immediate: money.cash - money.due, net, end: null };
  }
  function assess(choice, evidence, risk, hasSchedule) {
    const has = id => evidence.includes(id);
    if (choice === 'expand') return '你保住了扩张机会，但两种方案的对比已经显示首月缺口。热闹的客流或过去守约，都不能抵消新增支出。';
    if (choice === 'adjust') return has('due') && has('ledger')
      ? `你用尾款期限和老店净流入支持了调整方案。${risk === 'execution' ? '你也注意到用途约束必须真正执行。' : '预测成立和暂缓扩张都仍是前提。'}`
      : '调整方案在给定条件下可维持经营。你的引用还可以更准确：设备尾款说明眼前压力，老店收支说明后续还款来源。';
    if (choice === 'delay') return `等待可以减少信息盲区。${hasSchedule ? '排期已经取得，下一步更应确认尾款展期和用途约束。' : '开业排期尚未核实，可以继续调查。'}但明天的8万元付款缺口不会自行消失。`;
    return has('due') ? '到期尾款支持你对近期风险的担忧。但老店仍预计有正的经营净流入，拒绝原申请不等于证明公司毫无经营价值。' : '拒绝避免了本次新增授信，但还需要用到期义务说明依据；不能仅凭人物态度判定公司不可靠。';
  }
  const fresh = (seen = []) => ({ version: 1, step: 'intro', evidence: ['loan', 'balance'], visited: [], deep: [], placed: {}, tab: 'expand', choice: '', support: [], risk: '', confronted: '', seen, started: Date.now(), finished: null });
  const api = { money, format, calculate, assess, fresh };
  if (typeof module !== 'undefined') module.exports = api;
  root.GameModel = api;
})(typeof window === 'undefined' ? globalThis : window);
