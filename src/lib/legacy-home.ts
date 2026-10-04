import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homeDefaults } from "./home-defaults";

export { homeDefaults };
export type { HomeSettings } from "./home-defaults";

const legacyPath = join(process.cwd(), "public", "legacy", "index.html");

function bodyFromDocument(document: string) {
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error("The delivered homepage does not contain a body element.");
  return match[1]
    .replace(/\s*<script\b[^>]*src="assets\/js\/(?:live-news|site)\.js[^"]*"[^>]*><\/script>/gi, "")
    .replace(/\b(src|href|data-lightbox-src|data-image)="assets\//g, "$1=\"/legacy/assets/");
}

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

/// The delivered page keeps a guaranteed pixel-identical shell: everything
/// outside <main> (header, menu, booking dialog, footer) is served verbatim,
/// with legacy routes mapped to the Next.js ones. The CMS-managed homepage
/// sections render as React (src/components/public/home-page.tsx); everything
/// from the events section onward is returned as a verbatim static tail.
export function getHomePageShell() {
  const body = routeLinks(bodyFromDocument(readFileSync(legacyPath, "utf8")));
  const mainStart = body.indexOf("<main");
  const mainEnd = body.indexOf("</main>");
  if (mainStart === -1 || mainEnd === -1) throw new Error("The delivered homepage does not contain a main element.");
  const eventsStart = body.indexOf('<section class="pdf-section pdf-events-head"');
  if (eventsStart === -1 || eventsStart > mainEnd) throw new Error("The delivered homepage events section could not be located.");
  return {
    beforeMain: body.slice(0, mainStart),
    staticTail: body.slice(eventsStart, mainEnd),
    afterMain: body.slice(mainEnd + "</main>".length),
  };
}