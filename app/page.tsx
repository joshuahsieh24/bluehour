"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="fixed inset-0 overflow-hidden no-select" style={{ background: "#080a18" }}>

      {/* ── Background image — animesky4k.jpg (5803×3264, served from Vercel edge) */}
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
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />

      {/* ── Overlay — one pass, restrained
           Upper sky is already deep blue/purple — text sits cleanly without
           heavy darkening. Lighter touch lets the 4K quality breathe.      */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(4, 5, 16, 0.48) 0%,
            rgba(4, 5, 16, 0.18) 22%,
            transparent           44%,
            rgba(2, 3, 10, 0.22)  70%,
            rgba(2, 3, 10, 0.52)  100%
          )`,
        }}
      />

      {/* ── Edge vignette */}
      <div className="absolute inset-0 vignette" />

      {/* ── Film grain — very subtle */}
      <div className="grain-overlay" style={{ opacity: 0.022 }} />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {/* Text sits in the upper sky — calm deep blue, naturally readable.
          Soft radial halo behind it just in case of bright content at top. */}
      <div className="absolute inset-0 flex flex-col items-center" style={{ justifyContent: "flex-start", paddingTop: "13vh" }}>

        {/* Halo — keeps text legible over any image content */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "7vh",
            left: "50%",
            transform: "translateX(-50%)",
            width: 480,
            height: 260,
            background: "radial-gradient(ellipse, rgba(4, 6, 20, 0.48) 0%, transparent 70%)",
            filter: "blur(28px)",
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
              fontSize: "clamp(44px, 5.5vw, 62px)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "rgba(255, 255, 255, 0.93)",
              textShadow: [
                "0 0 52px rgba(110, 148, 255, 0.32)",
                "0 0 110px rgba(70, 90, 210, 0.12)",
                "0 2px 20px rgba(0, 0, 28, 0.72)",
              ].join(", "),
            }}
            initial={{ opacity: 0, y: 12 }}
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
              color: "rgba(255, 255, 255, 0.26)",
              textTransform: "uppercase",
              textShadow: "0 1px 10px rgba(0, 0, 22, 0.65)",
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
                border: "1px solid rgba(255, 255, 255, 0.11)",
                borderRadius: 999,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow: "0 2px 28px rgba(60, 80, 200, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
                textDecoration: "none",
                transition: "all 0.4s ease",
              }}
              onMouseEnter={(e) => {
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "rgba(255, 255, 255, 0.11)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "rgba(255, 255, 255, 0.96)",
                  boxShadow: "0 2px 36px rgba(80, 110, 220, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                });
              }}
              onMouseLeave={(e) => {
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "rgba(255, 255, 255, 0.07)",
                  borderColor: "rgba(255, 255, 255, 0.11)",
                  color: "rgba(255, 255, 255, 0.82)",
                  boxShadow: "0 2px 28px rgba(60, 80, 200, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
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
                textShadow: "0 1px 8px rgba(0, 0, 20, 0.5)",
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
