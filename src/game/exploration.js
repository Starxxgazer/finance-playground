import { sceneObject } from "./scene-objects.js";

// Every clue uses the same traced geometry for its target and camera focus.
const spot = (sceneId, id, label, optional = false) => ({
  id, label, optional, ...sceneObject(sceneId, id),
});
export const oldSpots = [
  spot("bakery", "customer", "门口的顾客", true),
  spot("bakery", "ledger", "柜台账本"),
  spot("bakery", "debt", "烤箱付款清单"),
  spot("bakery", "receipt", "首款回执与约定"),
  spot("bakery", "contract", "烤箱旁的合同夹", true),
  spot("bakery", "transfer", "柜台上的旧回执夹", true),
];
export const newSpots = [
  spot("newshop", "rent", "门口的租赁资料"),
  spot("newshop", "renovation", "装修付款安排"),
  spot("newshop", "equipment", "设备预留位"),
  spot("newshop", "preparation", "人员与备货安排"),
  spot("newshop", "survey", "小禾的访谈本", true),
  spot("newshop", "invitation", "小禾手里的邀请函", true),
];
