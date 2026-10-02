// All monetary values are integer thousands of yuan. These fictional teaching
// facts are fixed at build time; the game never generates financial facts.
export const FACTS = Object.freeze({
  cash: 20,
  loan: 200,
  oven: 100,
  initial: 120,
  receipts: 180,
  operating: 160,
  preparation: 60,
  repayment: 18,
  newReceipts: 0,
});

export const REQUIRED_DOCUMENTS = Object.freeze([
  'application', 'repayment', 'account', 'operations', 'contract', 'payments', 'budget', 'schedule',
]);

export const REQUIRED_STEPS = Object.freeze([
  'bakery', 'supplier', 'newshop', 'assembly', 'presentation',
]);

/** Convert integer thousands of yuan into a display value in ten-thousands. */
export function formatMoney(amount) {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError('金额必须是以千元计的安全整数。');
  }
  return String(amount / 10);
}

/** The original plan is a conditional calculation, not an approved loan. */
export function calculatePlan() {
  const afterPayments = FACTS.cash + FACTS.loan - FACTS.oven - FACTS.initial;
  const operatingNet = FACTS.receipts - FACTS.operating;
  const closing = afterPayments + operatingNet - FACTS.preparation
    + FACTS.newReceipts - FACTS.repayment;
  return {
    afterPayments,
    closing,
    gap: Math.max(0, -closing),
    urgentGap: Math.max(0, FACTS.oven - FACTS.cash),
    operatingNet,
  };
}

/** Collection alone cannot finish the chapter: every reasoning step is needed. */
export function canEnterReport(state) {
  if (!state || !(state.collected instanceof Set || Array.isArray(state.collected))) {
    return false;
  }
  const collected = state.collected instanceof Set
    ? state.collected : new Set(state.collected);
  return REQUIRED_DOCUMENTS.every((id) => collected.has(id))
    && REQUIRED_STEPS.every((id) => state.solved?.[id] === true);
}


export const REPORT_CHECKS = Object.freeze({
  business: { answer: 'conditional', evidence: ['application', 'operations'] },
  payment: { answer: 'unresolved', evidence: ['account', 'contract', 'payments'] },
  expansion: { answer: 'gap', evidence: ['application', 'repayment', 'operations', 'budget', 'schedule'] },
  advice: { answer: 'pause', evidence: [] },
  followup: { answer: 'verify', evidence: [] },
});

export function checkReportAnswer(id, answer) {
  const check = REPORT_CHECKS[id];
  return Boolean(check && answer?.choice === check.answer
    && Array.isArray(answer.evidence)
    && new Set(answer.evidence).size === check.evidence.length
    && check.evidence.every(document => answer.evidence.includes(document)));
}

export function canSubmit(state) {
  return canEnterReport(state)
    && Object.keys(REPORT_CHECKS).every(id => state.report?.[id]?.confirmed === true
      && checkReportAnswer(id, state.report[id]));
}
