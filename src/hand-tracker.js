import { measureHand, classifyGesture, createGestureStabilizer, createPalmProgressController } from "./gestures.js";

const TASKS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export function describeStartFailure(error, stage = "camera") {
  const name = error?.name || "Error";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission was denied. Allow camera access from the address bar.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera was found. Check that the camera is connected.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera may be in use by another app or browser tab. Close it and retry.";
  }
  if (stage === "library") return "The hand-tracking library failed to load. Check the network and retry.";
  if (stage === "wasm") return "The hand-tracking WASM component failed to load. Check the network or browser blocking settings.";
  if (stage === "model") return "The hand model file or GPU initialization failed. Refresh the page and retry.";
  return `Camera startup failed (${name}). Refresh the page and retry.`;
}

export function createHandTracker({ video, onFrame, onStatus }) {
  let stream = null;
  let landmarker = null;
  let frameId = 0;
  let running = false;
  let lastVideoTime = -1;
  let lastHandSeenAt = 0;
  const stable = createGestureStabilizer({ holdMs: 260 });
  const palmProgress = createPalmProgressController({ sensitivity: 0.62, alpha: 0.58, deadzone: 0.006, initial: 0 });

  async function loop(now) {
    if (!running) return;
    if (!document.hidden && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = landmarker.detectForVideo(video, now);
      const landmarks = result.landmarks?.[0] ?? null;
      if (landmarks) {
        lastHandSeenAt = now;
        const metrics = measureHand(landmarks);
        const rawGesture = classifyGesture(metrics);
        const gesture = stable.update(rawGesture, now);
        onFrame({
          landmarks,
          gesture,
          rawGesture,
          rawOpenness: metrics.openness,
          openness: palmProgress.update(metrics.openness),
          timestamp: now,
        });
      } else {
        if (lastHandSeenAt && now - lastHandSeenAt > 520) {
          stable.reset();
          palmProgress.resetBaseline();
          lastHandSeenAt = 0;
        }
        onFrame({ landmarks: null, gesture: null, rawGesture: "none", openness: palmProgress.value, timestamp: now });
      }
    }
    frameId = requestAnimationFrame(loop);
  }

  return {
    async start() {
      if (running) return;
      let startupStage = "camera";
      onStatus({ kind: "loading", message: "Loading hand tracking…" });
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false,
        });
        video.srcObject = stream;
        await video.play();
        onStatus({ kind: "camera-ready", message: "Camera ready · Loading gesture model…" });
        startupStage = "library";
        const { FilesetResolver, HandLandmarker } = await import(TASKS_URL);
        startupStage = "wasm";
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        startupStage = "model";
        landmarker = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO", numHands: 1,
          minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
        });
        running = true;
        onStatus({ kind: "ready", message: "Place one hand inside the frame" });
        frameId = requestAnimationFrame(loop);
      } catch (error) {
        this.stop();
        const detail = describeStartFailure(error, startupStage);
        console.error("Fingertip Bloom startup failed", { stage: startupStage, name: error?.name, message: error?.message });
        onStatus({ kind: "fallback", message: detail, error });
        throw error;
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(frameId);
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      if (video) video.srcObject = null;
      landmarker?.close?.();
      landmarker = null;
      stable.reset();
      palmProgress.resetBaseline();
      lastHandSeenAt = 0;
      onStatus({ kind: "stopped", message: "Camera stopped · Keyboard controls remain available" });
    },
    get running() { return running; },
  };
}
