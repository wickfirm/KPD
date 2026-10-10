import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";

type Block = { type?: string; heading?: string; text?: string; image?: string };

/// Per-slug metadata mirrors the delivered files (public/legacy/*.html):
/// hero image, alt text, and the <title> exactly as delivered.
export const legalPages: Record<string, { file: string; title: string; heroImage: string; heroAlt: string }> = {
  "privacy-policy": { file: "privacy-policy.html", title: "Privacy Policy", heroImage: "/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg", heroAlt: "Dubai skyline panorama" },
  terms: { file: "terms.html", title: "Terms of Use", heroImage: "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg", heroAlt: "Dubai skyline" },
  "cookie-policy": { file: "cookie-policy.html", title: "Cookie Policy", heroImage: "/legacy/assets/images/library/dubai-marina-skyscrapers-and-port-in-dubai-united-2026-03-24-00-24-57-utc.jpg", heroAlt: "Dubai waterfront skyline" },
};

/// A managed legal page (page-hero pdf-hero + kpd-legal-block, body class
/// "home-development-page kpd-page"). CMS blocks map onto it: hero → page-hero,
/// heading/paragraph blocks → kpd-legal-block children. Shared by the public
/// route and the admin draft preview.
export function LegalPageView({ slug, page, previewNote }: { slug: string; page: { title: string; content: unknown }; previewNote?: string }) {
  const meta = legalPages[slug];
  const blocks = Array.isArray(page.content) ? page.content as Block[] : [];
  const hero = blocks.find((block) => block.type === "hero");
  const sections = blocks.filter((block) => block.type === "heading" || block.type === "paragraph");
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page kpd-page" />
    <SiteShellHeader />
    <main id="top"><section className="page-hero pdf-hero"><img src={hero?.image || meta.heroImage} alt={meta.heroAlt} /><div className="page-hero-content"><h1>{hero?.heading || page.title}</h1></div></section><section className="kpd-legal-block">{sections.map((block, index) => block.type === "heading" ? <h2 key={index}>{block.heading}</h2> : <p key={index}>{block.text}</p>)}</section></main>
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page kpd-page" />
  </>;
}
