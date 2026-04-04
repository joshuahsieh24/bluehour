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
      {/* Layout: wordmark + tagline anchored in upper sky (~16vh from top),
          CTA group pushed down with generous breathing room (~10vh gap).
          This gives the image more presence and the cover better rhythm.  */}
      <div className="absolute inset-0 flex flex-col items-center justify-start" style={{ paddingTop: "16vh" }}>

        {/* Halo behind wordmark — unobtrusive glow, not a hard darkening */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "9vh",
            left: "50%",
            transform: "translateX(-50%)",
            width: 440,
            height: 220,
            background: "radial-gradient(ellipse, rgba(4, 6, 20, 0.42) 0%, transparent 72%)",
            filter: "blur(32px)",
          }}
        />

        {/* Wordmark + tagline */}
        <motion.div
          className="relative flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.0, ease: "easeOut" }}
        >
          <h1
            className="font-light"
            style={{
              fontSize: "clamp(44px, 5.5vw, 62px)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "rgba(255, 255, 255, 0.93)",
              textShadow: [
                "0 0 52px rgba(110, 148, 255, 0.28)",
                "0 0 110px rgba(70, 90, 210, 0.10)",
                "0 2px 20px rgba(0, 0, 28, 0.68)",
              ].join(", "),
            }}
          >
            bluehour
          </h1>

          <motion.p
            className="font-light mt-4"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "rgba(255, 255, 255, 0.24)",
              textTransform: "uppercase",
              textShadow: "0 1px 10px rgba(0, 0, 22, 0.6)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.0, delay: 0.5, ease: "easeOut" }}
          >
            a place to settle in
          </motion.p>
        </motion.div>

        {/* CTA group — separated with intentional breathing room */}
        <motion.div
          className="flex flex-col items-center"
          style={{ marginTop: "9vh" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, delay: 0.9, ease: "easeOut" }}
        >
          <Link
            href="/focus"
            style={{
              display: "block",
              padding: "11px 52px",
              fontSize: 13,
              fontWeight: 300,
              letterSpacing: "0.15em",
              color: "rgba(255, 255, 255, 0.82)",
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.11)",
              borderRadius: 999,
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 2px 28px rgba(60, 80, 200, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
              textDecoration: "none",
              transition: "all 0.4s ease",
            }}
            onMouseEnter={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255, 255, 255, 0.11)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "rgba(255, 255, 255, 0.96)",
                boxShadow: "0 2px 36px rgba(80, 110, 220, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              });
            }}
            onMouseLeave={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255, 255, 255, 0.07)",
                borderColor: "rgba(255, 255, 255, 0.11)",
                color: "rgba(255, 255, 255, 0.82)",
                boxShadow: "0 2px 28px rgba(60, 80, 200, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
              });
            }}
          >
            Begin
          </Link>

          <motion.div
            style={{ marginTop: 20 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.0, delay: 1.3 }}
          >
            <Link
              href="/history"
              className="font-light"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "rgba(255, 255, 255, 0.18)",
                textDecoration: "none",
                transition: "color 0.4s ease",
                textShadow: "0 1px 8px rgba(0, 0, 20, 0.5)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.44)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.18)"; }}
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
