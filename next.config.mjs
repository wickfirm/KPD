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
    // AVIF first (≈20–30% smaller than WebP), WebP as fallback.
    formats: ["image/avif", "image/webp"],
    // Optimized images stay cached on Vercel's edge even when an R2 object
    // ships without a long Cache-Control (the default TTL is only 60s).
    minimumCacheTTL: 2678400,
  },
  poweredByHeader: false,
  /// The delivered legacy design assets are content-stable: browsers keep them
  /// for a day and the edge serves stale copies while revalidating in background.
  async headers() {
    return [
      {
        source: "/legacy/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      /// The delivered article templates and legal copies are served as files.
      /// They are not pages to rank (the real pages live at /news/<slug> and
      /// /terms etc.), so ask search engines not to index them.
      ...["blog-article", "news-article", "terms", "privacy-policy", "cookie-policy"].map((file) => ({
        source: `/legacy/${file}.html`,
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      })),
    ];
  },
  /// Canonical public routes are the clean Next.js URLs. Keep the delivered
  /// HTML addresses as permanent redirects so existing links do not 404.
  async redirects() {
    return [
      { source: "/legacy/index.html", destination: "/", permanent: true },
      { source: "/legacy/about-us.html", destination: "/about", permanent: true },
      { source: "/legacy/contact.html", destination: "/contact", permanent: true },
      { source: "/legacy/news.html", destination: "/news", permanent: true },
      { source: "/legacy/invest-in-dubai.html", destination: "/invest-in-dubai", permanent: true },
      { source: "/legacy/legacy.html", destination: "/legacy", permanent: true },
      { source: "/legacy/single-project.html", destination: "/developments/seven-x-seven", permanent: true },
      { source: "/legacy/emerald-villa.html", destination: "/developments/emerald-villa", permanent: true },
      { source: "/legacy/dubai-hills-mansion.html", destination: "/developments/dubai-hills-mansion", permanent: true },
      { source: "/legacy/news-article.html", destination: "/news", permanent: true },
      { source: "/legacy/blog-article.html", destination: "/news", permanent: true },
      { source: "/legacy/terms.html", destination: "/terms", permanent: true },
      { source: "/legacy/privacy-policy.html", destination: "/privacy-policy", permanent: true },
      { source: "/legacy/cookie-policy.html", destination: "/cookie-policy", permanent: true },
    ];
  },
};

export default nextConfig;
