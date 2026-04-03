"use client";

import { useEffect, useRef } from "react";

interface Props {
  intensity?: "light" | "medium" | "heavy";
}

export default function RainOverlay({ intensity = "medium" }: Props) {
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

    const dropCount = intensity === "light" ? 80 : intensity === "medium" ? 140 : 220;

    const drops: { x: number; y: number; speed: number; length: number; opacity: number }[] = [];

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 4 + Math.random() * 6,
        length: 12 + Math.random() * 20,
        opacity: 0.08 + Math.random() * 0.18,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drops.forEach((drop) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(180, 210, 240, ${drop.opacity})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * 0.25, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= drop.speed * 0.25;

        if (drop.y > canvas.height + drop.length) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
        if (drop.x < -50) {
          drop.x = canvas.width + 20;
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
