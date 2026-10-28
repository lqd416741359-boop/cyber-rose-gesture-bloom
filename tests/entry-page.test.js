import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("direct file opening shows start-file guidance", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /location\.protocol\s*===\s*["']file:["']/);
  assert.match(html, /double-click start/i);
});

test("the shipped interface contains no Chinese copy", async () => {
  const files = [
    "../index.html", "../src/app.js", "../src/camera-control.js",
    "../src/flowers.js", "../src/hand-tracker.js", "../server.mjs", "../start.bat",
  ];
  for (const file of files) {
    const content = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(content, /[\u3400-\u9fff]/, `${file} still contains Chinese interface text`);
  }
});
