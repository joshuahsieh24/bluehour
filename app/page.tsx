"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle particle ambient for the landing page
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

    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number; life: number; maxLife: number }[] = [];

    const spawn = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.3 + Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.1 - Math.random() * 0.25,
        r: 0.5 + Math.random() * 1.2,
        o: 0,
        life: 0,
        maxLife: 250 + Math.random() * 350,
      });
    };

    for (let i = 0; i < 25; i++) {
      spawn();
      particles[particles.length - 1].life = Math.random() * particles[particles.length - 1].maxLife;
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      if (frame % 12 === 0 && particles.length < 45) spawn();

      particles.forEach((p, i) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const prog = p.life / p.maxLife;
        p.o = prog < 0.2 ? (prog / 0.2) * 0.4 : prog > 0.8 ? ((1 - prog) / 0.2) * 0.4 : 0.4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 180, 220, ${p.o * 0.4})`;
        ctx.fill();
        if (p.life >= p.maxLife) particles.splice(i, 1);
      });

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
      style={{ background: "radial-gradient(ellipse at 40% 60%, #1a1f2e 0%, #0f1115 55%, #090b0f 100%)" }}
    >
      {/* Ambient canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Grain */}
      <div className="grain-overlay" style={{ opacity: 0.025 }} />

      {/* Vignette */}
      <div className="vignette" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Wordmark */}
        <motion.h1
          className="font-light mb-4 tracking-tight"
          style={{
            fontSize: 52,
            color: "rgba(255,255,255,0.88)",
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          bluehour
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="font-light mb-16"
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 15,
            letterSpacing: "0.05em",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          a place to settle in
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <Link
            href="/focus"
            className="no-select transition-all duration-500"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "12px 44px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.88)",
              fontSize: 14,
              fontWeight: 300,
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.11)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            begin
          </Link>

          <Link
            href="/history"
            className="font-light transition-all duration-400 no-select"
            style={{
              color: "rgba(255,255,255,0.28)",
              fontSize: 13,
              letterSpacing: "0.04em",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)";
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
          color: "rgba(255,255,255,0.18)",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        best in fullscreen on a second monitor
      </motion.p>
    </div>
  );
}
