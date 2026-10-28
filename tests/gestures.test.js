import test from "node:test";
import assert from "node:assert/strict";
import {
  measureHand,
  classifyGesture,
  createGestureStabilizer,
  createOpennessSmoother,
  createPalmProgressController,
} from "../src/gestures.js";

function makeLandmarks({ pinch = 0.02, openness = 0.32 } = {}) {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  points[5] = { x: 0.4, y: 0.5, z: 0 };
  points[17] = { x: 0.6, y: 0.5, z: 0 };
  points[4] = { x: 0.5 - pinch / 2, y: 0.5 - openness, z: 0 };
  points[8] = { x: 0.5 + pinch / 2, y: 0.5 - openness, z: 0 };
  for (const index of [8, 12, 16, 20]) points[index] = { x: 0.5, y: 0.5 - openness, z: 0 };
  points[8] = { x: 0.5 + pinch / 2, y: 0.5 - openness, z: 0 };
  return points;
}

test("a palm-relative close thumb and index is a pinch", () => {
  assert.equal(classifyGesture(measureHand(makeLandmarks({ pinch: 0.015, openness: 0.25 }))), "pinch");
});

test("large openness is open and small openness is a fist", () => {
  assert.equal(classifyGesture(measureHand(makeLandmarks({ pinch: 0.12, openness: 0.34 }))), "open");
  assert.equal(classifyGesture(measureHand(makeLandmarks({ pinch: 0.12, openness: 0.08 }))), "fist");
});

test("stabilizer emits only after the hold window and only once", () => {
  const stable = createGestureStabilizer({ holdMs: 250 });
  assert.equal(stable.update("open", 0), null);
  assert.equal(stable.update("open", 249), null);
  assert.equal(stable.update("open", 250), "open");
  assert.equal(stable.update("open", 300), null);
});

test("openness smoothing limits a blurry one-frame jump", () => {
  const smooth = createOpennessSmoother({ alpha: 0.25, initial: 0.2 });
  assert.equal(smooth.update(0.2), 0.2);
  assert.equal(smooth.update(1), 0.4);
  assert.ok(Math.abs(smooth.update(0.2) - 0.35) < 1e-9);
});

function makeArticulatedHand({ curled = false } = {}) {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.7, z: 0 }));
  points[0] = { x: 0.5, y: 0.82, z: 0 };
  points[5] = { x: 0.4, y: 0.62, z: 0 };
  points[9] = { x: 0.5, y: 0.58, z: 0 };
  points[17] = { x: 0.6, y: 0.62, z: 0 };
  const fingers = [[6, 8, 0.4], [10, 12, 0.47], [14, 16, 0.54], [18, 20, 0.61]];
  for (const [pip, tip, x] of fingers) {
    points[pip] = { x, y: 0.48, z: 0 };
    points[tip] = curled ? { x: x + 0.12, y: 0.64, z: 0 } : { x, y: 0.18, z: 0 };
  }
  points[4] = curled ? { x: 0.58, y: 0.62, z: 0 } : { x: 0.27, y: 0.47, z: 0 };
  return points;
}

test("a visibly curled fist is not misclassified as an open palm", () => {
  const metrics = measureHand(makeArticulatedHand({ curled: true }));
  assert.ok(metrics.openness < 0.3);
  assert.equal(classifyGesture(metrics), "fist");
});

test("a curled fist takes priority over an incidental thumb-index pinch", () => {
  const fist = makeArticulatedHand({ curled: true });
  fist[4] = { ...fist[8] };
  assert.equal(classifyGesture(measureHand(fist)), "fist");
});

test("calibrated palm motion travels smoothly from bud to full bloom and back", () => {
  const control = createPalmProgressController({ initial: 0, alpha: 1, deadzone: 0, sensitivity: 0.62 });
  assert.equal(control.update(0.08), 0, "first pose calibrates without jumping");
  assert.equal(control.update(0.7), 1, "opening fully reaches full bloom");
  assert.equal(control.update(0.08), 0, "closing the same range returns to a bud");
  control.resetBaseline();
  assert.equal(control.update(0.8), 0, "reacquisition preserves the current frame");
});
