import { fundingCards } from './content.js';

export const amounts = Object.freeze({ cash: 20000, loan: 200000, oldDebt: 100000, startup: 120000, followup: 60000, repayment: 18000, oldReceipts: [60000, 70000, 70000], oldPayments: [50000, 50000, 40000], newReceipts: 60000, newPayments: 40000 });

export function calculatePlan(data = amounts) {
  const sum = (values) => values.reduce((a, b) => a + b, 0);
  const initial = data.cash + data.loan - data.oldDebt - data.startup;
  return {
    initial,
    day10: initial + data.oldReceipts[0] - data.oldPayments[0] - data.followup,
    month: initial + sum(data.oldReceipts) - sum(data.oldPayments) - data.followup + data.newReceipts - data.newPayments - data.repayment,
    inflows: data.cash + data.loan + sum(data.oldReceipts) + data.newReceipts,
    outflows: data.oldDebt + data.startup + sum(data.oldPayments) + data.followup + data.newPayments + data.repayment,
  };
}
export function cardBalance(ids) {
  return fundingCards.filter((card) => ids.includes(card.id)).reduce((sum, card) => sum + card.amount, 0);
}
