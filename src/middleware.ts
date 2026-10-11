import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { canViewPath } from "@/lib/permissions";

/// Protects the CMS admin area. The token itself is only fully verified here
/// (edge-safe) and re-verified in server components/actions via requireSession().
/// Screens a role may not open are also fast-rejected here as defense in depth
/// (rules: src/lib/permissions.ts). The cookie carries the role from sign-in, so
/// this can lag a role change until the next sign-in; server actions re-read the
/// role from the database and remain the authoritative guard for every change.

export async function middleware(req: NextRequest) {
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
  matcher: ["/admin", "/admin/:path*"],
};
