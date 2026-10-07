import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";

type Block = { type?: string; heading?: string; text?: string; image?: string };

/// Per-slug metadata mirrors the delivered files (public/legacy/*.html):
/// hero image, alt text, and the <title> exactly as delivered.
const legalPages: Record<string, { file: string; title: string; heroImage: string; heroAlt: string }> = {
  "privacy-policy": { file: "privacy-policy.html", title: "Privacy Policy", heroImage: "/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg", heroAlt: "Dubai skyline panorama" },
  terms: { file: "terms.html", title: "Terms of Use", heroImage: "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg", heroAlt: "Dubai skyline" },
  "cookie-policy": { file: "cookie-policy.html", title: "Cookie Policy", heroImage: "/legacy/assets/images/library/dubai-marina-skyscrapers-and-port-in-dubai-united-2026-03-24-00-24-57-utc.jpg", heroAlt: "Dubai waterfront skyline" },
};

export const revalidate = 300;

/// The managed slugs are a fixed set — prerendered at deploy time; content is
/// still fetched per render and revalidated after 300s.
export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: legalPages[slug]?.title ?? "Legal" };
}

/// Managed legal pages render the delivered legal-page structure verbatim
/// (page-hero pdf-hero + kpd-legal-block, body class "home-development-page
/// kpd-page"); CMS blocks map onto it: hero → page-hero, heading/paragraph
/// blocks → kpd-legal-block children. Until a page is PUBLISHED the delivered
/// static file is served by redirecting to /legacy/<file>.
export default async function ManagedLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = legalPages[slug];
  if (!meta) notFound();
  let page: { title: string; content: unknown; status: string } | null = null;
  try { page = await db.staticPage.findUnique({ where: { slug } }); } catch {}
  if (!page || page.status !== "PUBLISHED") redirect(`/legacy/${meta.file}`);
  const blocks = Array.isArray(page.content) ? page.content as Block[] : [];
  const hero = blocks.find((block) => block.type === "hero");
  const sections = blocks.filter((block) => block.type === "heading" || block.type === "paragraph");
  return <><DeliveredBodyClass bodyClass="home-development-page kpd-page" /><SiteShellHeader /><main id="top"><section className="page-hero pdf-hero"><img src={hero?.image || meta.heroImage} alt={meta.heroAlt} /><div className="page-hero-content"><h1>{hero?.heading || page.title}</h1></div></section><section className="kpd-legal-block">{sections.map((block, index) => block.type === "heading" ? <h2 key={index}>{block.heading}</h2> : <p key={index}>{block.text}</p>)}</section></main><SiteShellFooter /><DeliveredScripts bodyClass="home-development-page kpd-page" /></>;
}
