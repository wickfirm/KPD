import { readFileSync } from "node:fs";
import { join } from "node:path";

const newsPath = join(process.cwd(), "public", "legacy", "news.html");
const articlePath = join(process.cwd(), "public", "legacy", "news-article.html");

function routeLinks(html: string) {
  const routes: Record<string, string> = {
    "index.html#top": "/#top", "index.html#development-cards": "/#development-cards", "single-project.html": "/developments/seven-x-seven", "emerald-villa.html": "/developments/emerald-villa", "dubai-hills-mansion.html": "/developments/dubai-hills-mansion", "about-us.html": "/about", "legacy.html": "/legacy", "news.html": "/news", "invest-in-dubai.html": "/invest-in-dubai", "contact.html": "/contact", "terms.html": "/terms", "privacy-policy.html": "/privacy-policy", "cookie-policy.html": "/cookie-policy",
  };
  for (const [from, to] of Object.entries(routes)) html = html.replaceAll(`href="${from}`, `href="${to}`);
  /// Delivered article links (blog/news panel cards) carry ?article=<slug> and
  /// only resolve their assets under /legacy/ — route them to the internal
  /// article pages, which the seed populates with the same slugs.
  return html.replace(/(?:blog|news)-article\.html\?article=([a-z0-9-]+)/gi, "/news/$1");
}

function pageBody(path: string) {
  const document = readFileSync(path, "utf8");
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error("The delivered page does not contain a body element.");
  return routeLinks(match[1]
    .replace(/\s*<script\b[^>]*src="assets\/js\/(?:live-news|site|articles|ownership-cost-planner)\.js[^"]*"[^>]*><\/script>/gi, "")
    .replace(/\b(src|href|poster|data-lightbox-src|data-image)="assets\//g, '$1="/legacy/assets/'));
}

function sliceBetween(html: string, startMarker: string, endMarker: string, includeEnd = true) {
  const start = html.indexOf(startMarker);
  if (start === -1) return "";
  const end = html.indexOf(endMarker, start);
  if (end === -1) return "";
  return includeEnd ? html.slice(start, end + endMarker.length) : html.slice(start, end);
}

/// Shell for the news listing page (public/legacy/news.html).
/// The delivered main content (events, live news grid, sunset band, hidden
/// legacy bands) is served verbatim; live-news.js populates the news grid
/// from the RSS feed exactly as delivered.
export function getNewsPageShell() {
  const body = pageBody(newsPath);
  const mainStart = body.indexOf("<main");
  const mainEnd = body.indexOf("</main>");
  if (mainStart === -1 || mainEnd === -1) throw new Error("The delivered news page does not contain a main element.");
  return {
    beforeMain: body.slice(0, mainStart),
    main: body.slice(mainStart, mainEnd),
    afterMain: body.slice(mainEnd + "</main>".length),
  };
}

/// Shell for the article detail page (public/legacy/news-article.html).
export function getArticleShell() {
  const body = pageBody(articlePath);
  const mainStart = body.indexOf("<main");
  const mainEnd = body.indexOf("</main>");
  if (mainStart === -1 || mainEnd === -1) throw new Error("The delivered article page does not contain a main element.");
  return { beforeMain: body.slice(0, mainStart), afterMain: body.slice(mainEnd + "</main>".length) };
}
