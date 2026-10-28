export function cameraCapability(environment) {
  if (!environment?.mediaDevices?.getUserMedia) {
    return {
      supported: false,
      message: "This browser cannot access the camera. Open the URL in Chrome or Edge.",
    };
  }
  return { supported: true, message: "" };
}

export async function runCameraToggle({ tracker, button, onStopped } = {}) {
  if (tracker.running) {
    tracker.stop();
    onStopped?.();
    button.textContent = "START CAMERA";
    return true;
  }
  button.disabled = true;
  button.textContent = "Connecting…";
  try {
    await tracker.start();
    button.textContent = "STOP CAMERA";
    return true;
  } catch {
    button.textContent = "Retry Camera";
    return false;
  } finally {
    button.disabled = false;
  }
}
