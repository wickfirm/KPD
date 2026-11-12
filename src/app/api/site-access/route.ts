import { NextRequest, NextResponse } from "next/server";
import {
  SITE_GATE_COOKIE,
  SITE_GATE_PATH,
  SITE_GATE_TTL_SECONDS,
  credentialsMatch,
  safeNextPath,
  siteGateConfig,
  siteGateToken,
} from "@/lib/site-gate";

/// Sign-in for the pre-launch gate (see src/lib/site-gate.ts). The form on
/// /site-access posts here; success sets the access cookie and returns the
/// visitor to the page they asked for.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const next = safeNextPath(form?.get("next"));
  const gate = siteGateConfig();
  if (!gate) return NextResponse.redirect(new URL(next, req.url), 303);

  const user = String(form?.get("username") ?? "");
  const password = String(form?.get("password") ?? "");
  if (!(await credentialsMatch(user, password, gate))) {
    // A short pause makes guessing slower without bothering a real visitor.
    await new Promise((resolve) => setTimeout(resolve, 800));
    const retry = new URL(SITE_GATE_PATH, req.url);
    retry.searchParams.set("next", next);
    retry.searchParams.set("error", "1");
    return NextResponse.redirect(retry, 303);
  }

  const response = NextResponse.redirect(new URL(next, req.url), 303);
  response.cookies.set(SITE_GATE_COOKIE, await siteGateToken(gate), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SITE_GATE_TTL_SECONDS,
  });
  return response;
}
