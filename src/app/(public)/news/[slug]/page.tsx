import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";

export const revalidate = 300;

/// React cache(): generateMetadata and the page share one query per request.
const getPublishedArticle = cache(async (slug: string) => {
  return db.article.findFirst({ where: { slug, status: "PUBLISHED" } });
});

/// Published articles are prerendered at deploy time (capped to keep builds
/// fast); newer articles render on demand and revalidate after 300s.
export async function generateStaticParams() {
  try {
    const rows = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 200,
      select: { slug: true },
    });
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    // Database unavailable at build time — routes still render on demand.
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug).catch(() => null);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.summary || undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary || undefined,
      publishedTime: article.publishedAt?.toISOString(),
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  const body = Array.isArray(article.body) ? article.body.map(String) : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary || undefined,
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    author: { "@type": "Organization", name: "Kasumigaseki Properties Development" },
    publisher: { "@type": "Organization", name: "Kasumigaseki Properties Development" },
    mainEntityOfPage: absoluteUrl(`/news/${article.slug}`),
  };
  return <><SiteShellHeader /><article className="news-article-main article-page page-reference-main" id="top"><section className="article-hero" aria-label={article.title}>{article.coverImage ? <Image src={article.coverImage} alt={article.coverImageAlt || article.title} fill priority sizes="100vw" /> : null}<div className="page-hero-content"><span className="cms-eyebrow">{article.kind}</span><h1>{article.title}</h1></div></section><div className="kpd-section article-body" data-article-body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />{body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<nav className="article-actions" aria-label="Article actions"><Link className="btn-pill" href="/news">Back to News</Link><Link className="btn-pill" href="/contact">Contact KPD</Link></nav></div></article><SiteShellFooter /><DeliveredScripts /></>;
}

