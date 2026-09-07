/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the project root — prevents Next from walking up to a parent folder
  // that contains a stray package-lock.json / postcss config.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
