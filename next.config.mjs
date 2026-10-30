/** @type {import('next').NextConfig} */

// Scene videos/posters and the landing cover live under versioned paths
// (public/scenes/v2, public/cover). Change the path when an asset changes so
// a year-long immutable cache is always safe.
const IMMUTABLE = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow scene images from any HTTPS source once real images are added
    remotePatterns: [],
  },
  async headers() {
    return [
      { source: "/scenes/:path*", headers: IMMUTABLE },
      { source: "/cover/:path*", headers: IMMUTABLE },
      // Ambient tracks are served from public/audio by Vercel's CDN. Their
      // names are not versioned, so cache for 30 days rather than forever.
      {
        source: "/audio/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
    ];
  },
};

export default nextConfig;
