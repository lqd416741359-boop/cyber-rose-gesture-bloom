import test from "node:test";
import assert from "node:assert/strict";
import { cameraCapability, runCameraToggle } from "../src/camera-control.js";

test("camera capability explains a browser without mediaDevices", () => {
  assert.deepEqual(cameraCapability({ mediaDevices: undefined }), {
    supported: false,
    message: "This browser cannot access the camera. Open the URL in Chrome or Edge.",
  });
});

test("camera button is re-enabled when startup fails", async () => {
  const button = { disabled: false, textContent: "Start Camera" };
  const tracker = { running: false, start: async () => { throw new Error("denied"); } };
  await runCameraToggle({ tracker, button });
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Retry Camera");
});

test("camera button shows connecting feedback before startup finishes", async () => {
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const button = { disabled: false, textContent: "Start Camera" };
  const tracker = { running: false, start: () => pending };
  const result = runCameraToggle({ tracker, button });
  assert.equal(button.disabled, true);
  assert.equal(button.textContent, "Connecting…");
  finish();
  await result;
});
