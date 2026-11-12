import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { canViewPath } from "@/lib/permissions";
import { SITE_GATE_COOKIE, SITE_GATE_PATH, hasSiteAccess, isOpenPath, siteGateConfig } from "@/lib/site-gate";

/// Two jobs:
/// 1. Pre-launch gate (src/lib/site-gate.ts): while SITE_GATE_USER and
///    SITE_GATE_PASSWORD are set, every public page is answered with the
///    sign-in screen until the visitor has the access cookie. /admin, /api,
///    static assets and Google's verification files stay open.
/// 2. Protects the CMS admin area. The token itself is only fully verified here
///    (edge-safe) and re-verified in server components/actions via requireSession().
///    Screens a role may not open are also fast-rejected here as defense in depth
///    (rules: src/lib/permissions.ts). The cookie carries the role from sign-in, so
///    this can lag a role change until the next sign-in; server actions re-read the
///    role from the database and remain the authoritative guard for every change.

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminGuard(req);

  const gate = siteGateConfig();
  if (!gate || isOpenPath(pathname)) return NextResponse.next();
  if (await hasSiteAccess(req.cookies.get(SITE_GATE_COOKIE)?.value, gate)) return NextResponse.next();

  // Show the sign-in screen at the requested URL, so signing in lands right here.
  const gateUrl = req.nextUrl.clone();
  gateUrl.pathname = SITE_GATE_PATH;
  gateUrl.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  const response = NextResponse.rewrite(gateUrl);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function adminGuard(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  /// Everything except Next's build output; the gate decides what else is open.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
