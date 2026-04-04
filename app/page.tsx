"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Cover image is served directly from Next.js / Vercel's edge CDN via the
// public/ folder — no GitHub raw CDN, no rate limits, proper cache headers.
const COVER_IMAGE = "/cover.png";

export default function LandingPage() {
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  // Cover image is a committed local asset — always use it.
  // Keep imageFailed as a fallback in case of unexpected load errors.
  // Always show the cover image (committed local asset); CSS fallback if it somehow fails
  const useImage = true;

  // Star field — only drawn in CSS-fallback mode (image has its own stars)
  useEffect(() => {
    if (useImage) return;
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

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.55,
      r: Math.random() * 0.9 + 0.2,
      baseOp: Math.random() * 0.65 + 0.1,
      phase: Math.random() * Math.PI * 2,
      freq: 0.3 + Math.random() * 0.6,
    }));

    let frame = 0;
    const raf = { id: 0 };
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = frame / 60;
      stars.forEach((s) => {
        const op = Math.max(0.04, s.baseOp + Math.sin(t * s.freq + s.phase) * 0.12);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215, 225, 255, ${op})`;
        ctx.fill();
      });
      frame++;
      raf.id = requestAnimationFrame(render);
    };
    raf.id = requestAnimationFrame(render);

    return () => { cancelAnimationFrame(raf.id); window.removeEventListener("resize", resize); };
  }, [useImage]);

  return (
    <div className="fixed inset-0 overflow-hidden no-select" style={{ background: "#0c0e22" }}>

      {/* ── Background ────────────────────────────────────────────────────────── */}
      {useImage ? (
        // ── Real image ────────────────────────────────────────────────────────
        <>
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${COVER_IMAGE})`,
              backgroundSize: "cover",
              backgroundPosition: "center 35%",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          {/* Top gradient — darkens sky so text sits cleanly in it */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                rgba(8, 10, 28, 0.72) 0%,
                rgba(8, 10, 28, 0.45) 18%,
                rgba(8, 10, 28, 0.1)  36%,
                transparent           55%,
                rgba(4, 5, 14, 0.3)   75%,
                rgba(4, 5, 14, 0.65)  100%
              )`,
            }}
          />
          {/* Edge vignette */}
          <div className="absolute inset-0 vignette" />
        </>
      ) : (
        // ── CSS fallback — palette extracted from the reference image ────────
        <>
          {/* Sky body: clean royal blue → purple → pink cloud band → warm horizon → dark ground */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                180deg,
                #0c0e22 0%,
                #181e50 7%,
                #1e2870 14%,
                #263898 22%,
                #2c40b0 30%,
                #3848b8 36%,
                #5046b0 42%,
                #8850a0 46%,
                #c45080 50%,
                #d87040 53%,
                #e8a838 55%,
                #c87840 58%,
                #6a4868 62%,
                #283870 67%,
                #1e2c58 73%,
                #12183a 80%,
                #0a0e1e 88%,
                #060810 95%,
                #030508 100%
              )`,
            }}
          />
          {/* Warm horizon sun glow */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                ellipse 88% 22% at 52% 54%,
                rgba(232, 140, 48, 0.62) 0%,
                rgba(200, 80, 70, 0.3)  45%,
                transparent 72%
              )`,
            }}
          />
          {/* Vivid pink cloud band */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                ellipse 80% 10% at 50% 49%,
                rgba(210, 60, 110, 0.45) 0%,
                transparent 70%
              )`,
            }}
          />
          {/* Road-light amber glow — lower right, imitates the winding road */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                ellipse 38% 20% at 72% 78%,
                rgba(200, 130, 30, 0.28) 0%,
                transparent 65%
              )`,
            }}
          />
          {/* Blue ambient — mid sky */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                ellipse 65% 30% at 48% 34%,
                rgba(44, 58, 160, 0.25) 0%,
                transparent 70%
              )`,
            }}
          />
          {/* Top veil */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, rgba(8, 10, 24, 0.5) 0%, transparent 22%)` }}
          />
          {/* Ground */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, rgba(3, 4, 10, 0.96) 0%, rgba(3, 4, 10, 0.45) 10%, transparent 24%)` }}
          />
        </>
      )}

      {/* Stars — CSS fallback only */}
      {!useImage && (
        <canvas
          ref={starCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.1) 55%, transparent 66%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.1) 55%, transparent 66%)",
          }}
        />
      )}

      {/* Film grain */}
      <div className="grain-overlay" style={{ opacity: useImage ? 0.028 : 0.02 }} />

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      {/*
        When the real image is present, content sits in the upper sky area
        (calm blue, good contrast) while the full landscape unfolds below.
        In CSS mode, content stays centered in the gradient.
      */}
      <div
        className="absolute inset-0 flex flex-col items-center"
        style={{
          justifyContent: useImage ? "flex-start" : "center",
          paddingTop: useImage ? "14vh" : 0,
        }}
      >
        {/* Soft dark halo behind text — prevents any image content interfering */}
        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            top: useImage ? "8vh" : "calc(50% - 140px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 520,
            height: 280,
            background: "radial-gradient(ellipse, rgba(6, 8, 22, 0.55) 0%, transparent 68%)",
            filter: "blur(24px)",
          }}
        />

        <motion.div
          className="relative flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
        >
          {/* Wordmark */}
          <motion.h1
            className="font-light"
            style={{
              fontSize: "clamp(42px, 5.5vw, 60px)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "rgba(255, 255, 255, 0.92)",
              textShadow: [
                "0 0 48px rgba(120, 160, 255, 0.35)",
                "0 0 100px rgba(80, 100, 220, 0.14)",
                "0 2px 18px rgba(0, 0, 30, 0.75)",
              ].join(", "),
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.2, ease: "easeOut" }}
          >
            bluehour
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="font-light mt-3"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "rgba(255, 255, 255, 0.28)",
              textTransform: "uppercase",
              textShadow: "0 1px 8px rgba(0,0,20,0.6)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, delay: 0.65, ease: "easeOut" }}
          >
            a place to settle in
          </motion.p>

          {/* Begin */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 1.0, ease: "easeOut" }}
          >
            <Link
              href="/focus"
              style={{
                display: "block",
                padding: "11px 48px",
                fontSize: 13,
                fontWeight: 300,
                letterSpacing: "0.15em",
                color: "rgba(255, 255, 255, 0.82)",
                background: "rgba(255, 255, 255, 0.07)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 999,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow:
                  "0 2px 28px rgba(60, 80, 200, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                textDecoration: "none",
                transition: "all 0.4s ease",
              }}
              onMouseEnter={(e) => {
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "rgba(255, 255, 255, 0.11)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "rgba(255, 255, 255, 0.96)",
                  boxShadow: "0 2px 36px rgba(80, 110, 220, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                });
              }}
              onMouseLeave={(e) => {
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "rgba(255, 255, 255, 0.07)",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  color: "rgba(255, 255, 255, 0.82)",
                  boxShadow: "0 2px 28px rgba(60, 80, 200, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                });
              }}
            >
              Begin
            </Link>
          </motion.div>

          {/* History */}
          <motion.div
            className="mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, delay: 1.35 }}
          >
            <Link
              href="/history"
              className="font-light"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "rgba(255, 255, 255, 0.2)",
                textDecoration: "none",
                transition: "color 0.4s ease",
                textShadow: "0 1px 8px rgba(0,0,20,0.5)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.48)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; }}
            >
              history
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        className="absolute bottom-7 left-0 right-0 text-center font-light"
        style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.1)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.4, delay: 2.0 }}
      >
        best on a second monitor · fullscreen
      </motion.p>
    </div>
  );
}
