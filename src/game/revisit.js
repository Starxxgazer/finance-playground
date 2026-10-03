// Only optional investigations can be reopened after Lin has received the file.
const routes = [
  { scene: 0, activity: "customer", ids: ["taste", "queue"], instruction: "点选顾客问题，再选择有依据的口碑结论。" },
  { scene: 0, activity: "contract", ids: ["contract", "meng-call", "alternative"], instruction: "点“能商量个备选安排吗？”，返回林姐处再点开签字回执。" },
  { scene: 0, activity: "transfer", ids: ["transfer", "investment", "capital-note"], instruction: "点“看看出资记录”，对照回执完成五项核对。" },
  { scene: 1, activity: "survey", ids: ["survey", "survey-note"], instruction: "选择想去新铺的受访者组，再选择他们的身份。" },
  { scene: 1, activity: "invitation", ids: ["wish", "talk"], instruction: "点选两句追问，了解带班意愿和商量进展。" },
];
export function revisitTarget(state, id) {
  if (id === "alternative" && state.branches.aRequested)
    return { scene: 3, activity: "alternative", instruction: "阅读签字回执；备选安排尚未生效，读完返回林姐处补交。" };
  return routes.find(route => route.ids.includes(id)) || null;
}
export function needsRevisit(state, id) {
  const target = revisitTarget(state, id);
  if (!target) return false;
  if (!state.seen.includes(id)) return true;
  if (target.activity === "customer") return !state.solved.includes("reputation");
  if (target.activity === "contract") return !state.branches.aRequested;
  if (target.activity === "transfer") return !state.branches.b;
  if (target.activity === "survey") return !state.branches.c;
  if (target.activity === "invitation") return !["wish", "talk"].every(key => state.seen.includes(key));
  return false;
}
