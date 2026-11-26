import { notFound } from "next/navigation";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, withBrand } from "@/lib/seo";
import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/db";
import { ArticleView } from "@/components/public/article-view";
import { loadSeoOverride } from "@/lib/seo-store";
import { applySeoOverride, seoKey } from "@/lib/seo-overrides";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { localizedArticle, localizedSeo } from "@/lib/translations/store";
import { pageLanguages } from "@/lib/hreflang";

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
  const locale = await getLocale();
  // In another language the title and summary are the article's translation.
  const shown = await localizedArticle(article, locale);
  // The page's languages for hreflang are read beside the search override, so
  // the metadata does not wait on them.
  const [override, translated] = await Promise.all([loadSeoOverride(seoKey("article", article.id)), pageLanguages({ article: article.id })]);
  const seo = await localizedSeo(
    applySeoOverride({ title: withBrand(shown.title), description: shown.summary || shown.title }, override),
    seoKey("article", article.id),
    locale,
  );
  return pageMetadata({
    ...seo,
    path: `/news/${article.slug}`,
    image: article.coverImage,
    type: "article",
    publishedTime: article.publishedAt?.toISOString(),
    modifiedTime: article.updatedAt.toISOString(),
  }, locale, translated);
}

/// The article detail page serves the delivered news-article.html structure
/// verbatim (see ArticleView). CMS content is baked server-side into the same
/// hooks the delivered articles.js would populate, so the page is complete in
/// the HTML - no empty flash, no client dependency.
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  const shown = await localizedArticle(article, locale);
  return <>
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "nav.news"), path: "/news" }, { name: shown.title, path: `/news/${article.slug}` }], locale)} />
    <ArticleView article={shown} />
  </>;
}
