import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f1115" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
