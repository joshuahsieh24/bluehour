"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// COVER_IMAGE — set to your image URL to replace the CSS gradient with a photo
// or illustration. When empty, the atmospheric CSS gradient is shown instead.
// e.g. "https://raw.githubusercontent.com/joshuahsieh24/bluehour/main/public/cover.jpg"
const COVER_IMAGE = "";
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const starCanvasRef = useRef<HTMLCanvasElement>(null);

  // Star field — canvas only, avoids SSR/hydration mismatch
  useEffect(() => {
    const canvas = starCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.6,
      r: Math.random() * 0.8 + 0.25,
      baseOp: Math.random() * 0.6 + 0.12,
      phase: Math.random() * Math.PI * 2,
      freq: 0.35 + Math.random() * 0.5,
    }));

    let frame = 0;
    const raf = { id: 0 };
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = frame / 60;
      stars.forEach((s) => {
        const twinkle = Math.sin(t * s.freq + s.phase) * 0.11;
        const op = Math.max(0.04, s.baseOp + twinkle);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215, 225, 255, ${op})`;
        ctx.fill();
      });
      frame++;
      raf.id = requestAnimationFrame(render);
    };
    raf.id = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf.id);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden no-select"
      style={{ background: "#05030d" }}
    >

      {/* ── 1. Background ───────────────────────────────────────────────────── */}
      {COVER_IMAGE ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${COVER_IMAGE})` }}
          />
          {/* Tint for text legibility */}
          <div className="absolute inset-0" style={{ background: "rgba(3, 2, 10, 0.42)" }} />
        </>
      ) : (
        <>
          {/* Shinkai-palette sky: deep navy → purple → warm coral horizon → dark ground */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                180deg,
                #04020c 0%,
                #0b0826 9%,
                #160e48 20%,
                #261872 31%,
                #412494 41%,
                #673280 50%,
                #974470 58%,
                #c05f62 65%,
                #d87c4a 70%,
                #c06838 73%,
                #170c28 80%,
                #060310 90%,
                #020108 100%
              )`,
            }}
          />

          {/* Warm horizon sun-glow */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                ellipse 105% 26% at 50% 69%,
                rgba(218, 102, 48, 0.55) 0%,
                rgba(165, 62, 82, 0.28) 44%,
                transparent 72%
              )`,
            }}
          />

          {/* Purple sky ambiance */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                ellipse 72% 36% at 49% 46%,
                rgba(58, 18, 108, 0.3) 0%,
                transparent 68%
              )`,
            }}
          />

          {/* Deep top veil */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(3, 1, 12, 0.58) 0%, transparent 26%)`,
            }}
          />

          {/* Ground silhouette — dark base */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(2, 1, 6, 0.95) 0%, rgba(2, 1, 6, 0.5) 9%, transparent 22%)`,
            }}
          />
        </>
      )}

      {/* ── 2. Stars (canvas) ────────────────────────────────────────────────── */}
      <canvas
        ref={starCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 38%, rgba(0,0,0,0.15) 58%, transparent 70%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 38%, rgba(0,0,0,0.15) 58%, transparent 70%)",
        }}
      />

      {/* ── 3. Film grain ────────────────────────────────────────────────────── */}
      <div className="grain-overlay" style={{ opacity: 0.02 }} />

      {/* ── 4. Vignette ──────────────────────────────────────────────────────── */}
      <div className="vignette" />

      {/* ── 5. Content ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">

        {/* Atmospheric bloom behind wordmark */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400,
            height: 240,
            background:
              "radial-gradient(ellipse, rgba(72, 38, 155, 0.2) 0%, transparent 68%)",
            filter: "blur(32px)",
            transform: "translateY(-10px)",
          }}
        />

        <motion.div
          className="relative flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.4, ease: "easeOut" }}
        >
          {/* Wordmark */}
          <motion.h1
            className="font-light"
            style={{
              fontSize: "clamp(40px, 5.8vw, 58px)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "rgba(255, 255, 255, 0.90)",
              textShadow: [
                "0 0 55px rgba(135, 105, 240, 0.42)",
                "0 0 115px rgba(85, 55, 210, 0.16)",
                "0 2px 20px rgba(0, 0, 22, 0.7)",
              ].join(", "),
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2.0, delay: 0.18, ease: "easeOut" }}
          >
            bluehour
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="font-light mt-4"
            style={{
              fontSize: 11,
              letterSpacing: "0.24em",
              color: "rgba(255, 255, 255, 0.24)",
              textTransform: "uppercase",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.0, delay: 0.7, ease: "easeOut" }}
          >
            a place to settle in
          </motion.p>

          {/* Begin */}
          <motion.div
            className="mt-14"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 1.05, ease: "easeOut" }}
          >
            <Link
              href="/focus"
              style={{
                display: "block",
                padding: "11px 46px",
                fontSize: 13,
                fontWeight: 300,
                letterSpacing: "0.15em",
                color: "rgba(255, 255, 255, 0.80)",
                background: "rgba(255, 255, 255, 0.062)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 999,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow:
                  "0 2px 32px rgba(75, 50, 195, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
                textDecoration: "none",
                transition: "all 0.45s ease",
              }}
              onMouseEnter={(e) => {
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.17)",
                  color: "rgba(255, 255, 255, 0.94)",
                  boxShadow:
                    "0 2px 40px rgba(88, 62, 210, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                });
              }}
              onMouseLeave={(e) => {
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "rgba(255, 255, 255, 0.062)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.80)",
                  boxShadow:
                    "0 2px 32px rgba(75, 50, 195, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
                });
              }}
            >
              Begin
            </Link>
          </motion.div>

          {/* History link */}
          <motion.div
            className="mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, delay: 1.4, ease: "easeOut" }}
          >
            <Link
              href="/history"
              className="font-light"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "rgba(255, 255, 255, 0.19)",
                textDecoration: "none",
                transition: "color 0.4s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255, 255, 255, 0.46)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255, 255, 255, 0.19)";
              }}
            >
              history
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ── 6. Footer hint ───────────────────────────────────────────────────── */}
      <motion.p
        className="absolute bottom-7 left-0 right-0 text-center font-light"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "rgba(255, 255, 255, 0.1)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.4, delay: 2.1 }}
      >
        best on a second monitor · fullscreen
      </motion.p>
    </div>
  );
}
