// ── Homepage "Latest news" cards ─────────────────────────────────────────────
// The cards under the homepage news band are the latest published CMS articles
// (Content → News & Blog articles), newest first. There is no hand-typed or
// placeholder fallback: with no published articles the card grid is removed.

import type { NewsListItem } from "@/lib/news-listing";

/// How many of the latest articles the homepage shows.
export const HOME_NEWS_LIMIT = 3;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/// The card grid markup (same classes as the delivered design), or "" when
/// there is nothing published.
export function homeNewsGridHtml(articles: readonly NewsListItem[], { label, ariaLabel }: { label: string; ariaLabel: string }): string {
  const cards = articles.filter((article) => article.slug && article.title.trim()).slice(0, HOME_NEWS_LIMIT);
  if (!cards.length) return "";
  const html = cards.map((article) => {
    const href = `/news/${encodeURIComponent(article.slug)}`;
    const image = article.coverImage.trim();
    const alt = article.coverImageAlt.trim() || article.title;
    return `<article class="pdf-event-card">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy">` : ""}<h3>${escapeHtml(article.title)}</h3>${article.summary.trim() ? `<p>${escapeHtml(article.summary.trim())}</p>` : ""}<a href="${escapeHtml(href)}">${escapeHtml(label)}</a></article>`;
  }).join("");
  return `<section class="pdf-section pdf-events-grid" aria-label="${escapeHtml(ariaLabel)}">${html}</section>`;
}
