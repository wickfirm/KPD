import { db } from "@/lib/db";
import { loadNewsListingCopy } from "@/lib/news-listing";
import { resolvePressItems } from "@/lib/press-coverage";
import { buildRssFeed, type FeedArticle } from "@/lib/rss-feed";

export const revalidate = 900;

/// /rss.xml: published News & Blog articles plus "In the press" coverage
/// (Pages → News). A database problem degrades to an empty article list.
export async function GET() {
  let articles: FeedArticle[] = [];
  try {
    const rows = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: { slug: true, kind: true, title: true, summary: true, publishedAt: true, coverImage: true },
    });
    articles = rows.map((row) => ({ ...row, kind: row.kind === "BLOG" ? "BLOG" : "NEWS" }));
  } catch {
    // keep the press items
  }
  const copy = await loadNewsListingCopy();
  const press = copy.coverageVisible === false ? [] : resolvePressItems(copy.coverage);
  return new Response(buildRssFeed({ articles, press }), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900, s-maxage=900" },
  });
}
