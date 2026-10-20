import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";

type Block = { type?: string; heading?: string; text?: string; image?: string };

/// Registry only: it defines the CMS-managed legal routes, not page content.
export const legalPages: Record<string, object> = { terms: {}, "privacy-policy": {}, "cookie-policy": {} };

/// A managed legal page (page-hero pdf-hero + kpd-legal-block, body class
/// "home-development-page kpd-page"). CMS blocks map onto it: hero → page-hero,
/// heading/paragraph blocks → kpd-legal-block children. Shared by the public
/// route and the admin draft preview.
export function LegalPageView({ slug: _slug, page, previewNote }: { slug: string; page: { title: string; content: unknown }; previewNote?: string }) {
  const blocks = Array.isArray(page.content) ? page.content as Block[] : [];
  const hero = blocks.find((block) => block.type === "hero");
  const sections = blocks.filter((block) => block.type === "heading" || block.type === "paragraph");
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page kpd-page" />
    <SiteShellHeader />
    <main id="top"><section className="page-hero pdf-hero">{hero?.image ? <img src={hero.image} alt="" /> : null}<div className="page-hero-content"><h1>{hero?.heading ?? page.title}</h1></div></section><section className="kpd-legal-block">{sections.map((block, index) => block.type === "heading" ? <h2 key={index}>{block.heading}</h2> : <p key={index}>{block.text}</p>)}</section></main>
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page kpd-page" />
  </>;
}
