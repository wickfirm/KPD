import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { getArticleShell } from "@/lib/news-shell";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";

export const revalidate = 300;

const getPublishedArticle = cache(async (slug: string) => {
  return db.article.findFirst({ where: { slug, status: "PUBLISHED" } });
});

export async function generateStaticParams() {
  try {
    const rows = await db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 200, select: { slug: true } });
    return rows.map((row) => ({ slug: row.slug }));
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug).catch(() => null);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.summary || undefined,
    openGraph: { images: article.coverImage ? [{ url: article.coverImage }] : undefined },
  };
}

/// The article detail page serves the delivered news-article.html structure
/// verbatim: main.article-main > article.article-shell with the data-article-*
/// hooks, and the body class "home-development-page news-design-page
/// article-page". CMS content is baked server-side into the same hooks the
/// delivered articles.js would populate (same type label, long en-US date,
/// image and alt fallbacks), so the page is complete in the HTML — no empty
/// flash, no client dependency.
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  const body = Array.isArray(article.body) ? article.body.map(String) : [];
  const typeLabel = article.kind === "BLOG" ? "Blog" : "News";
  const dateLabel = article.publishedAt
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(article.publishedAt)
    : "KPD Update";
  const image = article.coverImage || "/legacy/assets/images/library/bottom-up-view-of-modern-office-building-in-hong-k-2026-01-11-09-09-49-utc.jpg";
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
  const shell = getArticleShell();
  return <>
    <DeliveredBodyClass bodyClass="home-development-page news-design-page article-page" />
    <div dangerouslySetInnerHTML={{ __html: shell.beforeMain }} />
    <main className="article-main" id="top" data-article-page data-article-kind={article.kind === "BLOG" ? "blog" : "news"}>
      <article className="article-shell">
        <header className="article-hero">
          <div className="article-meta"><span data-article-type>{typeLabel}</span><time data-article-date>{dateLabel}</time></div>
          <h1 data-article-title>{article.title}</h1>
          <p data-article-summary>{article.summary}</p>
        </header>
        <figure className="article-media"><img data-article-image src={image} alt={article.coverImageAlt || article.title} /></figure>
        <div className="article-body" data-article-body>
          {body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <nav className="article-actions" aria-label="Article actions">
          <a className="btn-pill" href="/news">Back to News</a>
          <a className="btn-pill" href="/contact">Contact KPD</a>
        </nav>
      </article>
    </main>
    <div dangerouslySetInnerHTML={{ __html: shell.afterMain }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <DeliveredScripts bodyClass="home-development-page news-design-page article-page" sources={["/legacy/assets/js/site.js?v=20260715-backend-start-1"]} />
  </>;
}
