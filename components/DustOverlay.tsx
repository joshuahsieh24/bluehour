"use client";

import { useEffect, useRef } from "react";

export default function DustOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      maxLife: number;
    }[] = [];

    const spawn = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.4 + Math.random() * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: 0.5 + Math.random() * 1.5,
        opacity: 0,
        life: 0,
        maxLife: 200 + Math.random() * 300,
      });
    };

    // Seed initial particles
    for (let i = 0; i < 30; i++) {
      spawn();
      const p = particles[particles.length - 1];
      p.life = Math.random() * p.maxLife;
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      if (frame % 8 === 0 && particles.length < 60) spawn();

      particles.forEach((p, i) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        p.opacity =
          progress < 0.15
            ? (progress / 0.15) * 0.6
            : progress > 0.85
            ? ((1 - progress) / 0.15) * 0.6
            : 0.6;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 215, 230, ${p.opacity * 0.5})`;
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
