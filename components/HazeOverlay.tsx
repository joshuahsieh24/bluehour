"use client";

interface Props {
  color?: string;
  opacity?: number;
}

export default function HazeOverlay({
  color = "rgba(100, 120, 180, 0.1)",
  opacity = 0.3,
}: Props) {
  return (
    <>
      {/* Primary haze band */}
      <div
        className="absolute inset-0 pointer-events-none animate-haze"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
          opacity,
        }}
      />
      {/* Secondary slower band */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent 40%, ${color} 65%, transparent 100%)`,
          opacity: opacity * 0.5,
          animation: "haze 20s ease-in-out infinite alternate-reverse",
        }}
      />
    </>
  );
}
