"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="fixed inset-0 overflow-hidden no-select" style={{ background: "#080a18" }}>

      {/* ── Background ──────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/scenes/animesky4k.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.0, ease: "easeInOut" }}
      />

      {/* ── Overlay — single restrained pass ────────────────────────────────
           The upper sky is naturally dark blue/purple. Only the very top
           and bottom need darkening; the middle should be near-transparent
           so the image reads at full strength.                             */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(4, 5, 16, 0.44) 0%,
            rgba(4, 5, 16, 0.12) 20%,
            transparent           40%,
            rgba(2, 3, 10, 0.18)  68%,
            rgba(2, 3, 10, 0.50)  100%
          )`,
        }}
      />

      {/* ── Edge vignette */}
      <div className="absolute inset-0 vignette" />

      {/* ── Film grain */}
      <div className="grain-overlay" style={{ opacity: 0.02 }} />

      {/* ── Content ─────────────────────────────────────────────────────────
           The full UI stack lives within a dedicated sky zone: the top 58%
           of the screen. Everything is vertically centered inside that zone
           with a slight upward bias (paddingBottom) so it reads as "in the
           sky" rather than page-centered.

           Below the 58% zone: pure landscape, no UI. This gives the cover
           a cinematic, editorial feel — the image does the work, the UI
           frames it.

           Two distinct blocks with a fixed 72px gap:
             1. Identity   — wordmark + tagline
             2. Action     — Begin + history

           72px is large enough to create a genuine visual pause between
           the name and the invitation, without feeling like two separate
           sections.                                                        */}
      <div
        className="absolute inset-x-0 flex flex-col items-center justify-center"
        style={{ top: 0, height: "58vh", paddingBottom: "4vh" }}
      >
        {/* Soft halo — purely atmospheric, not a readability crutch */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "12%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 420,
            height: 280,
            background: "radial-gradient(ellipse, rgba(4, 6, 20, 0.36) 0%, transparent 68%)",
            filter: "blur(36px)",
          }}
        />

        {/* ── Identity block ── */}
        <motion.div
          className="relative flex flex-col items-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
        >
          <h1
            className="font-light"
            style={{
              fontSize: "clamp(46px, 5.8vw, 64px)",
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: "rgba(255, 255, 255, 0.94)",
              textShadow: [
                "0 0 56px rgba(100, 140, 255, 0.26)",
                "0 2px 22px rgba(0, 0, 28, 0.65)",
              ].join(", "),
            }}
          >
            bluehour
          </h1>

          {/* Tagline — committed, not disappearing.
              Tighter tracking and higher opacity make it a genuine
              supporting element rather than invisible noise.         */}
          <motion.p
            className="font-light"
            style={{
              marginTop: 14,
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "rgba(255, 255, 255, 0.38)",
              textTransform: "uppercase",
              textShadow: "0 1px 12px rgba(0, 0, 22, 0.55)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.2, delay: 0.55, ease: "easeOut" }}
          >
            a place to settle in
          </motion.p>
        </motion.div>

        {/* ── Fixed gap — the editorial pause ── */}
        <div style={{ height: 72 }} />

        {/* ── Action block ── */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.0, delay: 0.95, ease: "easeOut" }}
        >
          <Link
            href="/focus"
            style={{
              display: "block",
              padding: "11px 52px",
              fontSize: 13,
              fontWeight: 300,
              letterSpacing: "0.14em",
              color: "rgba(255, 255, 255, 0.80)",
              background: "rgba(255, 255, 255, 0.065)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              borderRadius: 999,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 2px 24px rgba(50, 70, 190, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
              textDecoration: "none",
              transition: "all 0.45s ease",
            }}
            onMouseEnter={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255, 255, 255, 0.10)",
                borderColor: "rgba(255, 255, 255, 0.18)",
                color: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 2px 32px rgba(70, 100, 220, 0.17), inset 0 1px 0 rgba(255, 255, 255, 0.09)",
              });
            }}
            onMouseLeave={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255, 255, 255, 0.065)",
                borderColor: "rgba(255, 255, 255, 0.10)",
                color: "rgba(255, 255, 255, 0.80)",
                boxShadow: "0 2px 24px rgba(50, 70, 190, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
              });
            }}
          >
            Begin
          </Link>

          <motion.div
            style={{ marginTop: 18 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.2, delay: 1.4 }}
          >
            <Link
              href="/history"
              className="font-light"
              style={{
                fontSize: 11,
                letterSpacing: "0.09em",
                color: "rgba(255, 255, 255, 0.17)",
                textDecoration: "none",
                transition: "color 0.45s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.17)"; }}
            >
              history
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <motion.p
        className="absolute bottom-6 left-0 right-0 text-center font-light"
        style={{ fontSize: 10, letterSpacing: "0.13em", color: "rgba(255,255,255,0.09)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.8, delay: 2.2 }}
      >
        best on a second monitor · fullscreen
      </motion.p>
    </div>
  );
}
