import test from "node:test";
import assert from "node:assert/strict";
import { createBloomState, transitionBloom } from "../src/state.js";
import { createAppController } from "../src/app-controller.js";

test("entering withering emits one transition effect", () => {
  const calls = [];
  const app = createAppController({
    initialState: { ...createBloomState("rose"), phase: "bloomed", progress: 1, revision: 1 },
    transition: transitionBloom,
    effects: { onTransition: (from, to) => calls.push([from.phase, to.phase]) },
  });
  app.dispatch({ type: "wither" });
  app.dispatch({ type: "wither" });
  assert.deepEqual(calls, [["bloomed", "withering"]]);
});

test("controller exposes its latest immutable state", () => {
  const app = createAppController({ initialState: createBloomState(), transition: transitionBloom });
  app.dispatch({ type: "seed" });
  assert.equal(app.getState().phase, "seeded");
});
