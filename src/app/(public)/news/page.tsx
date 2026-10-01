import Image from "next/image";
import { db } from "@/lib/db";
import { NewsFeed, type NewsCard } from "@/components/public/news-feed";

export const metadata = { title: "News and updates", description: "Announcements, market observations, and development commentary from KPD." };
export const revalidate = 300;


type ArticleRow = { slug: string; title: string; summary: string; kind: string; coverImage: string | null; coverImageAlt: string | null; publishedAt: Date | null };

const toCard = (article: ArticleRow): NewsCard => ({
  slug: article.slug,
  title: article.title,
  summary: article.summary,
  kind: article.kind,
  coverImage: article.coverImage,
  coverImageAlt: article.coverImageAlt,
  publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
});

export default async function NewsPage() {
  let news: NewsCard[] = [];
  let blog: NewsCard[] = [];
  try {
    const [newsRows, blogRows] = await Promise.all([
      db.article.findMany({ where: { status: "PUBLISHED", kind: "NEWS" }, orderBy: { publishedAt: "desc" }, take: 9, select: { slug: true, title: true, summary: true, kind: true, coverImage: true, coverImageAlt: true, publishedAt: true } }),
      db.article.findMany({ where: { status: "PUBLISHED", kind: "BLOG" }, orderBy: { publishedAt: "desc" }, take: 9, select: { slug: true, title: true, summary: true, kind: true, coverImage: true, coverImageAlt: true, publishedAt: true } }),
    ]);
    news = newsRows.map(toCard);
    blog = blogRows.map(toCard);
  } catch {
    // A missing database must not take the page down; the feed shows its empty state.
  }
  return <div className="news-design-page news-main page-reference-main" id="top">
    <section className="page-reference-hero" aria-label="Media"><Image src="/legacy/assets/images/library/modern-office-glasses-buildings-cityscape-under-bl-2026-03-10-02-05-10-utc.jpg" alt="Modern office towers for media updates" fill priority sizes="100vw" /><div className="page-reference-hero-copy motion-reveal"><span>Media</span><h1>News and<br />updates</h1><p>Announcements, market observations, and development commentary from Kasumigaseki Properties Development.</p></div></section>
    <NewsFeed initialNews={news} initialBlog={blog} />
  </div>;
}
