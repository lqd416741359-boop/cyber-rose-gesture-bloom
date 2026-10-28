export function createParticlePool(capacity = 260, random = Math.random) {
  const particles = Array.from({ length: capacity }, () => ({ active: false }));

  function emitBurst({ x, y, colors, count, mode = "bloom" }) {
    let remaining = Math.max(0, count);
    for (const particle of particles) {
      if (!remaining) break;
      if (particle.active) continue;
      const angle = random() * Math.PI * 2;
      const speed = mode === "wither" ? 12 + random() * 22 : 18 + random() * 48;
      Object.assign(particle, {
        active: true,
        x, y,
        vx: Math.cos(angle) * speed * (mode === "wither" ? 0.35 : 1),
        vy: mode === "wither" ? 8 + random() * 20 : Math.sin(angle) * speed,
        size: 1.2 + random() * 3.8,
        life: 0.8 + random() * 1.8,
        maxLife: 0,
        color: colors[Math.floor(random() * colors.length)] ?? "#fff",
        mode,
        spin: (random() - 0.5) * 5,
        rotation: random() * Math.PI,
      });
      particle.maxLife = particle.life;
      remaining -= 1;
    }
  }

  function update(dt, bounds) {
    for (const particle of particles) {
      if (!particle.active) continue;
      particle.life -= dt;
      if (particle.life <= 0 || particle.y > bounds.height + 30) {
        particle.active = false;
        continue;
      }
      if (particle.mode === "wither") particle.vy += 28 * dt;
      else {
        particle.vx *= Math.pow(0.985, dt * 60);
        particle.vy *= Math.pow(0.985, dt * 60);
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rotation += particle.spin * dt;
    }
  }

  function draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const particle of particles) {
      if (!particle.active) continue;
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha * 0.82;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, particle.size * 1.6, particle.size * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  return {
    emitBurst, update, draw,
    clear() { for (const particle of particles) particle.active = false; },
    get activeCount() { return particles.reduce((sum, particle) => sum + Number(particle.active), 0); },
  };
}
