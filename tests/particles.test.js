import test from "node:test";
import assert from "node:assert/strict";
import { createParticlePool } from "../src/particles.js";

test("particle pool never exceeds capacity", () => {
  const pool = createParticlePool(12, () => 0.5);
  pool.emitBurst({ x: 10, y: 10, colors: ["#fff"], count: 30, mode: "bloom" });
  assert.equal(pool.activeCount, 12);
});

test("expired particles return to the pool", () => {
  const pool = createParticlePool(3, () => 0.5);
  pool.emitBurst({ x: 0, y: 0, colors: ["#fff"], count: 2, mode: "wither" });
  pool.update(10, { width: 100, height: 100 });
  assert.equal(pool.activeCount, 0);
});
