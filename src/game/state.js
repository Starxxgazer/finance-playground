import { revisitTarget, needsRevisit } from "./revisit.js";
import {
  byId,
  oldRequired,
  oldMainTasks,
  newRequired,
  calendarNotes,
  findings,
} from "./content.js";
import { evaluateProof, getLine, validChain } from "./model.js";
export const SAVE_KEY = "finance-playground.chapter-one.v2";
export const initialState = {
  version: 2,
  scene: 0,
  unlocked: 0,
  films: [],
  seen: [],
  solved: [],
  tasks: { ledger: false, debt: false, receipt: false },
  calendar: {},
  branches: { aRequested: false, b: false, c: false },
  funds: {
    day: null,
    refs: [],
    initial: false,
    placements: {},
    gap: false,
    explained: false,
    order: [],
    condition: null,
    chainDone: false,
    noted: false,
    hint: 0,
  },
  revisit: null,
  reviewRefs: null,
  submitted: false,
  submittedIds: [],
  complete: false,
  chapterCleared: false,
};
const initialPlaced = (p) =>
  p?.cash === "available" &&
  p?.loan === "available" &&
  p?.oldDebt === "payment" &&
  p?.startup === "payment";
const has = (s, ids) => ids.every((id) => s.seen.includes(id));
const collect = (s, ids) => ({ ...s, seen: [...new Set([...s.seen, ...ids])] });
const updateFunds = (s, data) => ({ ...s, funds: { ...s.funds, ...data } });
const updateBranch = (s, data) => ({
  ...s,
  branches: { ...s.branches, ...data },
});
export function sceneDone(s, index = s.scene) {
  if (index === 0)
    return (
      has(s, oldRequired) &&
      oldMainTasks.every((id) => s.tasks[id] === true) &&
      ["finance", "credit"].every((id) => s.solved.includes(id))
    );
  if (index === 1)
    return (
      has(s, newRequired) &&
      calendarNotes.every((n) => s.calendar[n.id] === n.day)
    );
  if (index === 2) return s.funds.noted && s.solved.includes("risk");
  return s.submitted;
}
export function canSubmit(s) {
  return (
    s.scene === 3 &&
    !s.revisit &&
    [0, 1, 2].every((i) => sceneDone(s, i)) &&
    evaluateProof(
      s.funds.day,
      s.reviewRefs ?? s.funds.refs,
      s.funds.initial,
      s.seen,
    ).ok &&
    validChain(s.funds.order, s.funds.condition, s.seen)
  );
}
const sceneReads = [
  {
    ledger: ["ledger", "schedule"],
    debt: ["debt"],
    receipt: ["receipt"],
    contract: ["contract"],
    transfer: ["transfer", "receipt"],
  },
  {
    rent: ["rent", "lease"],
    renovation: ["renovation"],
    equipment: ["equipment"],
    preparation: ["preparation", "opening", "forecast"],
    lease: ["lease"],
    opening: ["opening"],
    forecast: ["forecast"],
    survey: ["survey"],
  },
];
export function reducer(s, a) {
  // 接收后仍冻结资料；仅明确补查可重新开放，并须重新交给林姐。
  if (s.submitted && !["END", "RESET", "GOTO", "REVISIT"].includes(a.type)) return s;
  switch (a.type) {
    case "REVISIT": {
      const target = revisitTarget(s, a.id);
      if (!s.submitted || !canSubmit(s) || !target || !needsRevisit(s, a.id)) return s;
      return { ...s, scene: target.scene, revisit: { id: a.id, scene: target.scene, activity: target.activity },
        submitted: false, submittedIds: [], complete: false };
    }
    case "RETURN_REVISIT":
      return s.revisit ? { ...s, scene: 3, revisit: null } : s;
    case "READ": {
      let ids = sceneReads[s.scene]?.[a.id];
      if (s.scene === 2 && a.id === "calculation") ids = ["calculation"];
      if (s.scene === 3 && a.id === "alternative" && s.branches.aRequested)
        ids = ["alternative"];
      if (!ids) return s;
      let next = collect(s, ids);
      if (has(next, ["rent", "renovation", "equipment", "preparation"]))
        next = collect(next, ["budget"]);
      return next;
    }
    case "ASK_CUSTOMER":
      return s.scene === 0 && ["taste", "queue"].includes(a.id)
        ? collect(s, [a.id])
        : s;
    case "CLASSIFY": {
      if (s.scene !== 0 || !has(s, [a.id])) return s;
      const correct =
        a.id === "ledger"
          ? a.cash === "now" && a.net === "forecast"
          : a.id === "debt"
            ? a.day === 1 && a.status === "unpaid"
            : a.id === "receipt"
              ? a.amount && a.date && a.status === "paid"
              : false;
      if (!correct) return s;
      const next = { ...s, tasks: { ...s.tasks, [a.id]: true } };
      const earned = [];
      if (next.tasks.ledger) earned.push("finance");
      if (next.tasks.debt && next.tasks.receipt) earned.push("credit");
      return { ...next, solved: [...new Set([...next.solved, ...earned])] };
    }
    case "NOTE": {
      const f = findings.find((f) => f.id === a.id && f.id !== "risk");
      const ready =
        a.id === "finance"
          ? s.tasks.ledger
          : a.id === "credit"
            ? s.tasks.debt && s.tasks.receipt
            : has(s, ["taste", "queue"]);
      return s.scene === 0 &&
        f &&
        ready &&
        has(s, f.sources) &&
        a.choice === "supported"
        ? { ...s, solved: [...new Set([...s.solved, a.id])] }
        : s;
    }
    case "CONTACT_MENG":
      return s.scene === 0 && has(s, ["contract"])
        ? collect(updateBranch(s, { aRequested: true }), ["meng-call"])
        : s;
    case "REQUEST_INVESTMENT":
      return s.scene === 0 && has(s, ["transfer"])
        ? collect(s, ["investment"])
        : s;
    case "TRACE_CAPITAL":
      return s.scene === 0 &&
        has(s, ["transfer", "investment", "receipt"]) &&
        a.amount &&
        a.parties &&
        a.order &&
        a.purpose &&
        a.choice === "same"
        ? collect(updateBranch(s, { b: true }), ["capital-note"])
        : s;
    case "SURVEY":
      return s.scene === 1 &&
        has(s, ["survey"]) &&
        Array.isArray(a.selected) &&
        a.selected.length === 8 &&
        new Set(a.selected).size === 8 &&
        a.selected.every((n) => Number.isInteger(n) && n >= 1 && n <= 8)
        ? collect(updateBranch(s, { c: true }), ["survey-note"])
        : s;
    case "ASK_XIAOHE":
      return s.scene === 1 && ["wish", "talk"].includes(a.id)
        ? collect(s, [a.id])
        : s;
    case "PLACE": {
      const note = calendarNotes.find((n) => n.id === a.id);
      return s.scene === 1 &&
        note &&
        has(s, [note.source]) &&
        a.day === note.day
        ? { ...s, calendar: { ...s.calendar, [note.id]: a.day } }
        : s;
    }
    case "INITIAL_PLACE":
      if (
        s.scene !== 2 ||
        s.funds.initial ||
        !has(s, ["calculation"]) ||
        !["cash", "loan", "oldDebt", "startup"].includes(a.id) ||
        ![null, "available", "payment"].includes(a.side)
      )
        return s;
      return updateFunds(s, {
        placements: { ...s.funds.placements, [a.id]: a.side },
      });
    case "INITIAL":
      return s.scene === 2 &&
        has(s, ["calculation"]) &&
        initialPlaced(s.funds.placements)
        ? updateFunds(s, { initial: true })
        : s;
    case "DAY":
      return s.scene === 2 &&
        !s.funds.gap &&
        Number.isInteger(a.day) &&
        a.day >= 1 &&
        a.day <= 30
        ? updateFunds(s, { day: a.day })
        : s;
    case "REFS":
      return s.scene === 2 &&
        !s.funds.gap &&
        Array.isArray(a.refs) &&
        a.refs.length <= 2 &&
        a.refs.every((r) => has(s, [r.doc]) && getLine(r))
        ? updateFunds(s, { refs: a.refs })
        : s;
    case "CALCULATE":
      return s.scene === 2 &&
        evaluateProof(s.funds.day, s.funds.refs, s.funds.initial, s.seen).ok
        ? updateFunds(s, { gap: true })
        : s;
    case "EXPLAIN":
      return s.scene === 2 &&
        s.funds.gap &&
        s.funds.refs.some(
          (r) =>
            getLine(r)?.canonical === "old-early" &&
            r.doc === a.ref?.doc &&
            r.line === a.ref?.line,
        )
        ? updateFunds(s, { explained: true })
        : s;
    case "ORDER":
      return s.scene === 2 &&
        s.funds.explained &&
        !s.funds.noted &&
        Array.isArray(a.order) &&
        a.order.length <= 4 &&
        new Set(a.order).size === a.order.length &&
        a.order.every((id) =>
          ["pay", "deliver", "open", "receive"].includes(id),
        )
        ? updateFunds(s, { order: a.order, chainDone: false })
        : s;
    case "CONDITION":
      return s.scene === 2 &&
        s.funds.explained &&
        !s.funds.noted &&
        has(s, [a.ref?.doc]) &&
        getLine(a.ref)
        ? updateFunds(s, { condition: a.ref, chainDone: false })
        : s;
    case "CLEAR_CONDITION":
      return s.scene === 2 && s.funds.explained && !s.funds.noted
        ? updateFunds(s, { condition: null, chainDone: false })
        : s;
    case "CHECK_CHAIN":
      return s.scene === 2 &&
        s.funds.explained &&
        validChain(s.funds.order, s.funds.condition, s.seen)
        ? updateFunds(s, { chainDone: true })
        : s;
    case "SAVE_RISK":
      return s.scene === 2 &&
        s.funds.gap &&
        s.funds.explained &&
        s.funds.chainDone &&
        validChain(s.funds.order, s.funds.condition, s.seen)
        ? collect(
            {
              ...updateFunds(s, { noted: true }),
              solved: [...new Set([...s.solved, "risk"])],
            },
            ["proof-record", "risk-note"],
          )
        : s;
    case "HINT":
      return s.scene === 2
        ? updateFunds(s, { hint: Math.min(3, s.funds.hint + 1) })
        : s;
    case "REVIEW_REFS":
      return s.scene === 3 &&
        Array.isArray(a.refs) &&
        a.refs.length <= 2 &&
        a.refs.every((r) => has(s, [r.doc]) && getLine(r))
        ? { ...s, reviewRefs: a.refs }
        : s;
    case "RESTORE_REFS":
      return s.scene === 3 ? { ...s, reviewRefs: null } : s;
    case "SUBMIT":
      return canSubmit(s)
        ? { ...s, submitted: true, submittedIds: [...s.seen] }
        : s;
    case "END":
      return s.submitted ? { ...s, complete: true, chapterCleared: true } : s;
    case "FILM":
      return a.index === s.scene && !s.films.includes(a.index)
        ? { ...s, films: [...s.films, a.index] }
        : s;
    case "ADVANCE":
      if (s.revisit) return s;
      return s.scene < 3 && sceneDone(s)
        ? {
            ...s,
            scene: s.scene + 1,
            unlocked: Math.max(s.unlocked, s.scene + 1),
          }
        : s;
    case "GOTO":
      if (s.revisit) return s;
      return Number.isInteger(a.index) &&
        a.index >= 0 &&
        a.index <= s.unlocked &&
        (!s.submitted || a.index === 3)
        ? { ...s, scene: a.index }
        : s;
    case "RESET":
      return structuredClone(initialState);
    default:
      return s;
  }
}

