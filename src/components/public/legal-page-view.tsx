import type { TextStyle } from "@/lib/text-style";
import { legalTabForSlug } from "@/lib/terms-defaults";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";
import { LegalTabs } from "./legal-tabs";

type Block = { type?: string; image?: string; headingStyle?: TextStyle };

const legalHeroes: Record<string, string> = {
  terms: "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg",
  "privacy-policy": "/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg",
  "cookie-policy": "/legacy/assets/images/library/dubai-marina-skyscrapers-and-port-in-dubai-united-2026-03-24-00-24-57-utc.jpg",
};

/// Registry only: it defines the CMS-managed legal routes, not page content.
export const legalPages: Record<string, object> = { terms: {}, "privacy-policy": {}, "cookie-policy": {} };

/// The three legal addresses share one document. Terms, Privacy and Cookies
/// switch in place. A saved hero image still replaces the skyline fallback.
export function LegalPageView({ slug, page, previewNote }: { slug: string; page: { title: string; content: unknown }; previewNote?: string }) {
  const blocks = Array.isArray(page.content) ? page.content as Block[] : [];
  const hero = blocks.find((block) => block.type === "hero");
  const bodyClass = "home-development-page kpd-page kpd-legal-page kpd-terms-page";
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass={bodyClass} />
    <SiteShellHeader />
    <main id="top">
      <LegalTabs initialTab={legalTabForSlug(slug)} image={hero?.image || legalHeroes[slug]} headingStyle={hero?.headingStyle} />
    </main>
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass={bodyClass} />
  </>;
}
