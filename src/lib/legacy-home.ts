import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homeDefaults } from "./home-defaults";

export { homeDefaults };
export type { HomeSettings } from "./home-defaults";

const legacyPath = join(process.cwd(), "public", "legacy", "index.html");

function routeLinks(html: string) {
  const routes: Record<string, string> = {
    "index.html#top": "/#top",
    "index.html#development-cards": "/#development-cards",
    "single-project.html": "/developments/seven-x-seven",
    "emerald-villa.html": "/developments/emerald-villa",
    "dubai-hills-mansion.html": "/developments/dubai-hills-mansion",
    "about-us.html": "/about",
    "legacy.html": "/legacy",
    "news.html": "/news",
    "invest-in-dubai.html": "/invest-in-dubai",
    "contact.html": "/contact",
    "terms.html": "/terms",
    "privacy-policy.html": "/privacy-policy",
    "cookie-policy.html": "/cookie-policy",
  };
  for (const [from, to] of Object.entries(routes)) html = html.replaceAll(`href="${from}`, `href="${to}`);
  return html;
}

/// The delivered static tail of the homepage main (events, sunset band, live
/// news grid and the hidden legacy bands) — served verbatim inside the React
/// main with assets routed and legacy links mapped.
export function getHomeStaticTail(): string {
  const document = readFileSync(legacyPath, "utf8");
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error("The delivered homepage does not contain a body element.");
  const body = routeLinks(match[1]
    .replace(/\s*<script\b[^>]*src="assets\/js\/(?:live-news|site)\.js[^"]*"[^>]*><\/script>/gi, "")
    .replace(/\b(src|href|data-lightbox-src|data-image)="assets\//g, "$1=\"/legacy/assets/"));
  const eventsStart = body.indexOf('<section class="pdf-section pdf-events-head"');
  const mainEnd = body.indexOf("</main>");
  if (eventsStart === -1 || mainEnd === -1) throw new Error("The delivered homepage tail could not be located.");
  return body.slice(eventsStart, mainEnd);
}