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

/// The delivered tail keeps three visible bands (events head, events grid,
/// sunset band — the sections carrying the "pdf-section" class); everything
/// after them is the old homepage, hidden with CSS. Hidden markup still ships
/// to the browser where search engines see it — including a second H1 and
/// internal production notes — so the tail now stops after the last
/// pdf-section and the old bands are not served at all (client feedback
/// batch 3, item 5).
function keepVisibleSections(tail: string): string {
  const visible: string[] = [];
  let index = 0;
  for (;;) {
    const start = tail.indexOf("<section", index);
    if (start === -1) break;
    const tagRe = /<\/?section\b[^>]*>/g;
    tagRe.lastIndex = start;
    let depth = 0;
    let end = -1;
    let match: RegExpExecArray | null;
    while ((match = tagRe.exec(tail))) {
      depth += match[0][1] === "/" ? -1 : 1;
      if (depth === 0) {
        end = match.index + match[0].length;
        break;
      }
    }
    if (end === -1) break;
    const block = tail.slice(start, end);
    if (/\bpdf-section\b/.test(block.slice(0, block.indexOf(">")))) visible.push(block);
    index = end;
  }
  return visible.join("\n");
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
  return keepVisibleSections(body.slice(eventsStart, mainEnd));
}