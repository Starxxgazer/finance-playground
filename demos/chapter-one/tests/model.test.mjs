import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FACTS, REQUIRED_DOCUMENTS, REQUIRED_STEPS, calculatePlan, canEnterReport, canSubmit, formatMoney, REPORT_CHECKS, checkReportAnswer,
} from '../model.js';
import { DOCUMENTS, SCENES, OPENING, ENDING } from '../data.js';

const completeState = () => ({
  collected: [...REQUIRED_DOCUMENTS],
  report: Object.fromEntries(Object.entries(REPORT_CHECKS).map(([id, check]) => [id, {choice: check.answer, evidence: [...check.evidence], confirmed: true}])),
  solved: Object.fromEntries(REQUIRED_STEPS.map((id) => [id, true])),
});

test('fixed integer-thousand facts reproduce both timing gaps and operating cash flow', () => {
  assert.deepEqual(FACTS, {
    cash: 20, loan: 200, oven: 100, initial: 120, receipts: 180,
    operating: 160, preparation: 60, repayment: 18, newReceipts: 0,
  });
  assert.ok(Object.isFrozen(FACTS));
  assert.ok(Object.values(FACTS).every(Number.isSafeInteger));
  assert.deepEqual(calculatePlan(), {
    afterPayments: 0, closing: -58, gap: 58, urgentGap: 80, operatingNet: 20,
  });
  assert.notEqual(calculatePlan().urgentGap, calculatePlan().gap);
});

test('money formatting is exact in ten-thousands and preserves negative balances', () => {
  assert.equal(formatMoney(58), '5.8');
  assert.equal(formatMoney(-58), '-5.8');
  assert.equal(formatMoney(200), '20');
  assert.equal(formatMoney(0), '0');
  assert.equal(formatMoney(18), '1.8');
  assert.throws(() => formatMoney(1.8), TypeError);
  assert.throws(() => formatMoney(Infinity), TypeError);
});

test('all eight sources contain separately readable evidence, including repayment conditions', () => {
  assert.deepEqual(Object.keys(DOCUMENTS).sort(), [...REQUIRED_DOCUMENTS].sort());
  for (const id of REQUIRED_DOCUMENTS) {
    const document = DOCUMENTS[id];
    assert.equal(document.id, id);
    for (const key of ['title', 'source', 'kind', 'summary', 'note']) {
      assert.ok(typeof document[key] === 'string' && document[key].length > 0, `${id}.${key}`);
    }
    assert.ok(document.lines.length >= 3, id);
    for (const line of document.lines) {
      assert.ok(line.label && line.value && line.note, `${id}: incomplete evidence row`);
    }
  }
  assert.ok(DOCUMENTS.application.lines.some((line) => line.value === '20 万元'));
  assert.ok(DOCUMENTS.repayment.lines.some((line) => line.value === '1.8 万元'));
  assert.ok(DOCUMENTS.account.lines.some((line) => line.value === '2 万元'));
  assert.ok(DOCUMENTS.operations.lines.some((line) => line.value === '18 万元'));
  assert.ok(DOCUMENTS.operations.lines.some((line) => line.value === '16 万元'));
  assert.ok(DOCUMENTS.contract.lines.some((line) => line.value === '10 万元'));
  assert.ok(DOCUMENTS.payments.lines.some((line) => line.value === '10 万元 · 未支付'));
  assert.ok(DOCUMENTS.budget.lines.some((line) => line.value === '12 万元'));
  assert.ok(DOCUMENTS.budget.lines.some((line) => line.value === '6 万元'));
  assert.ok(DOCUMENTS.schedule.lines.some((line) => line.value === '0 万元'));
});

test('each location directly provides its two sources and allows optional life details', () => {
  const sceneDocuments = {
    bakery: ['account', 'operations'],
    supplier: ['contract', 'payments'],
    newshop: ['budget', 'schedule'],
  };
  const allHotspotIds = new Set();
  for (const [id, documents] of Object.entries(sceneDocuments)) {
    const scene = SCENES[id];
    assert.equal(scene.id, id);
    assert.deepEqual(scene.hotspots.filter((spot) => spot.doc).map((spot) => spot.doc).sort(), documents.sort());
    assert.ok(scene.hotspots.filter((spot) => !spot.doc).length >= 3);
    for (const spot of scene.hotspots) {
      assert.ok(!allHotspotIds.has(spot.id), `duplicate hotspot ${spot.id}`);
      allHotspotIds.add(spot.id);
      assert.ok(spot.x >= 0 && spot.x <= 100 && spot.y >= 0 && spot.y <= 100);
      assert.ok(spot.dialogue.length > 0);
      if (spot.doc) assert.ok(DOCUMENTS[spot.doc]);
    }
  }
  assert.ok(OPENING.length >= 5);
  assert.ok(ENDING.length >= 4);
});

for (const id of REQUIRED_DOCUMENTS) {
  test(`submission is refused without ${id}, even if all reasoning flags are complete`, () => {
    const state = completeState();
    state.collected = state.collected.filter((documentId) => documentId !== id);
    assert.equal(canSubmit(state), false);
  });
}

for (const id of REQUIRED_STEPS) {
  test(`submission is refused without solving ${id}, even if every document is collected`, () => {
    const state = completeState();
    state.solved[id] = false;
    assert.equal(canSubmit(state), false);
    delete state.solved[id];
    assert.equal(canSubmit(state), false);
    state.solved[id] = 'true';
    assert.equal(canSubmit(state), false);
  });
}

test('only complete evidence and reasoning permit submission; arrays and Sets are supported', () => {
  const state = completeState();
  assert.equal(canSubmit(state), true);
  state.collected = new Set(state.collected);
  assert.equal(canSubmit(state), true);
  assert.equal(canSubmit(), false);
  assert.equal(canSubmit(null), false);
  assert.equal(canSubmit({}), false);
  assert.equal(canSubmit({ collected: REQUIRED_DOCUMENTS.join(','), solved: state.solved }), false);
  assert.equal(canSubmit({ collected: [...REQUIRED_DOCUMENTS] }), false);
});


test('complete investigation opens the report but cannot bypass player judgement', () => {
  const state = completeState();
  delete state.report;
  assert.equal(canEnterReport(state), true);
  assert.equal(canSubmit(state), false);
  assert.equal(canEnterReport(null), false);
});

for (const [id, check] of Object.entries(REPORT_CHECKS)) {
  test(`report ${id} permits correction and requires confirmed matching evidence`, () => {
    const state = completeState();
    state.report[id].choice = 'incorrect';
    assert.equal(canSubmit(state), false);
    state.report[id].choice = check.answer;
    state.report[id].confirmed = false;
    assert.equal(canSubmit(state), false);
    state.report[id].confirmed = true;
    assert.equal(canSubmit(state), true);
    assert.equal(checkReportAnswer(id, {choice: check.answer, evidence: [...check.evidence, 'unrelated']}), false);
    if (check.evidence.length) {
      state.report[id].evidence.pop();
      assert.equal(canSubmit(state), false);
      state.report[id].evidence = [...check.evidence];
      assert.equal(canSubmit(state), true);
    }
  });
}
