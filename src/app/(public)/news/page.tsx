import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "News and updates", description: "Announcements, market observations, and development commentary from KPD." };
export const dynamic = "force-dynamic";
export default async function NewsPage() {
  let articles: { slug: string; title: string; summary: string; kind: string; coverImage: string | null; coverImageAlt: string | null; publishedAt: Date | null }[] = [];
  try { articles = await db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, select: { slug: true, title: true, summary: true, kind: true, coverImage: true, coverImageAlt: true, publishedAt: true } }); } catch {}
  return <div className="news-main page-reference-main" id="top"><section className="page-reference-hero" aria-label="Media"><img src="/legacy/assets/images/library/modern-office-glasses-buildings-cityscape-under-bl-2026-03-10-02-05-10-utc.jpg" alt="Modern office towers for media updates" /><div className="page-reference-hero-copy motion-reveal"><span>Media</span><h1>News and<br />updates</h1><p>Announcements, market observations, and development commentary from Kasumigaseki Properties Development.</p></div></section><section className="news-updates kpd-section kpd-section--compact" aria-label="News and blogs updates"><div className="news-grid live-news-grid">{articles.map((article) => <article className="news-card-item kpd-news-card" key={article.slug}>{article.coverImage ? <img src={article.coverImage} alt={article.coverImageAlt || article.title} /> : null}<div className="kpd-card-content"><span className="small-kicker">{article.kind} {article.publishedAt ? `— ${article.publishedAt.toLocaleDateString()}` : ""}</span><h3>{article.title}</h3><p>{article.summary}</p><Link className="btn-pill" href={`/news/${article.slug}`}>Read</Link></div></article>)}</div>{!articles.length ? <p>There are no published updates yet.</p> : null}</section></div>;
}
