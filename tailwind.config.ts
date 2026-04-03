import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#0f1115",
        panel: "#171920",
        surface: "#1d2028",
      },
      animation: {
        "drift-slow": "drift 40s ease-in-out infinite alternate",
        "drift-med": "drift 25s ease-in-out infinite alternate",
        "grain": "grain 0.5s steps(1) infinite",
        "haze": "haze 14s ease-in-out infinite alternate",
        "dust": "dust 7s ease-in-out infinite",
        "fade-in": "fadeIn 0.7s ease forwards",
        "fade-in-slow": "fadeIn 1.4s ease forwards",
        "scale-in": "scaleIn 0.5s ease forwards",
        "pulse-ring": "pulseRing 3s ease-in-out infinite",
        "slide-up": "slideUp 0.6s ease forwards",
      },
      keyframes: {
        drift: {
          "0%": { transform: "scale(1.06) translate(0px, 0px)" },
          "25%": { transform: "scale(1.09) translate(-10px, -6px)" },
          "50%": { transform: "scale(1.07) translate(6px, -10px)" },
          "75%": { transform: "scale(1.08) translate(-4px, 8px)" },
          "100%": { transform: "scale(1.06) translate(8px, -4px)" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0%, 0%)" },
          "10%": { transform: "translate(-2%, -3%)" },
          "20%": { transform: "translate(3%, 2%)" },
          "30%": { transform: "translate(-1%, 4%)" },
          "40%": { transform: "translate(4%, -1%)" },
          "50%": { transform: "translate(-3%, 3%)" },
          "60%": { transform: "translate(2%, -4%)" },
          "70%": { transform: "translate(-4%, 1%)" },
          "80%": { transform: "translate(1%, -2%)" },
          "90%": { transform: "translate(3%, 4%)" },
        },
        haze: {
          "0%": { opacity: "0.15", transform: "translateX(-8%) scaleY(1) skewX(-2deg)" },
          "33%": { opacity: "0.35", transform: "translateX(0%) scaleY(1.04) skewX(1deg)" },
          "66%": { opacity: "0.22", transform: "translateX(5%) scaleY(0.97) skewX(-1deg)" },
          "100%": { opacity: "0.28", transform: "translateX(-3%) scaleY(1.02) skewX(2deg)" },
        },
        dust: {
          "0%": { transform: "translateY(0px) translateX(0px)", opacity: "0" },
          "15%": { opacity: "0.7" },
          "85%": { opacity: "0.5" },
          "100%": { transform: "translateY(-100px) translateX(25px)", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
