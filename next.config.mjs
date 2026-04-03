/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow scene images from any HTTPS source once real images are added
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
