"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Blue-hour atmospheric particles — drifting upward, cool toned
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; o: number;
      life: number; maxLife: number;
      hue: number;
    };

    const particles: Particle[] = [];

    const spawn = (): Particle => ({
      x: Math.random() * (canvas?.width ?? 1920),
      y: (canvas?.height ?? 1080) * 0.5 + Math.random() * (canvas?.height ?? 1080) * 0.45,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.08 - Math.random() * 0.18,
      r: 0.4 + Math.random() * 1.4,
      o: 0,
      life: 0,
      maxLife: 320 + Math.random() * 400,
      hue: 220 + Math.random() * 50, // blue to indigo range
    });

    for (let i = 0; i < 35; i++) {
      const p = spawn();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      if (frame % 10 === 0 && particles.length < 55) particles.push(spawn());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const prog = p.life / p.maxLife;
        p.o = prog < 0.18
          ? (prog / 0.18) * 0.5
          : prog > 0.82
          ? ((1 - prog) / 0.18) * 0.5
          : 0.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 78%, ${p.o * 0.35})`;
        ctx.fill();

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        // Blue hour: deep indigo sky with warm horizon glow
        background: [
          "radial-gradient(ellipse at 50% 110%, rgba(120, 60, 100, 0.45) 0%, transparent 55%)",
          "radial-gradient(ellipse at 20% 85%, rgba(80, 40, 120, 0.3) 0%, transparent 45%)",
          "radial-gradient(ellipse at 80% 90%, rgba(60, 80, 160, 0.25) 0%, transparent 40%)",
          "linear-gradient(to bottom, #0d1540 0%, #131d52 18%, #1a1f5e 34%, #17235a 50%, #0f1a42 72%, #090e24 100%)",
        ].join(", "),
      }}
    >
      {/* Horizon glow — the warm band at blue hour */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "12%",
          left: 0,
          right: 0,
          height: "28%",
          background:
            "radial-gradient(ellipse at 45% 100%, rgba(180, 90, 130, 0.22) 0%, rgba(120, 70, 160, 0.12) 40%, transparent 70%)",
        }}
      />

      {/* Faint star field — tiny static dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "radial-gradient(1px 1px at 12% 18%, rgba(200,220,255,0.4) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 35% 8%, rgba(200,220,255,0.3) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 58% 22%, rgba(200,220,255,0.35) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 74% 11%, rgba(200,220,255,0.25) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 88% 28%, rgba(200,220,255,0.3) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 22% 38%, rgba(200,220,255,0.2) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 65% 5%, rgba(200,220,255,0.4) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 91% 42%, rgba(200,220,255,0.22) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 48% 32%, rgba(200,220,255,0.3) 0%, transparent 100%)",
            "radial-gradient(1.5px 1.5px at 78% 58%, rgba(200,220,255,0.18) 0%, transparent 100%)",
          ].join(", "),
        }}
      />

      {/* Ambient particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.7 }}
      />

      {/* Atmospheric depth gradient — top fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,9,24,0.5) 0%, transparent 30%, transparent 70%, rgba(4,6,16,0.6) 100%)",
        }}
      />

      {/* Grain */}
      <div className="grain-overlay" style={{ opacity: 0.02 }} />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      >
        {/* Wordmark */}
        <motion.h1
          className="font-light tracking-tight mb-3"
          style={{
            fontSize: 54,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "rgba(210, 225, 255, 0.92)",
            textShadow: "0 0 60px rgba(120, 140, 220, 0.35)",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.25 }}
        >
          bluehour
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="font-light mb-14"
          style={{
            color: "rgba(170, 190, 240, 0.45)",
            fontSize: 14,
            letterSpacing: "0.08em",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.55 }}
        >
          a place to settle in
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.85 }}
        >
          <Link
            href="/focus"
            className="no-select"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "11px 46px",
              borderRadius: 999,
              background: "rgba(120, 150, 220, 0.1)",
              border: "1px solid rgba(160, 190, 255, 0.2)",
              color: "rgba(200, 220, 255, 0.88)",
              fontSize: 13,
              fontWeight: 300,
              letterSpacing: "0.08em",
              textDecoration: "none",
              transition: "all 500ms ease",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(120, 150, 220, 0.18)";
              el.style.borderColor = "rgba(160, 190, 255, 0.35)";
              el.style.color = "rgba(220, 235, 255, 0.95)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(120, 150, 220, 0.1)";
              el.style.borderColor = "rgba(160, 190, 255, 0.2)";
              el.style.color = "rgba(200, 220, 255, 0.88)";
            }}
          >
            begin
          </Link>

          <Link
            href="/history"
            className="font-light no-select"
            style={{
              color: "rgba(150, 175, 230, 0.32)",
              fontSize: 12,
              letterSpacing: "0.06em",
              textDecoration: "none",
              transition: "color 400ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(170, 195, 240, 0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(150, 175, 230, 0.32)";
            }}
          >
            history
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        className="absolute bottom-8 font-light no-select"
        style={{
          color: "rgba(140, 165, 220, 0.2)",
          fontSize: 10,
          letterSpacing: "0.1em",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
      >
        best in fullscreen on a second monitor
      </motion.p>
    </div>
  );
}
