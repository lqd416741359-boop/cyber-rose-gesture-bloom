import test from "node:test";
import assert from "node:assert/strict";
import { createBloomState, transitionBloom } from "../src/state.js";

test("seed, open and wither follow the lifecycle", () => {
  let state = createBloomState("camellia");
  state = transitionBloom(state, { type: "seed" });
  assert.equal(state.phase, "seeded");
  state = transitionBloom(state, { type: "open", value: 1 });
  assert.equal(state.phase, "bloomed");
  state = transitionBloom(state, { type: "wither" });
  assert.equal(state.phase, "withering");
});

test("progress is clamped and selecting a flower resets the lifecycle", () => {
  let state = transitionBloom(createBloomState("rose"), { type: "open", value: 4 });
  assert.equal(state.progress, 1);
  state = transitionBloom(state, { type: "select", flowerId: "lotus" });
  assert.deepEqual(state, { flowerId: "lotus", phase: "idle", progress: 0, revision: 0 });
});

test("an open palm blooms directly from idle and a fist closes the rose", () => {
  let state = transitionBloom(createBloomState("tech-rose"), { type: "open", value: 0.72 });
  assert.equal(state.phase, "blooming");
  assert.equal(state.progress, 0.72);
  state = transitionBloom(state, { type: "close", value: 0.18 });
  assert.equal(state.phase, "closing");
  assert.equal(state.progress, 0.18);
});

test("pinch pulse preserves bloom progress and increments revision", () => {
  const blooming = transitionBloom(createBloomState("tech-rose"), { type: "open", value: 0.63 });
  const pulsed = transitionBloom(blooming, { type: "pulse" });
  assert.equal(pulsed.progress, 0.63);
  assert.equal(pulsed.phase, "pulsing");
  assert.equal(pulsed.revision, blooming.revision + 1);
});
