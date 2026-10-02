const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../model.js');
test('20万扩张：明天为0，30天资金缺口5.8万，不重复计数', () => {
  assert.deepEqual(M.calculate('expand'), { immediate: 0, net: 20, repayment: 18, extra: 60, end: -58 });
  assert.equal(M.format(M.calculate('expand').end), '-5.8');
});
test('10万暂缓：付尾款后2万，月底3.1万', () => {
  assert.deepEqual(M.calculate('adjust'), { immediate: 20, net: 20, repayment: 9, extra: 0, end: 31 });
});
test('暂缓和拒绝：近期缺8万，不能编造月末结果', () => {
  for (const c of ['delay', 'reject']) assert.deepEqual(M.calculate(c), { immediate: -80, net: 20, end: null });
});
test('选择的依据与结果分别评价', () => {
  assert.match(M.assess('adjust', ['due','ledger'], 'execution', true), /用途约束/);
  assert.match(M.assess('adjust', ['loan','chat'], 'receipts', false), /更准确/);
  assert.match(M.assess('delay', ['loan','due'], 'deadline', false), /尚未核实/);
  assert.match(M.assess('delay', ['loan','due'], 'deadline', true), /排期已经取得/);
});
test('重开状态无上局数据污染', () => {
  const first = M.fresh(); first.evidence.push('due');
  assert.deepEqual(M.fresh().evidence, ['loan','balance']);
});
