import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

async function getPublishedArticle(slug: string) {
  return db.article.findFirst({ where: { slug, status: "PUBLISHED" } });
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
  return <article className="news-article-main page-reference-main"><section className="page-reference-hero">{article.coverImage ? <Image src={article.coverImage} alt={article.coverImageAlt || article.title} fill priority sizes="100vw" /> : null}<div className="page-reference-hero-copy"><span>{article.kind}</span><h1>{article.title}</h1><p>{article.summary}</p></div></section><div className="kpd-section news-article-copy"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />{body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Link className="btn-pill" href="/news">Back to news</Link></div></article>;
}