// 旧版存档不迁移剧情事实；损坏或不一致的存档安全回到开场。
export function restoreState(raw) {
  const reset = () => structuredClone(initialState);
  try {
    const s = JSON.parse(raw);
    if (
      !s ||
      s.version !== 2 ||
      !Number.isInteger(s.scene) ||
      !Number.isInteger(s.unlocked) ||
      s.scene < 0 ||
      s.scene > s.unlocked ||
      s.unlocked > 3
    )
      return reset();
    if (
      !["seen", "solved", "films", "submittedIds"].every(
        (k) => Array.isArray(s[k]) && new Set(s[k]).size === s[k].length,
      )
    )
      return reset();
    if (
      s.seen.some((id) => !Object.hasOwn(byId, id)) ||
      s.solved.some((id) => !findings.some((f) => f.id === id)) ||
      s.films.some((i) => !Number.isInteger(i) || i < 0 || i > s.unlocked)
    )
      return reset();
    if (
      !s.tasks ||
      !s.branches ||
      !s.funds ||
      !s.calendar ||
      Array.isArray(s.calendar)
    )
      return reset();
    if (
      ["ledger", "debt", "receipt"].some(
        (k) => typeof s.tasks[k] !== "boolean",
      ) ||
      ["aRequested", "b", "c"].some((k) => typeof s.branches[k] !== "boolean")
    )
      return reset();
    if (!Object.hasOwn(s, "chapterCleared")) s.chapterCleared = s.complete === true;
    if (typeof s.chapterCleared !== "boolean" || (s.complete && !s.chapterCleared) ||
      (s.chapterCleared && s.unlocked !== 3)) return reset();
    if (!Object.hasOwn(s, "revisit")) s.revisit = null;
    if (s.revisit !== null) {
      const r = s.revisit;
      // A contract revisit remains at the contract even after the call is made.
      const target = revisitTarget({ ...s, branches: { ...s.branches, aRequested: r.activity === "alternative" } }, r.id);
      if (!target || (r.activity === "alternative" && !s.branches.aRequested) || s.submitted || s.complete || s.unlocked !== 3 ||
        r.scene !== s.scene || r.scene !== target.scene || r.activity !== target.activity)
        return reset();
    }
    const f = s.funds;
    // 旧存档已完成的月初核对保留；未核对的不补答案。
    if (!Object.hasOwn(f, "placements"))
      f.placements = f.initial
        ? {
            cash: "available",
            loan: "available",
            oldDebt: "payment",
            startup: "payment",
          }
        : {};
    if (
      !f.placements ||
      Array.isArray(f.placements) ||
      Object.entries(f.placements).some(
        ([id, side]) =>
          !["cash", "loan", "oldDebt", "startup"].includes(id) ||
          ![null, "available", "payment"].includes(side),
      ) ||
      (f.initial && !initialPlaced(f.placements))
    )
      return reset();
    if (
      ["initial", "gap", "explained", "chainDone", "noted"].some(
        (k) => typeof f[k] !== "boolean",
      ) ||
      typeof s.submitted !== "boolean" ||
      typeof s.complete !== "boolean"
    )
      return reset();
    if (f.day !== null && (!Number.isInteger(f.day) || f.day < 1 || f.day > 30))
      return reset();
    const validRefs = (refs) =>
      Array.isArray(refs) &&
      refs.length <= 2 &&
      refs.every((r) => has(s, [r?.doc]) && getLine(r));
    if (
      !validRefs(f.refs) ||
      (s.reviewRefs !== null && !validRefs(s.reviewRefs)) ||
      (f.condition !== null &&
        (!has(s, [f.condition?.doc]) || !getLine(f.condition)))
    )
      return reset();
    if (
      !Array.isArray(f.order) ||
      f.order.length > 4 ||
      new Set(f.order).size !== f.order.length ||
      f.order.some(
        (id) => !["pay", "deliver", "open", "receive"].includes(id),
      ) ||
      !Number.isInteger(f.hint) ||
      f.hint < 0 ||
      f.hint > 3
    )
      return reset();
    const secondScene = [
      ...newRequired,
      "survey",
      "survey-note",
      "wish",
      "talk",
    ];
    if (
      (s.unlocked < 1 && s.seen.some((id) => secondScene.includes(id))) ||
      (s.unlocked < 2 &&
        (f.initial ||
          f.day !== null ||
          f.refs.length ||
          f.order.length ||
          f.condition ||
          f.hint ||
          s.seen.some((id) =>
            ["calculation", "proof-record", "risk-note"].includes(id),
          )))
    )
      return reset();
    if (
      Object.entries(s.calendar).some(
        ([id, day]) =>
          !calendarNotes.some(
            (n) => n.id === id && n.day === day && has(s, [n.source]),
          ),
      )
    )
      return reset();
    if (
      Object.entries(s.tasks).some(
        ([id, done]) =>
          !["ledger", "debt", "receipt"].includes(id) ||
          (done && !has(s, [id])),
      )
    )
      return reset();
    if (
      (s.solved.includes("finance") && !s.tasks.ledger) ||
      (s.solved.includes("credit") && !(s.tasks.debt && s.tasks.receipt)) ||
      (s.solved.includes("reputation") && !has(s, ["taste", "queue"]))
    )
      return reset();
    if (
      (s.branches.aRequested && !has(s, ["contract", "meng-call"])) ||
      (has(s, ["alternative"]) && (!s.branches.aRequested || s.unlocked < 3))
    )
      return reset();
    if (
      s.branches.b !== has(s, ["capital-note"]) ||
      (s.branches.b && !has(s, ["receipt", "transfer", "investment"])) ||
      s.branches.c !== has(s, ["survey-note"]) ||
      (s.branches.c && !has(s, ["survey"]))
    )
      return reset();
    if (
      ((f.initial || Object.keys(f.placements).length) &&
        !has(s, ["calculation"])) ||
      (f.gap && !evaluateProof(f.day, f.refs, f.initial, s.seen).ok) ||
      (f.explained && !f.gap) ||
      (f.chainDone &&
        (!f.explained || !validChain(f.order, f.condition, s.seen)))
    )
      return reset();
    if (
      f.noted !== s.solved.includes("risk") ||
      f.noted !== has(s, ["risk-note"]) ||
      f.noted !== has(s, ["proof-record"]) ||
      (f.noted && !f.chainDone)
    )
      return reset();
    // 旧版需要手选笔记；已有核对依据的主线发现可直接补记。
    if (s.tasks.ledger) s.solved = [...new Set([...s.solved, "finance"])];
    if (s.tasks.debt && s.tasks.receipt)
      s.solved = [...new Set([...s.solved, "credit"])];
    for (let i = 0; i < s.unlocked; i++) if (!sceneDone(s, i)) return reset();
    if (
      (s.submitted &&
        (!canSubmit(s) ||
          s.submittedIds.length !== s.seen.length ||
          !s.submittedIds.every((id) => s.seen.includes(id)))) ||
      (!s.submitted && s.submittedIds.length) ||
      (s.complete && !s.submitted)
    )
      return reset();
    return s;
  } catch {
    return reset();
  }
}
