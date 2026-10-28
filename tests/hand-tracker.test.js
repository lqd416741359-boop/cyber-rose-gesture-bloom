import test from "node:test";
import assert from "node:assert/strict";
import { describeStartFailure } from "../src/hand-tracker.js";

test("camera failures explain denied, missing, and occupied devices", () => {
  assert.match(describeStartFailure({ name: "NotAllowedError" }, "camera"), /permission was denied/i);
  assert.match(describeStartFailure({ name: "NotFoundError" }, "camera"), /no camera/i);
  assert.match(describeStartFailure({ name: "NotReadableError" }, "camera"), /another app/i);
});

test("model startup failures identify the exact loading stage", () => {
  assert.match(describeStartFailure(new TypeError("Failed to fetch"), "library"), /library/i);
  assert.match(describeStartFailure(new Error("wasm compile failed"), "wasm"), /WASM/);
  assert.match(describeStartFailure(new Error("model failed"), "model"), /model file or GPU/i);
});
