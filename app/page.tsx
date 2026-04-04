"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      // Spawn in the lower half — they drift upward and fade naturally
      y: (canvas?.height ?? 1080) * 0.55 + Math.random() * (canvas?.height ?? 1080) * 0.4,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -0.06 - Math.random() * 0.14,
      r: 0.3 + Math.random() * 1.1,
      o: 0,
      life: 0,
      maxLife: 400 + Math.random() * 500,
      hue: 215 + Math.random() * 55,
    });

    // Seed with staggered lifetimes so page doesn't start empty
    for (let i = 0; i < 28; i++) {
      const p = spawn();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      if (frame % 14 === 0 && particles.length < 40) particles.push(spawn());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const prog = p.life / p.maxLife;
        // Softer fade — max opacity is lower so they read as atmosphere, not sparks
        p.o = prog < 0.2
          ? (prog / 0.2) * 0.32
          : prog > 0.78
          ? ((1 - prog) / 0.22) * 0.32
          : 0.32;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 80%, ${p.o * 0.7})`;
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
        // Richer blue-hour sky — more violet in the upper register,
        // warmer indigo mid, soft teal-blue at the "horizon"
        background: [
          "radial-gradient(ellipse at 50% 100%, rgba(100, 45, 85, 0.38) 0%, transparent 52%)",
          "radial-gradient(ellipse at 22% 80%, rgba(65, 35, 110, 0.22) 0%, transparent 42%)",
          "radial-gradient(ellipse at 78% 88%, rgba(45, 65, 140, 0.18) 0%, transparent 38%)",
          "linear-gradient(to bottom, #0a1235 0%, #10185a 22%, #18206a 40%, #15215e 58%, #0d1845 78%, #080f2c 100%)",
        ].join(", "),
      }}
    >
      {/* Horizon warmth — softer, higher up so no hard bottom band */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 48% 92%, rgba(160, 80, 120, 0.18) 0%, rgba(100, 60, 150, 0.08) 35%, transparent 60%)",
        }}
      />

      {/* Mid-sky atmospheric depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(60, 80, 180, 0.1) 0%, transparent 55%)",
        }}
      />

      {/* Stars — varied opacity, scattered across upper two-thirds only */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "radial-gradient(1px 1px at 8%  14%, rgba(210,225,255,0.55) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 19% 7%,  rgba(210,225,255,0.35) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 33% 19%, rgba(210,225,255,0.28) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 47% 4%,  rgba(210,225,255,0.45) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 61% 13%, rgba(210,225,255,0.32) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 72% 6%,  rgba(210,225,255,0.22) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 84% 21%, rgba(210,225,255,0.4)  0%, transparent 100%)",
            "radial-gradient(1px 1px at 93% 9%,  rgba(210,225,255,0.3)  0%, transparent 100%)",
            "radial-gradient(1px 1px at 26% 32%, rgba(210,225,255,0.18) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 55% 28%, rgba(210,225,255,0.24) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 79% 36%, rgba(210,225,255,0.16) 0%, transparent 100%)",
            "radial-gradient(1.5px 1.5px at 41% 11%, rgba(220,235,255,0.6) 0%, transparent 100%)",
          ].join(", "),
          // Fade stars out toward the horizon so they feel sky-accurate
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, transparent 78%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, transparent 78%)",
        }}
      />

      {/* Particle canvas — atmospheric dust rising from below */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.55 }}
      />

      {/* Soft bloom behind the content area — the "evening air" around the wordmark */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "28%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          height: 260,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(80, 110, 220, 0.12) 0%, rgba(60, 80, 180, 0.06) 50%, transparent 75%)",
          filter: "blur(24px)",
        }}
      />

      {/* Top edge darkening — subtle, not a band */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,7,20,0.55) 0%, rgba(4,7,20,0.1) 18%, transparent 35%, transparent 80%, rgba(4,7,20,0.25) 100%)",
        }}
      />

      {/* Grain */}
      <div className="grain-overlay" style={{ opacity: 0.018 }} />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Wordmark */}
        <motion.h1
          className="font-light tracking-tight mb-3"
          style={{
            fontSize: 54,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "rgba(205, 222, 255, 0.9)",
            // Layered glow: soft blue halo + faint indigo outer
            textShadow: [
              "0 0 40px rgba(100, 130, 230, 0.4)",
              "0 0 90px rgba(70, 90, 200, 0.18)",
              "0 2px 12px rgba(0, 0, 30, 0.5)",
            ].join(", "),
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          bluehour
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="font-light mb-14"
          style={{
            color: "rgba(160, 185, 240, 0.42)",
            fontSize: 13,
            letterSpacing: "0.09em",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
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
              padding: "10px 44px",
              borderRadius: 999,
              // Glass pill — picks up the sky colour behind it
              background: "rgba(100, 130, 210, 0.09)",
              border: "1px solid rgba(150, 180, 255, 0.18)",
              color: "rgba(195, 215, 255, 0.85)",
              fontSize: 13,
              fontWeight: 300,
              letterSpacing: "0.09em",
              textDecoration: "none",
              transition: "background 500ms ease, border-color 500ms ease, color 400ms ease, box-shadow 500ms ease",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 1px 24px rgba(60, 80, 200, 0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(100, 130, 210, 0.16)";
              el.style.borderColor = "rgba(160, 190, 255, 0.3)";
              el.style.color = "rgba(215, 230, 255, 0.95)";
              el.style.boxShadow = "0 1px 32px rgba(80, 110, 220, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(100, 130, 210, 0.09)";
              el.style.borderColor = "rgba(150, 180, 255, 0.18)";
              el.style.color = "rgba(195, 215, 255, 0.85)";
              el.style.boxShadow = "0 1px 24px rgba(60, 80, 200, 0.1), inset 0 1px 0 rgba(255,255,255,0.06)";
            }}
          >
            begin
          </Link>

          <Link
            href="/history"
            className="font-light no-select"
            style={{
              color: "rgba(140, 168, 225, 0.3)",
              fontSize: 12,
              letterSpacing: "0.06em",
              textDecoration: "none",
              transition: "color 450ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(165, 192, 240, 0.58)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(140, 168, 225, 0.3)";
            }}
          >
            history
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        className="absolute bottom-7 font-light no-select"
        style={{
          color: "rgba(130, 158, 220, 0.18)",
          fontSize: 10,
          letterSpacing: "0.1em",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.7 }}
      >
        best in fullscreen on a second monitor
      </motion.p>
    </div>
  );
}
