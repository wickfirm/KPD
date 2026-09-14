import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await db.article.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!article) notFound();
  const body = Array.isArray(article.body) ? article.body.map(String) : [];
  return <article className="news-article-main page-reference-main"><section className="page-reference-hero">{article.coverImage ? <img src={article.coverImage} alt={article.coverImageAlt || article.title} /> : null}<div className="page-reference-hero-copy"><span>{article.kind}</span><h1>{article.title}</h1><p>{article.summary}</p></div></section><div className="kpd-section news-article-copy">{body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Link className="btn-pill" href="/news">Back to news</Link></div></article>;
}
