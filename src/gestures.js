export const GESTURE_THRESHOLDS = Object.freeze({ pinch: 0.24, open: 0.72, fist: 0.45 });

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function mapRange(value, min, max) {
  return clamp((value - min) / (max - min));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

export function measureHand(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 21) throw new TypeError("Expected 21 hand landmarks");
  const wrist = landmarks[0];
  const palmWidth = Math.max(distance(landmarks[5], landmarks[17]), distance(wrist, landmarks[9]), 0.0001);
  const pinch = distance(landmarks[4], landmarks[8]) / palmWidth;
  const fingers = [[8, 6], [12, 10], [16, 14], [20, 18]];
  const extension = fingers.reduce((sum, [tip, pip]) => {
    const reachPastKnuckle = (distance(landmarks[tip], wrist) - distance(landmarks[pip], wrist)) / palmWidth;
    return sum + mapRange(reachPastKnuckle, 0.08, 0.72);
  }, 0) / fingers.length;
  const averageReach = fingers.reduce((sum, [tip]) => sum + distance(landmarks[tip], wrist) / palmWidth, 0) / fingers.length;
  const reach = mapRange(averageReach, 1.16, 2.18);
  const openness = clamp(extension * 0.68 + reach * 0.32);
  return { pinch, openness };
}

export function classifyGesture(metrics) {
  if (metrics.openness < GESTURE_THRESHOLDS.fist) return "fist";
  if (metrics.pinch < GESTURE_THRESHOLDS.pinch) return "pinch";
  if (metrics.openness > GESTURE_THRESHOLDS.open) return "open";
  return "neutral";
}

export function createGestureStabilizer({ holdMs = 260 } = {}) {
  let candidate = "neutral";
  let since = 0;
  let emitted = false;
  return {
    update(label, now) {
      if (label !== candidate) {
        candidate = label;
        since = now;
        emitted = false;
        return null;
      }
      if (!emitted && label !== "neutral" && now - since >= holdMs) {
        emitted = true;
        return label;
      }
      return null;
    },
    reset() { candidate = "neutral"; since = 0; emitted = false; },
  };
}

export function createOpennessSmoother({ alpha = 0.22, initial = 0 } = {}) {
  let value = initial;
  return {
    update(next) {
      if (!Number.isFinite(next)) return value;
      value += (next - value) * alpha;
      return value;
    },
    reset(next = initial) { value = next; },
  };
}

export function createPalmProgressController({
  sensitivity = 0.62,
  alpha = 0.58,
  deadzone = 0.006,
  initial = 0,
} = {}) {
  let target = clamp(Number(initial) || 0);
  let filtered = null;
  let previous = null;

  return {
    update(rawOpenness) {
      if (!Number.isFinite(rawOpenness)) return target;
      filtered = filtered === null ? rawOpenness : filtered + (rawOpenness - filtered) * alpha;
      if (previous === null) {
        previous = filtered;
        return target;
      }
      const delta = filtered - previous;
      previous = filtered;
      if (Math.abs(delta) >= deadzone) target = clamp(target + delta / sensitivity);
      return target;
    },
    resetBaseline() {
      filtered = null;
      previous = null;
    },
    reset(next = 0) {
      target = clamp(Number(next) || 0);
      filtered = null;
      previous = null;
    },
    get value() { return target; },
  };
}
