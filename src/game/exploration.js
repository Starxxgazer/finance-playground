// 场景图像百分比坐标；支线和主线同样从实物进入。
const spot = (id, label, x, y, width, height, shape, optional = false) => ({
  id,
  label,
  x,
  y,
  width,
  height,
  shape,
  optional,
});
export const oldSpots = [
  spot("customer", "门口的顾客", 12, 40, 13, 31, "person", true),
  spot("ledger", "柜台账本", 52, 80, 13, 10, "book"),
  spot("debt", "烤箱付款清单", 93, 57, 9, 13, "paper"),
  spot("receipt", "首款回执与约定", 71, 80, 12, 10, "paper"),
  spot("contract", "烤箱旁的合同夹", 85, 73, 10, 10, "folder", true),
  spot("transfer", "柜台上的旧回执夹", 37, 82, 10, 9, "folder", true),
];
export const newSpots = [
  spot("rent", "门口的租赁资料", 11, 54, 10, 15, "paper"),
  spot("renovation", "装修付款安排", 45, 80, 10, 10, "paper"),
  spot("equipment", "设备预留位", 81, 65, 23, 35, "equipment"),
  spot("preparation", "人员与备货安排", 34, 81, 12, 10, "book"),
  spot("survey", "小禾的访谈本", 42, 37, 6, 6, "book", true),
  spot("invitation", "小禾手里的邀请函", 47.5, 34, 6, 10, "invitation", true),
];
export function currentQuestion(state) {
  if (state.scene === 0) {
    if (!state.tasks.ledger) return "陈叔说生意不错，现在能拿出来的钱有多少？";
    if (!state.tasks.debt || !state.tasks.receipt)
      return "旧设备的钱，哪些付过了，哪些还要付？";
    return "老店账目已核对。可以去新铺看看，也可以继续留在这里调查。";
  }
  if (state.scene === 1)
    return Object.keys(state.calendar).length === 8
      ? "付款日期已核对。等打烊后，和陈叔把这些单据一起摊开。"
      : "新铺的钱要在哪天付？把现场单据上的日期放回日历。";
  if (state.scene === 2) return "钱到账与付款的时间，真的接得上吗？";
  return "哪些已经有依据，哪些还没查清？一并交给林姐。";
}
