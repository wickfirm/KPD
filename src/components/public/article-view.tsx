import { absoluteUrl } from "@/lib/site";
import { getArticleShell } from "@/lib/news-shell";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";

export type ArticleViewData = {
  slug: string;
  kind: "NEWS" | "BLOG";
  title: string;
  summary: string;
  body: unknown;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: Date | null;
};

/// The article detail page (delivered news-article.html structure). Shared by
/// the public route and the admin draft preview so the preview is exactly what
/// visitors will see once the article is published.
export function ArticleView({ article, previewNote }: { article: ArticleViewData; previewNote?: string }) {
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
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
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
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page news-design-page article-page" />
  </>;
}
