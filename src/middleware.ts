import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { canViewPath } from "@/lib/permissions";
import { SITE_GATE_COOKIE, SITE_GATE_PATH, hasSiteAccess, isOpenPath, siteGateConfig } from "@/lib/site-gate";
import { DEFAULT_LOCALE, isLocale, isPageAddress, LOCALE_HEADER, LOCALE_PREVIEW_HEADER, localeFromPath, type Locale } from "@/lib/locales";

/// Three jobs:
/// 1. Pre-launch gate (src/lib/site-gate.ts): while SITE_GATE_USER and
///    SITE_GATE_PASSWORD are set, every public page is answered with the
///    sign-in screen until the visitor has the access cookie. /admin, /api,
///    static assets and Google's verification files stay open.
/// 2. Languages (src/lib/locales.ts): "/ar/…" and "/ja/…" are rewritten to the
///    English route behind the prefix, and the x-kpd-locale request header
///    tells server components which language to render. English keeps its
///    unprefixed addresses and passes through exactly as before.
/// 3. Protects the CMS admin area. The token itself is only fully verified here
///    (edge-safe) and re-verified in server components/actions via requireSession().
///    Screens a role may not open are also fast-rejected here as defense in depth
///    (rules: src/lib/permissions.ts). The cookie carries the role from sign-in, so
///    this can lag a role change until the next sign-in; server actions re-read the
///    role from the database and remain the authoritative guard for every change.

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The language prefix comes off first, so "/ar/admin/…" is guarded like "/admin/…".
  const target = localeFromPath(pathname);

  if (target.path === "/admin" || target.path.startsWith("/admin/")) return adminGuard(req, target.path);

  const gate = siteGateConfig();
  if (!gate || isOpenPath(pathname)) return pass(req, target.locale, target.path);
  if (await hasSiteAccess(req.cookies.get(SITE_GATE_COOKIE)?.value, gate)) return pass(req, target.locale, target.path);

  // Show the sign-in screen at the requested URL, so signing in lands right here.
  const gateUrl = req.nextUrl.clone();
  gateUrl.pathname = SITE_GATE_PATH;
  gateUrl.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  const response = NextResponse.rewrite(gateUrl);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/// Lets a public request through in its language. An unprefixed request passes
/// exactly as it did before languages existed, except that locale headers the
/// client sent itself are dropped, so an English address can never be answered
/// in another language. A prefixed one is rewritten to the English route; the
/// prefix is for pages only, so "/ar/legacy/…" and the like are a 404.
function pass(req: NextRequest, locale: Locale, path: string): NextResponse {
  if (locale === DEFAULT_LOCALE) {
    if (!req.headers.has(LOCALE_HEADER) && !req.headers.has(LOCALE_PREVIEW_HEADER)) return NextResponse.next();
    return NextResponse.next({ request: { headers: requestHeadersFor(req, locale) } });
  }
  if (!isPageAddress(path)) return new NextResponse(null, { status: 404 });
  const url = req.nextUrl.clone();
  url.pathname = path;
  return NextResponse.rewrite(url, { request: { headers: requestHeadersFor(req, locale) } });
}

/// The incoming request headers with the language of this response set on
/// x-kpd-locale. It is always written or removed, never inherited.
function requestHeadersFor(req: NextRequest, locale: Locale, preview = false): Headers {
  const requestHeaders = new Headers(req.headers);
  if (locale === DEFAULT_LOCALE) requestHeaders.delete(LOCALE_HEADER);
  else requestHeaders.set(LOCALE_HEADER, locale);
  if (preview) requestHeaders.set(LOCALE_PREVIEW_HEADER, "1");
  else requestHeaders.delete(LOCALE_PREVIEW_HEADER);
  return requestHeaders;
}

async function adminGuard(req: NextRequest, pathname: string) {
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!canViewPath(session.role, pathname)) {
    return NextResponse.redirect(new URL("/admin?denied=1", req.url));
  }

  // An editor previews a translation with ?lang=ar or ?lang=ja. The preview
  // marker lets the root layout skip the published check: a preview is exactly
  // for copy that is not published yet.
  const lang = pathname.startsWith("/admin/preview/") ? req.nextUrl.searchParams.get("lang") : null;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const untouched = !req.headers.has(LOCALE_HEADER) && !req.headers.has(LOCALE_PREVIEW_HEADER);
  if (locale === DEFAULT_LOCALE && untouched) return NextResponse.next();
  return NextResponse.next({ request: { headers: requestHeadersFor(req, locale, locale !== DEFAULT_LOCALE) } });
}

export const config = {
  /// Everything except Next's build output; the gate decides what else is open.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
