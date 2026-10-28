export function createAppController({ initialState, transition, effects = {} }) {
  let state = Object.freeze({ ...initialState });
  return {
    dispatch(action) {
      const previous = state;
      const next = transition(previous, action);
      state = Object.freeze({ ...next });
      if (next !== previous && (next.phase !== previous.phase || next.revision !== previous.revision || next.flowerId !== previous.flowerId)) {
        effects.onTransition?.(previous, state, action);
      }
      effects.onChange?.(state, previous, action);
      return state;
    },
    getState() { return state; },
  };
}
