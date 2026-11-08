// ── News listing (Gallery light) ─────────────────────────────────────────────
// Server-side data for /news: published CMS articles, newest first. This
// replaces the delivered live-news.js render, which already showed only these
// CMS articles whenever any were published (it fell back to the RSS feed only
// when the CMS returned nothing).

import { db } from "@/lib/db";

export type NewsListItem = {
  slug: string;
  kind: "NEWS" | "BLOG";
  title: string;
  summary: string;
  coverImage: string;
  coverImageAlt: string;
  publishedAt: string | null;
  minutes: number;
};

/// Editable copy for /news (Pages → News). A blank field keeps the approved
/// 2.1 wording; pressVisible false hides the press band.
export type NewsListingCopy = {
  eyebrow?: string; heading?: string; intro?: string;
  featureCta?: string; cardCta?: string; emptyText?: string;
  pressVisible?: boolean; pressLabel?: string; pressHeading?: string; pressText?: string;
  pressLinkLabel?: string; pressLinkText?: string; pressLinkUrl?: string;
};

export const newsListingDefaults = {
  eyebrow: "Media",
  heading: "News\n**and updates.**",
  featureCta: "Read the article",
  cardCta: "Read",
  emptyText: "New articles will appear here soon.",
  pressLabel: "Press",
  pressHeading: "Media enquiries.",
  pressText: "For interviews, imagery and statements, contact the KPD media team.",
  pressLinkLabel: "Press form",
  pressLinkText: "Send a media request",
  pressLinkUrl: "/contact",
} as const;

/// Reading time from the article body (string[] of paragraphs), at least 1 minute.
export function readingMinutes(body: unknown): number {
  const text = Array.isArray(body) ? body.filter((part): part is string => typeof part === "string").join(" ") : typeof body === "string" ? body : "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 220));
}

/// "Perspective · 2 min read" for journal pieces, "Announcement · Jun 2026" for news.
export function newsCaption(item: Pick<NewsListItem, "kind" | "minutes" | "publishedAt">): string {
  if (item.kind === "BLOG") return `Perspective · ${item.minutes} min read`;
  const date = item.publishedAt ? new Date(item.publishedAt) : null;
  const when = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(date) : "";
  return when ? `Announcement · ${when}` : "Announcement";
}

/// Never throws: when the database is unreachable the page renders with no articles.
export async function loadNewsArticles(limit = 60): Promise<NewsListItem[]> {
  try {
    const rows = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: { slug: true, kind: true, title: true, summary: true, coverImage: true, coverImageAlt: true, publishedAt: true, body: true },
    });
    return rows.map((row) => ({
      slug: row.slug,
      kind: row.kind === "BLOG" ? "BLOG" : "NEWS",
      title: row.title,
      summary: row.summary,
      coverImage: row.coverImage ?? "",
      coverImageAlt: row.coverImageAlt ?? "",
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      minutes: readingMinutes(row.body),
    }));
  } catch {
    return [];
  }
}

export async function loadNewsListingCopy(): Promise<NewsListingCopy> {
  const listing = await db.siteSetting.findUnique({ where: { key: "news_listing" } }).catch(() => null);
  return (listing?.value && typeof listing.value === "object" && !Array.isArray(listing.value) ? listing.value : {}) as NewsListingCopy;
}
