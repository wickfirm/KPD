// ── Outbound RSS 2.0 feed (/rss.xml) ─────────────────────────────────────────
// KPD's published News & Blog articles plus the outside press coverage listed
// under "In the press" on /news, newest first. Articles link to their /news
// page; press items link to the publication (with <source> naming it).

import { absoluteUrl } from "@/lib/site";
import type { PressItem } from "@/lib/press-coverage";

export type FeedArticle = { slug: string; kind: "NEWS" | "BLOG"; title: string; summary: string; publishedAt: Date | null; coverImage?: string | null };

type FeedEntry = { title: string; link: string; guid: string; permalink: boolean; description: string; date: Date | null; category: string; source?: { name: string; url: string }; lang?: string; image?: string };

export function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] as string)
    // Characters XML 1.0 does not allow.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

function absolute(url: string): string {
  return /^https?:\/\//i.test(url) ? url : absoluteUrl(url);
}

export function buildRssFeed({ articles, press, now = new Date() }: { articles: FeedArticle[]; press: PressItem[]; now?: Date }): string {
  const entries: FeedEntry[] = [
    ...articles.map((a) => ({
      title: a.title,
      link: absoluteUrl(`/news/${a.slug}`),
      guid: absoluteUrl(`/news/${a.slug}`),
      permalink: true,
      description: a.summary,
      date: a.publishedAt,
      category: a.kind === "BLOG" ? "Perspective" : "News",
      image: a.coverImage ? absolute(a.coverImage) : undefined,
    })),
    ...press.map((p, i) => ({
      title: p.title,
      link: p.url || absoluteUrl("/news#press"),
      // An unlinked item needs a stable id that is not a URL to a real page.
      guid: p.url || `kpd-press-${i}-${p.publication}`,
      permalink: false,
      description: p.publication ? `${p.publication}: ${p.title}` : p.title,
      date: p.date ? new Date(`${p.date}T00:00:00Z`) : null,
      category: "Press coverage",
      source: p.publication && p.url ? { name: p.publication, url: originOf(p.url) } : undefined,
      lang: p.lang,
    })),
  ].sort((a, b) => (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity));

  const latest = entries.find((e) => e.date)?.date ?? now;
  const items = entries.map((e) => [
    "    <item>",
    `      <title>${xmlEscape(e.title)}</title>`,
    `      <link>${xmlEscape(e.link)}</link>`,
    `      <guid isPermaLink="${e.permalink && e.guid.startsWith("http") ? "true" : "false"}">${xmlEscape(e.guid)}</guid>`,
    `      <description>${xmlEscape(e.description)}</description>`,
    e.date ? `      <pubDate>${e.date.toUTCString()}</pubDate>` : "",
    `      <category>${xmlEscape(e.category)}</category>`,
    e.source ? `      <source url="${xmlEscape(e.source.url)}">${xmlEscape(e.source.name)}</source>` : "",
    e.lang ? `      <dc:language>${e.lang}</dc:language>` : "",
    e.image ? `      <media:content url="${xmlEscape(e.image)}" medium="image" />` : "",
    "    </item>",
  ].filter(Boolean).join("\n"));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
    "  <channel>",
    "    <title>Kasumigaseki Properties Development — News and press</title>",
    `    <link>${absoluteUrl("/news")}</link>`,
    `    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />`,
    "    <description>News, perspectives and press coverage from Kasumigaseki Properties Development (KPD), Dubai.</description>",
    "    <language>en</language>",
    `    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
