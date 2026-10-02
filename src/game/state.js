import { byId, scenes, fundingCards, findings, chain } from './content.js';

export const SAVE_KEY = 'finance-playground.chapter-one.v1';
export const initialState = { version: 1, scene: 0, unlocked: 0, seen: [], cards: [], fundStage: 0, chainCount: 0, solved: [], introDone: false, turningDone: false, endingDone: false, complete: false };
export const sceneDone = (state, index = state.scene) => index < 2
  ? scenes[index].evidence.every((id) => state.seen.includes(id))
  : index === 2 ? state.fundStage === 3 && state.chainCount === chain.length
    : findings.every((f) => state.solved.includes(f.id));

export function reducer(state, action) {
  switch (action.type) {
    case 'READ': return byId[action.id] && !state.seen.includes(action.id) ? { ...state, seen: [...state.seen, action.id] } : state;
    case 'CARD': {
      const group = state.fundStage === 0 ? 'start' : 'month';
      if (!fundingCards.some((c) => c.id === action.id && c.group === group) || state.fundStage > 1) return state;
      return { ...state, cards: state.cards.includes(action.id) ? state.cards.filter((id) => id !== action.id) : [...state.cards, action.id] };
    }
    case 'FUND_NEXT': {
      const required = fundingCards.filter((c) => c.group === (state.fundStage === 0 ? 'start' : 'month'));
      if (state.fundStage > 2 || (state.fundStage < 2 && !required.every((c) => state.cards.includes(c.id)))) return state;
      return { ...state, fundStage: state.fundStage + 1 };
    }
    case 'CHAIN': return state.fundStage === 3 && action.index === state.chainCount && state.chainCount < chain.length
      ? { ...state, chainCount: state.chainCount + 1, seen: action.index === chain.length - 1 && !state.seen.includes('model') ? [...state.seen, 'model'] : state.seen } : state;
    case 'SOLVE': {
      const finding = findings.find((f) => f.id === action.id);
      if (!finding || state.solved.includes(action.id) || !finding.required.every((id) => action.evidence?.includes(id) && state.seen.includes(id)) || action.evidence.length !== finding.required.length) return state;
      return { ...state, solved: [...state.solved, action.id] };
    }
    case 'ADVANCE': {
      if (!sceneDone(state)) return state;
      if (state.scene === 3) return { ...state, complete: true };
      const next = state.scene + 1;
      return { ...state, scene: next, unlocked: Math.max(state.unlocked, next) };
    }
    case 'GOTO': return Number.isInteger(action.index) && action.index >= 0 && action.index <= state.unlocked ? { ...state, scene: action.index } : state;
    case 'FILM': return ['intro', 'turning', 'ending'].includes(action.id) ? { ...state, [`${action.id}Done`]: true } : state;
    case 'RESET': return { ...initialState };
    default: return state;
  }
}

// 只读取本地游戏进度；损坏或过期的存档回到开场，避免白屏。
export function restoreState(raw) {
  try {
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || !Number.isInteger(s.scene) || !Number.isInteger(s.unlocked) || s.scene < 0 || s.scene > s.unlocked || s.unlocked > 3) return { ...initialState };
    if (!['seen', 'cards', 'solved'].every((k) => Array.isArray(s[k]))) return { ...initialState };
    if (!Number.isInteger(s.fundStage) || s.fundStage < 0 || s.fundStage > 3 || !Number.isInteger(s.chainCount) || s.chainCount < 0 || s.chainCount > chain.length) return { ...initialState };
    const clean = { ...initialState, scene: s.scene, unlocked: s.unlocked, fundStage: s.fundStage, chainCount: s.chainCount,
      seen: [...new Set(s.seen.filter((id) => byId[id]))], cards: [...new Set(s.cards.filter((id) => fundingCards.some((c) => c.id === id)))], solved: [...new Set(s.solved.filter((id) => findings.some((f) => f.id === id)))] };
    for (const key of ['introDone', 'turningDone', 'endingDone', 'complete']) clean[key] = s[key] === true;
    for (let i = 0; i < clean.unlocked; i++) if (!sceneDone(clean, i)) return { ...initialState };
    if (clean.fundStage > 0 && !fundingCards.filter((c) => c.group === 'start').every((c) => clean.cards.includes(c.id))) return { ...initialState };
    if (clean.fundStage > 1 && clean.cards.length !== fundingCards.length) return { ...initialState };
    if (clean.complete && !sceneDone(clean, 3)) return { ...initialState };
    return clean;
  } catch { return { ...initialState }; }
}
