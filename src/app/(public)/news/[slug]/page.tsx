import { notFound } from "next/navigation";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, withBrand } from "@/lib/seo";
import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/db";
import { ArticleView } from "@/components/public/article-view";

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
  return pageMetadata({
    title: withBrand(article.title),
    description: article.summary || article.title,
    path: `/news/${article.slug}`,
    image: article.coverImage,
    type: "article",
    publishedTime: article.publishedAt?.toISOString(),
    modifiedTime: article.updatedAt.toISOString(),
  });
}

/// The article detail page serves the delivered news-article.html structure
/// verbatim (see ArticleView). CMS content is baked server-side into the same
/// hooks the delivered articles.js would populate, so the page is complete in
/// the HTML - no empty flash, no client dependency.
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  return <>
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "News", path: "/news" }, { name: article.title, path: `/news/${article.slug}` }])} />
    <ArticleView article={article} />
  </>;
}
