function drawCircuitStem(ctx, cx, cy, height, palette) {
  ctx.save();
  ctx.strokeStyle = palette[3]; ctx.shadowColor = palette[0]; ctx.shadowBlur = 12; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.bezierCurveTo(cx - 8, cy + height * .32, cx + 12, cy + height * .66, cx - 4, cy + height); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = "rgba(89,230,255,.52)";
  for (let i = 2; i < 5; i += 1) {
    const y = cy + height * i / 5; const side = i % 2 ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + side * 28, y + 13); ctx.lineTo(cx + side * 42, y + 13); ctx.stroke();
    ctx.fillStyle = palette[3]; ctx.beginPath(); ctx.arc(cx + side * 43, y + 13, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawFlower(ctx, flower, progress, phase, viewport, time = 0) {
  const { width, height } = viewport; const cx = width * .5; const cy = height * .47; const p = Math.max(0, Math.min(1, progress));
  ctx.save(); ctx.clearRect(0, 0, width, height);
  const aura = ctx.createRadialGradient(cx, cy, 4, cx, cy, width * (.24 + p * .28));
  aura.addColorStop(0, `rgba(42,174,255,${.18 + p * .26})`); aura.addColorStop(.45, "rgba(8,67,143,.12)"); aura.addColorStop(1, "rgba(1,10,28,0)");
  ctx.fillStyle = aura; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(time * .00006); ctx.strokeStyle = `rgba(89,230,255,${.08 + p * .22})`; ctx.lineWidth = 1;
  for (const radius of [width * (.16 + p * .08), width * (.22 + p * .1)]) {
    ctx.setLineDash([radius * .16, radius * .08]); ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore(); drawCircuitStem(ctx, cx, cy + height * .06, height * .38, flower.palette); ctx.restore();
  return { x: cx, y: cy };
}
