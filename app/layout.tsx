import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Self-hosted at build time: no render-blocking request to Google Fonts and no
// flash of fallback text.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "bluehour",
  description: "a place to settle in",
  keywords: ["focus", "ambient", "productivity", "timer", "calm"],
  openGraph: {
    title: "bluehour",
    description: "a place to settle in",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f1115",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
