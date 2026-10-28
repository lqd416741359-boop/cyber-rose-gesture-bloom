import { createBloomState, transitionBloom } from "./state.js";
import { getFlower } from "./flowers.js";
import { drawFlower } from "./flower-renderer.js";
import { createParticlePool } from "./particles.js";
import { createHandTracker } from "./hand-tracker.js";
import { createAppController } from "./app-controller.js";
import { cameraCapability, runCameraToggle } from "./camera-control.js";
import { createOrganicBloomFollower, roseMotion, sixStageBlend } from "./interaction.js";

const stage = document.querySelector("#stage");
const flowerCanvas = document.querySelector("#flowerCanvas");
const handCanvas = document.querySelector("#handCanvas");
const video = document.querySelector("#cameraVideo");
const roseVisual = document.querySelector("#roseVisual");
const roseStages = [...roseVisual.querySelectorAll(".rose-stage")];
const placeholder = document.querySelector("#cameraPlaceholder");
const statusText = document.querySelector("#statusText");
const gestureName = document.querySelector("#gestureName");
const phaseBadge = document.querySelector("#phaseBadge");
const bloomProgress = document.querySelector("#bloomProgress");
const flowerCtx = flowerCanvas.getContext("2d");
const handCtx = handCanvas.getContext("2d");
const particles = createParticlePool(280);
let landmarks = null;
let witherStartedAt = 0;
let lastFrame = performance.now();
let lastDraw = 0;
let animationId = 0;
let controlsTimer = 0;
const bloomFollower = createOrganicBloomFollower({ stiffness: 190, damping: 18, initial: 0 });

const phaseLabels = {
  idle: "DORMANT", seeded: "CORE AWAKENING", blooming: "GRACEFUL BLOOM", bloomed: "FULL RADIANCE", closing: "PETALS FOLDING", pulsing: "ENERGY PULSE", withering: "ENERGY RETURN", withered: "AWAITING RESET",
};

const controller = createAppController({
  initialState: createBloomState("tech-rose"),
  transition: transitionBloom,
  effects: {
    onTransition(from, to) {
      if (to.phase === "seeded") particles.clear();
      if (to.phase === "bloomed" && from.phase !== "bloomed") emitAtFlower("bloom", 76);
      if (to.phase === "pulsing" && from.revision !== to.revision) emitAtFlower("bloom", 118);
      if (to.phase === "withering") { witherStartedAt = performance.now(); emitAtFlower("wither", 132); }
      if (to.flowerId !== from.flowerId) particles.clear();
    },
    onChange: updateCopy,
  },
});

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width: rect.width, height: rect.height, ratio };
}

function flowerPoint() {
  const rect = flowerCanvas.getBoundingClientRect();
  return { x: rect.width * 0.56, y: rect.height * 0.51 };
}

function renderRose(progress, now) {
  const blend = sixStageBlend(progress);
  roseStages.forEach((stage, index) => {
    stage.style.opacity = index === blend.from ? String(1 - blend.mix) : index === blend.to ? String(blend.mix) : "0";
    if (index === blend.from) stage.style.transform = `translateY(${-blend.mix * 3}px) scale(${1 + blend.mix * .008})`;
    else if (index === blend.to) stage.style.transform = `translateY(${(1 - blend.mix) * 4}px) scale(${.992 + blend.mix * .008})`;
    else stage.style.transform = "translateY(0) scale(.992)";
  });
  const motion = roseMotion(progress, bloomFollower.velocity, now);
  roseVisual.style.setProperty("--rose-scale", String(motion.scale));
  roseVisual.style.setProperty("--rose-lift", `${motion.lift}px`);
  roseVisual.style.setProperty("--rose-tilt", `${motion.rotation}deg`);
  roseVisual.style.setProperty("--rose-glow", String(motion.glow));
}

function emitAtFlower(mode, count) {
  const state = controller.getState();
  particles.emitBurst({ ...flowerPoint(), colors: getFlower(state.flowerId).palette, count, mode });
}

function updateCopy(state) {
  const flower = getFlower(state.flowerId);
  document.querySelector("#chapter").textContent = "ROSE // 01";
  document.querySelector("#flowerName").textContent = flower.name;
  document.querySelector("#latinName").textContent = flower.latin;
  document.querySelector("#flowerNote").textContent = flower.note;
  phaseBadge.textContent = phaseLabels[state.phase];
  bloomProgress.style.width = `${Math.round(state.progress * 100)}%`;
}

