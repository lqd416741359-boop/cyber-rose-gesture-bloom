import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const MIME = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"], [".task", "application/octet-stream"],
]);

export function contentType(filePath) {
  return MIME.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";
}

export function resolvePublicPath(root, rawUrl) {
  let pathname;
  try {
    const rawPath = decodeURIComponent(String(rawUrl).split(/[?#]/, 1)[0]);
    if (rawPath.split(/[\\/]+/).includes("..")) return null;
    pathname = decodeURIComponent(new URL(rawUrl, "http://localhost").pathname);
  }
  catch { return null; }
  const normalized = path.posix.normalize(pathname).replace(/^\/+/, "");
  if (normalized.startsWith("..") || pathname.includes("..")) return null;
  const target = path.resolve(root, normalized || "index.html");
  const relative = path.relative(root, target);
  return relative.startsWith("..") || path.isAbsolute(relative) ? null : target;
}

export function createStaticServer(root = path.dirname(fileURLToPath(import.meta.url))) {
  return http.createServer(async (request, response) => {
    const target = resolvePublicPath(root, request.url ?? "/");
    if (!target) { response.writeHead(403); response.end("Forbidden"); return; }
    try {
      const info = await stat(target);
      if (!info.isFile()) throw new Error("Not a file");
      response.writeHead(200, { "Content-Type": contentType(target), "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
      createReadStream(target).pipe(response);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });
}

export function shouldOpenBrowser(argv = process.argv) {
  return argv.includes("--open");
}

export function canReuseRunningServer(error, openRequested) {
  return Boolean(openRequested && error?.code === "EADDRINUSE");
}

export function edgeLaunchArgs(url) {
  return ["/d", "/s", "/c", "start", "", "msedge.exe", url];
}

function launchEdge(url) {
  try {
    const child = spawn(process.env.ComSpec || "cmd.exe", edgeLaunchArgs(url), { detached: true, stdio: "ignore" });
    child.on("error", () => console.log("Open this URL manually in Edge: " + url));
    child.unref();
    return true;
  }
  catch { return false; }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const url = "http://127.0.0.1:4173/?started=1";
  const openRequested = shouldOpenBrowser();
  const server = createStaticServer();
  server.on("error", (error) => {
    if (canReuseRunningServer(error, openRequested)) {
      console.log("The server is already running. Opening Edge…");
      launchEdge(url);
      return;
    }
    console.error("Startup failed:", error.message);
  });
  server.listen(4173, "127.0.0.1", () => {
    console.log("Cyber Rose is running: http://127.0.0.1:4173");
    console.log("Press Ctrl+C to stop.");
    if (openRequested && !launchEdge(url)) {
      console.log("Open this URL manually in Edge: " + url);
    }
  });
}
