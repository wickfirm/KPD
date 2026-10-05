import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

/// Protects the CMS admin area. The token itself is only fully verified here
/// (edge-safe) and re-verified in server components/actions via requireSession().
/// Admin-only sections are also fast-rejected here by role as defense in depth
/// — the pages and server actions remain the authoritative guards.
const adminOnlySections = ["/admin/users", "/admin/settings", "/admin/activity"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== "ADMIN" && adminOnlySections.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.redirect(new URL("/admin?denied=1", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
