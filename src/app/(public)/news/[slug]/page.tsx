import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { getArticleShell } from "@/lib/news-shell";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";

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

/// The article detail page serves the delivered news-article.html shell
/// verbatim and renders the CMS article content inside its main region
/// using the delivered layout classes.
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
  const shell = getArticleShell();
  return <>
    <div dangerouslySetInnerHTML={{ __html: shell.beforeMain }} />
    <main className="single-project-main article-page page-reference-main" id="top">
      <section className="article-hero" aria-label={article.title}>
        {article.coverImage ? <img src={article.coverImage} alt={article.coverImageAlt || article.title} /> : null}
        <div className="page-hero-content"><span className="cms-eyebrow">{article.kind}</span><h1>{article.title}</h1></div>
      </section>
      <div className="kpd-section article-body" data-article-body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <nav className="article-actions" aria-label="Article actions">
          <a className="btn-pill" href="/news">Back to News</a>
          <a className="btn-pill" href="/contact">Contact KPD</a>
        </nav>
      </div>
    </main>
    <div dangerouslySetInnerHTML={{ __html: shell.afterMain }} />
    <DeliveredScripts sources={["/legacy/assets/js/site.js?v=20260715-backend-start-1"]} />
  </>;
}