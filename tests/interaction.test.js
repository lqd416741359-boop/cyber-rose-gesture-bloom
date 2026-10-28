import test from "node:test";
import assert from "node:assert/strict";
import { opennessToBloom, roseFrameMix, createBloomFollower, createOrganicBloomFollower, roseMotion, petalLayerProgress, sixStageBlend } from "../src/interaction.js";

test("hand openness covers the complete bud-to-bloom range", () => {
  assert.equal(opennessToBloom(0.62), 0);
  assert.equal(opennessToBloom(1.32), 1);
  assert.ok(opennessToBloom(0.98) > 0.45);
  assert.ok(opennessToBloom(0.98) < 0.6);
});

test("rose stages crossfade with a strong visual difference", () => {
  assert.deepEqual(roseFrameMix(0), [1, 0, 0]);
  assert.deepEqual(roseFrameMix(0.5), [0, 1, 0]);
  assert.deepEqual(roseFrameMix(1), [0, 0, 1]);
  const quarter = roseFrameMix(0.25);
  assert.deepEqual(quarter, [0.5, 0.5, 0]);
});

test("bloom follower reacts within 100ms without teleporting", () => {
  const follower = createBloomFollower({ response: 22, initial: 0 });
  const first = follower.update(1, 1 / 60);
  assert.ok(first > 0.25 && first < 1);
  let value = first;
  for (let i = 0; i < 5; i += 1) value = follower.update(1, 1 / 60);
  assert.ok(value > 0.85);
});

test("bloom follower closes through intermediate values instead of snapping shut", () => {
  const follower = createBloomFollower({ response: 18, initial: 1 });
  const first = follower.update(0, 1 / 60);
  assert.ok(first > 0.7 && first < 1);
  let value = first;
  for (let i = 0; i < 11; i += 1) value = follower.update(0, 1 / 60);
  assert.ok(value < 0.05);
});

test("petal layers open from the center outward continuously", () => {
  assert.deepEqual(petalLayerProgress(0), { core: 0, inner: 0, outer: 0 });
  const middle = petalLayerProgress(0.5);
  assert.ok(middle.core > middle.inner);
  assert.ok(middle.inner > middle.outer);
  assert.deepEqual(petalLayerProgress(1), { core: 1, inner: 1, outer: 1 });
});

test("six-stage bloom blends only neighboring stages", () => {
  assert.deepEqual(sixStageBlend(0), { from: 0, to: 0, mix: 0 });
  assert.deepEqual(sixStageBlend(1), { from: 5, to: 5, mix: 0 });
  assert.deepEqual(sixStageBlend(0.3), { from: 1, to: 2, mix: 0.5 });
  const almostOpen = sixStageBlend(0.92);
  assert.equal(almostOpen.from, 4);
  assert.equal(almostOpen.to, 5);
  assert.ok(almostOpen.mix > 0.5);
});

test("organic bloom motion eases toward each gesture without snapping", () => {
  const follower = createOrganicBloomFollower({ initial: 0 });
  const first = follower.update(1, 1 / 60);
  assert.ok(first > 0 && first < 0.15);
  let value = first;
  for (let i = 0; i < 35; i += 1) value = follower.update(1, 1 / 60);
  assert.ok(value > 0.94 && value <= 1);
  const closing = follower.update(0, 1 / 60);
  assert.ok(closing > 0.8 && closing < 1);
});

test("rose motion adds lift, expansion, and restrained kinetic tilt", () => {
  const bud = roseMotion(0, 0, 0);
  const bloom = roseMotion(1, 0, 0);
  const moving = roseMotion(0.5, 1, 0);
  assert.ok(bloom.scale > bud.scale);
  assert.ok(bloom.lift < bud.lift);
  assert.ok(bloom.glow > bud.glow);
  assert.ok(moving.rotation > 0 && moving.rotation < 1);
});
