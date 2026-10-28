import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { resolvePublicPath, contentType, shouldOpenBrowser, canReuseRunningServer, edgeLaunchArgs } from "../server.mjs";

test("server resolves only files under project root", () => {
  const root = path.resolve(".");
  assert.equal(resolvePublicPath(root, "/"), path.join(root, "index.html"));
  assert.equal(resolvePublicPath(root, "/src/app.js"), path.join(root, "src", "app.js"));
  assert.equal(resolvePublicPath(root, "/../secret.txt"), null);
});

test("server returns JavaScript and task MIME types", () => {
  assert.equal(contentType("app.js"), "text/javascript; charset=utf-8");
  assert.equal(contentType("model.task"), "application/octet-stream");
});

test("start script can request opening Edge only after server startup", () => {
  assert.equal(shouldOpenBrowser(["node", "server.mjs", "--open"]), true);
  assert.equal(shouldOpenBrowser(["node", "server.mjs"]), false);
});

test("start can reuse an already-running local server", () => {
  assert.equal(canReuseRunningServer({ code: "EADDRINUSE" }, true), true);
  assert.equal(canReuseRunningServer({ code: "EACCES" }, true), false);
});

test("Edge launch uses Windows start so Edge need not be on PATH", () => {
  assert.deepEqual(edgeLaunchArgs("http://127.0.0.1:4173"), ["/d", "/s", "/c", "start", "", "msedge.exe", "http://127.0.0.1:4173"]);
});
