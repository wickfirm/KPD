import { absoluteUrl } from "@/lib/site";
import { getArticleShell } from "@/lib/news-shell";
import { injectNavDevelopments } from "@/lib/nav-developments";
import { formatDate, localeHref, localizeHtmlLinks } from "@/lib/locales";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { getLocalizedGlobalSettings, getLocalizedNavDevelopments } from "@/lib/translations/store";
import { articleShellWords } from "@/lib/article-shell-words";
import { localizeShellWords } from "@/lib/shell-words";
import { ContactScript } from "./site-shell-footer";
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
export async function ArticleView({ article, previewNote }: { article: ArticleViewData; previewNote?: string }) {
  const locale = await getLocale();
  const body = Array.isArray(article.body) ? article.body.map(String) : [];
  const typeLabel = article.kind === "BLOG" ? t(locale, "article.blog") : t(locale, "nav.news");
  const dateLabel = article.publishedAt ? formatDate(article.publishedAt, locale) : t(locale, "article.update");
  const image = article.coverImage || "/legacy/assets/images/library/bottom-up-view-of-modern-office-building-in-hong-k-2026-01-11-09-09-49-utc.jpg";
  const organisation = { "@type": "Organization", name: t(locale, "footer.companyName") };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary || undefined,
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    author: organisation,
    publisher: organisation,
    mainEntityOfPage: absoluteUrl(localeHref(`/news/${article.slug}`, locale)),
    ...(locale !== "en" ? { inLanguage: locale } : {}),
  };
  const shell = getArticleShell();
  const [extras, contact] = await Promise.all([getLocalizedNavDevelopments(), getLocalizedGlobalSettings()]);
  // The page shows the delivered shell as it came. In another language the
  // shell's words are replaced where they are known, and the delivered
  // interaction script gets its forms' words in that language, as it does from
  // the localized footer on every other page. An English page has neither.
  const words = articleShellWords(locale, contact);
  const shellPart = (html: string) => localizeShellWords(localizeHtmlLinks(injectNavDevelopments(html, extras), locale), locale, words);
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page news-design-page article-page" />
    <div dangerouslySetInnerHTML={{ __html: shellPart(shell.beforeMain) }} />
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
        <nav className="article-actions" aria-label={t(locale, "article.actions")}>
          <a className="btn-pill" href={localeHref("/news", locale)}>{t(locale, "nav.backToNews")}</a>
          <a className="btn-pill" href={localeHref("/contact", locale)}>{t(locale, "article.contact")}</a>
        </nav>
      </article>
    </main>
    {locale !== "en" ? <ContactScript /> : null}
    <div dangerouslySetInnerHTML={{ __html: shellPart(shell.afterMain) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page news-design-page article-page" />
  </>;
}
