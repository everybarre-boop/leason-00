// 외부 라이브러리 없이 동작하는 간단한 canvas 컨페티 효과.
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
};

const COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

export function fireConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const particleCount = 150;
  const particles: Particle[] = Array.from({ length: particleCount }, () => ({
    x: width / 2,
    y: height / 2,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 4,
    size: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
  }));

  const gravity = 0.3;
  const drag = 0.992;
  const durationMs = 2500;
  let start: number | null = null;

  function frame(now: number) {
    if (start === null) start = now;
    const elapsed = now - start;
    const fade = Math.max(0, 1 - elapsed / durationMs);

    ctx!.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.globalAlpha = fade;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    }

    if (elapsed < durationMs) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
