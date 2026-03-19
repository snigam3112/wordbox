"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#38bdf8", "#f1f5f9"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = 120;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.3,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: Math.random() * 10 + 6,
      height: Math.random() * 6 + 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    }));

    const start = performance.now();
    const duration = 3000;
    let rafId: number;

    function draw(now: number) {
      if (!ctx || !canvas) return;
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allDone = true;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07; // gravity
        p.rotation += p.rotationSpeed;

        // Fade out in the bottom 30% of screen
        const fadeStart = canvas.height * 0.7;
        if (p.y > fadeStart) {
          p.opacity = Math.max(0, 1 - (p.y - fadeStart) / (canvas.height * 0.3));
        }

        if (p.opacity > 0 && elapsed < duration + 1000) {
          allDone = false;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          ctx.restore();
        }
      }

      if (!allDone && elapsed < duration + 1500) {
        rafId = requestAnimationFrame(draw);
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 200,
      }}
    />
  );
}
