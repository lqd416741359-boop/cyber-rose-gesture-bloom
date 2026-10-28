import test from "node:test";
import assert from "node:assert/strict";
import { FLOWERS } from "../src/flowers.js";

test("catalog contains one focused technology rose", () => {
  assert.deepEqual(FLOWERS.map((flower) => flower.id), ["tech-rose"]);
  assert.equal(new Set(FLOWERS.map((flower) => flower.id)).size, 1);
  assert.ok(FLOWERS.every((flower) => flower.palette.length >= 3));
});
