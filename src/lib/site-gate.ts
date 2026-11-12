// Edge-safe pre-launch access gate (no Node-only deps) — imported by middleware
// and by the /api/site-access sign-in route.
//
// The whole public site sits behind one shared username + password until KPD
// announces it. Switched on by environment variables only, so it comes off
// without a code change:
//   SITE_GATE_USER + SITE_GATE_PASSWORD  both set  → gate on
//   either one empty, or SITE_GATE=off              → gate off
// Changing the password signs every visitor out (the cookie is derived from it).

// ── Config ────────────────────────────────────────────────────────────────

export const SITE_GATE_COOKIE = "kpd_site_access";
export const SITE_GATE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
/// The page every gated request is rewritten to (the URL in the bar stays the same).
export const SITE_GATE_PATH = "/site-access";

export type SiteGateConfig = { user: string; password: string };

export function siteGateConfig(env: Record<string, string | undefined> = process.env): SiteGateConfig | null {
  if (env.SITE_GATE?.trim().toLowerCase() === "off") return null;
  const user = env.SITE_GATE_USER?.trim() ?? "";
  const password = env.SITE_GATE_PASSWORD ?? "";
  if (!user || !password) return null;
  return { user, password };
}

// ── What stays open ───────────────────────────────────────────────────────

/// Paths that are never gated:
/// - /admin has its own sign-in; /api carries the forms, the RSS cron
///   (Bearer CRON_SECRET) and any webhook, which a browser cookie can't satisfy.
/// - Next's own bundles and the public/ asset folders, so the gate page can
///   load its logo and font (they are not secret: images, CSS, JS, fonts).
/// - What Google's own tools fetch directly: robots.txt, sitemap.xml and any
///   Search Console HTML verification file (google<token>.html), plus icons.
const OPEN_PREFIXES = [
  "/admin/",
  "/api/",
  "/_next/",
  "/legacy/",
  "/assets/",
  "/brand/",
  "/fonts/",
  "/team/",
  "/timeline/",
  "/uploads/",
  "/videos/",
];

const OPEN_EXACT = new Set([
  SITE_GATE_PATH,
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/icon.png",
  "/icon.svg",
  "/apple-icon.png",
  "/opengraph-image",
]);

export function isOpenPath(pathname: string) {
  if (OPEN_EXACT.has(pathname)) return true;
  if (/^\/google[0-9a-z]+\.html$/i.test(pathname)) return true;
  return OPEN_PREFIXES.some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix));
}

// ── Access cookie ─────────────────────────────────────────────────────────

const encoder = new TextEncoder();

async function hmacHex(key: string, message: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/// Same length → compare every character, so timing doesn't leak a prefix match.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/// The cookie value: a keyed hash of the current credentials. It proves the
/// visitor once typed them, never contains them, and stops working as soon as
/// either one changes.
export function siteGateToken(config: SiteGateConfig) {
  return hmacHex(`${config.user}\n${config.password}`, "kpd-site-gate-v1");
}

export async function hasSiteAccess(cookieValue: string | undefined, config: SiteGateConfig) {
  if (!cookieValue) return false;
  return safeEqual(cookieValue, await siteGateToken(config));
}

export async function credentialsMatch(user: string, password: string, config: SiteGateConfig) {
  // Hash both sides so the comparison is fixed-length whatever was typed.
  const [given, expected] = await Promise.all([
    hmacHex("kpd-site-gate-login", `${user.trim()}\n${password}`),
    hmacHex("kpd-site-gate-login", `${config.user}\n${config.password}`),
  ]);
  return safeEqual(given, expected);
}

/// Only same-site paths are allowed as the post-sign-in destination.
export function safeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value === SITE_GATE_PATH || value.startsWith(`${SITE_GATE_PATH}?`)) return "/";
  return value;
}
