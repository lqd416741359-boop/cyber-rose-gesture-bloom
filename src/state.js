const PHASES = new Set(["idle", "seeded", "blooming", "bloomed", "closing", "pulsing", "withering", "withered"]);

export function createBloomState(flowerId = "camellia") {
  return { flowerId, phase: "idle", progress: 0, revision: 0 };
}

export function transitionBloom(state, action) {
  if (!state || !PHASES.has(state.phase)) throw new TypeError("Invalid bloom state");
  if (action.type === "select") return createBloomState(action.flowerId);
  if (action.type === "reset") return createBloomState(state.flowerId);
  if (action.type === "seed") {
    return { ...state, phase: "seeded", progress: 0.04, revision: state.revision + 1 };
  }
  if (action.type === "open") {
    const progress = Math.max(0, Math.min(1, Number(action.value) || 0));
    return { ...state, phase: progress >= 0.98 ? "bloomed" : "blooming", progress };
  }
  if (action.type === "close") {
    const progress = Math.max(0, Math.min(1, Number(action.value) || 0));
    return { ...state, phase: progress <= 0.02 ? "idle" : "closing", progress };
  }
  if (action.type === "pulse") {
    return { ...state, phase: "pulsing", revision: state.revision + 1 };
  }
  if (action.type === "wither" && !["idle", "withering", "withered"].includes(state.phase)) {
    return { ...state, phase: "withering", revision: state.revision + 1 };
  }
  if (action.type === "finish-wither" && state.phase === "withering") {
    return { ...state, phase: "withered", progress: 0 };
  }
  return state;
}