function drawHand(viewport) {
  handCtx.clearRect(0, 0, viewport.width, viewport.height);
  if (!landmarks) return;
  const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  const point = (index) => ({ x: (1 - landmarks[index].x) * viewport.width, y: landmarks[index].y * viewport.height });
  handCtx.save();
  handCtx.lineWidth = Math.max(1.6, viewport.width * 0.004);
  handCtx.strokeStyle = "rgba(153,255,224,.76)";
  handCtx.shadowColor = "#72f3cb";
  handCtx.shadowBlur = 12;
  for (const [a, b] of connections) {
    const p1 = point(a); const p2 = point(b);
    handCtx.beginPath(); handCtx.moveTo(p1.x, p1.y); handCtx.lineTo(p2.x, p2.y); handCtx.stroke();
  }
  for (let i = 0; i < landmarks.length; i += 1) {
    const p = point(i);
    handCtx.fillStyle = [4,8,12,16,20].includes(i) ? "#ffe2a5" : "#b9fff0";
    handCtx.beginPath(); handCtx.arc(p.x, p.y, [4,8,12,16,20].includes(i) ? 4.2 : 2.5, 0, Math.PI * 2); handCtx.fill();
  }
  handCtx.restore();
}

function animate(now) {
  animationId = requestAnimationFrame(animate);
  if (document.hidden || now - lastDraw < 1000 / 60) return;
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now; lastDraw = now;
  const flowerViewport = resizeCanvas(flowerCanvas);
  const handViewport = resizeCanvas(handCanvas);
  const state = controller.getState();
  let renderProgress = bloomFollower.update(state.progress, dt);
  if (state.phase === "withering") {
    renderProgress = Math.max(0, state.progress - (now - witherStartedAt) / 2600);
    if (renderProgress <= 0) controller.dispatch({ type: "finish-wither" });
  }
  drawFlower(flowerCtx, getFlower(state.flowerId), renderProgress, state.phase, flowerViewport, now);
  renderRose(renderProgress, now);
  bloomProgress.style.width = `${Math.round(renderProgress * 100)}%`;
  particles.update(dt, flowerViewport);
  particles.draw(flowerCtx);
  drawHand(handViewport);
}

function setStatus(kind, message) {
  statusText.textContent = message;
  if (["camera-ready", "ready"].includes(kind)) { video.classList.add("active"); placeholder.classList.add("hidden"); }
  if (["fallback", "stopped"].includes(kind)) { video.classList.remove("active"); placeholder.classList.remove("hidden"); }
}

const tracker = createHandTracker({
  video,
  onStatus: ({ kind, message }) => setStatus(kind, message),
  onFrame(frame) {
    landmarks = frame.landmarks;
    const labels = { pinch: "PINCH · ENERGY PULSE", open: "OPEN PALM · BLOOM", fist: "CLOSED FIST · FOLD", neutral: "READING GESTURE", none: "AWAITING HAND" };
    gestureName.textContent = labels[frame.rawGesture] ?? "AWAITING GESTURE";
    if (frame.gesture === "pinch") controller.dispatch({ type: "pulse" });
    const state = controller.getState();
    if (frame.landmarks && frame.rawGesture !== "pinch") {
      const target = frame.openness;
      controller.dispatch({ type: target >= state.progress ? "open" : "close", value: target });
    }
  },
});

document.querySelector("#startCamera").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const capability = cameraCapability(navigator);
  if (!capability.supported) {
    setStatus("fallback", capability.message);
    button.textContent = "OPEN IN CHROME";
    button.disabled = false;
    return;
  }
  await runCameraToggle({ tracker, button, onStopped: () => { landmarks = null; } });
});
document.querySelector("#resetBloom").addEventListener("click", () => controller.dispatch({ type: "reset" }));
document.querySelector("#fullscreen").addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen());

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (["Space", "ArrowUp", "ArrowDown"].includes(event.code)) event.preventDefault();
  if (event.code === "Space") controller.dispatch({ type: "pulse" });
  if (event.code === "ArrowUp") {
    const state = controller.getState();
    controller.dispatch({ type: "open", value: Math.min(1, state.progress + 0.12) });
  }
  if (event.code === "ArrowDown") {
    const state = controller.getState();
    controller.dispatch({ type: "close", value: Math.max(0, state.progress - .12) });
  }
  revealControls();
});

function revealControls() {
  stage.classList.remove("controls-idle");
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => stage.classList.add("controls-idle"), 3000);
}

window.addEventListener("pointermove", revealControls, { passive: true });
window.addEventListener("resize", () => { resizeCanvas(flowerCanvas); resizeCanvas(handCanvas); });
document.addEventListener("visibilitychange", () => { lastFrame = performance.now(); });
window.addEventListener("beforeunload", () => tracker.stop());

updateCopy(controller.getState());
resizeCanvas(flowerCanvas); resizeCanvas(handCanvas);
animationId = requestAnimationFrame(animate);
revealControls();
