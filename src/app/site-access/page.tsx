import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GoogleTagManager from "@/components/public/GoogleTagManager";
import { SITE_GATE_COOKIE, hasSiteAccess, safeNextPath, siteGateConfig } from "@/lib/site-gate";

/// Pre-launch sign-in screen. The middleware shows it in place of any public
/// page while the gate is on (src/lib/site-gate.ts). It carries the GTM
/// container like every public page, so Tag Assistant and GTM's install check
/// still find the tag, and it is kept out of search results.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Kasumigaseki Properties Development" },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function SiteAccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const gate = siteGateConfig();
  if (!gate) redirect(next);
  if (await hasSiteAccess((await cookies()).get(SITE_GATE_COOKIE)?.value, gate)) redirect(next);
  const failed = params.error === "1";

  return (
    <>
      <GoogleTagManager />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <main className="kpd-gate">
        <form className="kpd-gate-card" method="post" action="/api/site-access">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="kpd-gate-logo" src="/legacy/assets/images/brand/kasumigaseki-logo-horizontal-black-text.svg" alt="Kasumigaseki Properties Development" />
          <h1>Private preview</h1>
          <p>This website is not public yet. Please sign in to continue.</p>
          <input type="hidden" name="next" value={next} />
          <label>
            <span>Username</span>
            <input name="username" autoComplete="username" required autoFocus />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {failed ? (
            <p className="kpd-gate-error" role="alert">
              That username or password is not right. Please try again.
            </p>
          ) : null}
          <button type="submit">Enter</button>
        </form>
      </main>
    </>
  );
}

const css = `
@font-face{font-family:Manrope;src:url(/fonts/manrope-latin-var.woff2) format("woff2");font-weight:200 800;font-display:swap}
html,body{margin:0;background:#f5f4f0}
.kpd-gate{min-height:100vh;display:grid;place-items:center;padding:24px 16px;box-sizing:border-box;font-family:Manrope,"Helvetica Neue",Arial,sans-serif;color:#111}
.kpd-gate-card{width:100%;max-width:380px;background:#fff;border:1px solid #e3e1da;padding:40px 32px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px}
.kpd-gate-logo{width:200px;height:auto;margin:0 auto 8px}
.kpd-gate h1{margin:0;font-size:22px;font-weight:600;text-align:center;letter-spacing:-.01em}
.kpd-gate p{margin:0;font-size:14px;line-height:1.5;color:#555;text-align:center}
.kpd-gate label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#444}
.kpd-gate input{font:inherit;font-size:16px;font-weight:400;letter-spacing:0;text-transform:none;padding:12px 14px;border:1px solid #cfccc3;border-radius:0;background:#fff;color:#111}
.kpd-gate input:focus{outline:2px solid #111;outline-offset:-1px}
.kpd-gate .kpd-gate-error{color:#a32020;text-align:left}
.kpd-gate button{margin-top:8px;font:inherit;font-size:14px;font-weight:600;letter-spacing:.04em;padding:14px;border:0;background:#111;color:#fff;cursor:pointer}
.kpd-gate button:hover{background:#333}
`;
