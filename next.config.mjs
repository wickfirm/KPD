/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the project root — prevents Next from walking up to a parent folder
  // that contains a stray package-lock.json / postcss config.
  outputFileTracingRoot: import.meta.dirname,
  // Allow Cloudflare R2 / CDN-hosted assets for next/image optimization.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.kpd.ae" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
};

export default nextConfig;
