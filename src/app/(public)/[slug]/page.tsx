import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

type Block = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string };
const legalPages: Record<string, string> = { "privacy-policy": "privacy-policy.html", terms: "terms.html", "cookie-policy": "cookie-policy.html" };

export const dynamic = "force-dynamic";
export default async function ManagedLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legacyFile = legalPages[slug];
  if (!legacyFile) notFound();
  let page: { title: string; content: unknown; status: string } | null = null;
  try { page = await db.staticPage.findUnique({ where: { slug } }); } catch {}
  if (!page || page.status !== "PUBLISHED") redirect(`/legacy/${legacyFile}`);
  const blocks = Array.isArray(page.content) ? page.content as Block[] : [];
  const hero = blocks.find((block) => block.type === "hero");
  const paragraphs = blocks.filter((block) => block.type === "paragraph" && block.text);
  return <article className="page-reference-main legal-page" id="top"><section className="page-reference-hero"><img src={hero?.image || "/legacy/assets/images/library/modern-office-glasses-buildings-cityscape-under-bl-2026-03-10-02-05-10-utc.jpg"} alt="KPD legal information" /><div className="page-reference-hero-copy"><span>Legal</span><h1>{hero?.heading || page.title}</h1>{hero?.text ? <p>{hero.text}</p> : null}</div></section><section className="kpd-section legal-page-copy">{paragraphs.map((block, index) => <p key={`${block.text}-${index}`}>{block.text}</p>)}</section></article>;
}
