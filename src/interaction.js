export function opennessToBloom(openness) {
  const normalized = (Number(openness) - 0.62) / 0.7;
  return Math.max(0, Math.min(1, normalized));
}

export function roseFrameMix(progress) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  if (p <= 0.5) return [1 - p * 2, p * 2, 0];
  return [0, 2 - p * 2, p * 2 - 1];
}

export function createBloomFollower({ response = 22, initial = 0 } = {}) {
  let value = initial;
  return {
    update(target, dt) {
      const safeTarget = Math.max(0, Math.min(1, Number(target) || 0));
      const safeDt = Math.max(0, Math.min(0.1, Number(dt) || 0));
      value += (safeTarget - value) * (1 - Math.exp(-response * safeDt));
      if (Math.abs(safeTarget - value) < 0.001) value = safeTarget;
      return value;
    },
    reset(next = 0) { value = Math.max(0, Math.min(1, Number(next) || 0)); },
  };
}

export function createOrganicBloomFollower({ stiffness = 190, damping = 18, initial = 0 } = {}) {
  let value = Math.max(0, Math.min(1, Number(initial) || 0));
  let velocity = 0;
  return {
    update(target, dt) {
      const safeTarget = Math.max(0, Math.min(1, Number(target) || 0));
      const safeDt = Math.max(0, Math.min(1 / 30, Number(dt) || 0));
      velocity += (safeTarget - value) * stiffness * safeDt;
      velocity *= Math.exp(-damping * safeDt);
      value += velocity * safeDt;
      if (value < 0 || value > 1) {
        value = Math.max(0, Math.min(1, value));
        velocity *= 0.2;
      }
      if (Math.abs(safeTarget - value) < 0.0005 && Math.abs(velocity) < 0.005) {
        value = safeTarget;
        velocity = 0;
      }
      return value;
    },
    reset(next = 0) {
      value = Math.max(0, Math.min(1, Number(next) || 0));
      velocity = 0;
    },
    get velocity() { return velocity; },
  };
}

export function roseMotion(progress, velocity = 0, time = 0) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const eased = p * p * p * (p * (p * 6 - 15) + 10);
  const kinetic = Math.max(-1, Math.min(1, Number(velocity) || 0));
  const breath = Math.sin((Number(time) || 0) * 0.0015) * (0.0015 + eased * 0.0025);
  return {
    scale: 0.965 + eased * 0.055 + breath,
    lift: -eased * 10,
    rotation: kinetic * 0.55 + Math.sin((Number(time) || 0) * 0.0007) * (0.08 + eased * 0.18),
    glow: 0.22 + eased * 0.78,
  };
}

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export function petalLayerProgress(progress) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  return {
    core: smoothstep(p / 0.58),
    inner: smoothstep((p - 0.1) / 0.72),
    outer: smoothstep((p - 0.25) / 0.75),
  };
}

export function sixStageBlend(progress) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  if (p === 0) return { from: 0, to: 0, mix: 0 };
  if (p === 1) return { from: 5, to: 5, mix: 0 };
  const scaled = p * 5;
  const from = Math.floor(scaled);
  const to = Math.min(5, from + 1);
  return { from, to, mix: smoothstep(scaled - from) };
}
