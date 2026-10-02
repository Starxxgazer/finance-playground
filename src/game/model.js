import { byId, chain } from "./content.js";
export const amounts = Object.freeze({
  cash: 20000,
  loan: 200000,
  oldDebt: 100000,
  startup: 120000,
  followup: 60000,
  repayment: 18000,
  oldReceipts: Object.freeze([60000, 70000, 70000]),
  oldPayments: Object.freeze([50000, 50000, 40000]),
  newReceipts: 60000,
  newPayments: 40000,
});
export function calculatePlan(data = amounts) {
  const sum = (values) => values.reduce((a, b) => a + b, 0);
  const initial = data.cash + data.loan - data.oldDebt - data.startup;
  return {
    initial,
    day10: initial + data.oldReceipts[0] - data.oldPayments[0] - data.followup,
    month:
      initial +
      sum(data.oldReceipts) -
      sum(data.oldPayments) -
      data.followup +
      data.newReceipts -
      data.newPayments -
      data.repayment,
    inflows: data.cash + data.loan + sum(data.oldReceipts) + data.newReceipts,
    outflows:
      data.oldDebt +
      data.startup +
      sum(data.oldPayments) +
      data.followup +
      data.newPayments +
      data.repayment,
  };
}
export function getLine(ref) {
  return byId[ref?.doc]?.lines.find((l) => l.id === ref?.line);
}
export function evaluateProof(day, refs, initialVerified, seen) {
  if (!Number.isInteger(day) || day < 1 || day > 30)
    return { ok: false, message: "先在日历上圈出你想检查的日期。" };
  if (!initialVerified)
    return {
      ok: false,
      message: "先展开陈叔的计算表，核对11月1日首批付款后的余额。",
    };
  if (
    refs.length !== 2 ||
    refs.some((r) => !seen.includes(r.doc) || !getLine(r))
  )
    return {
      ok: false,
      message: "请从已收集资料中，圈出两条具体记录放到桌上。",
    };
  const keys = refs.map((r) => getLine(r).canonical);
  if (new Set(keys).size !== 2)
    return {
      ok: false,
      message: "同一条账目拿两次还是一份依据。再找一条能补充它的记录。",
    };
  if (day !== 10) {
    const messages = {
      1: "月初首批付款后预计剩0元。这个日期不能说明后续付款时是否够用，再找付款与收款的时间关系。",
      15: "十五号是目标开业日，具体当天收付款还没查清。开业还要满足付款、交付、安装和准备条件。",
      30: "月底预计剩2,000元，建立在贷款到账、按期开业和预测实现之上。它还不能说明中间每笔款都付得出。",
    };
    return {
      ok: false,
      message:
        messages[day] ||
        "这天的收付款还没查清。现有资料不足以编出当天的余额，可以继续查其他日期。",
    };
  }
  if (keys.includes("old-month"))
    return {
      ok: false,
      message: "小禾：“这是整个月的。到你圈的那天，钱都来了吗？”",
    };
  if (!keys.includes("old-early"))
    return {
      ok: false,
      message: "陈叔：“要花多少看到了。那时能用的钱，从哪里看？”",
    };
  if (!keys.includes("new-later"))
    return {
      ok: false,
      message:
        "这条记录能说明前十天的经营收支；当天要付多少，还需要对应的付款预算。",
    };
  return {
    ok: true,
    message: "陈叔把两张单据并排放好。",
    balance: calculatePlan().day10,
  };
}
export function validChain(order, ref, seen) {
  return (
    order.length === chain.length &&
    order.every((id, i) => id === chain[i].id) &&
    seen.includes(ref?.doc) &&
    getLine(ref)?.canonical === "delivery"
  );
}
