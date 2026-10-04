import { readFileSync } from "node:fs";
import { join } from "node:path";

// The three delivered development templates. Their shells (header, menu,
// booking dialog, footer) are served verbatim; the main content renders as
// React components driven by the project row and its CMS modules.

const files: Record<string, string> = {
  "seven-x-seven": "single-project.html",
  "emerald-villa": "emerald-villa.html",
  "dubai-hills-mansion": "dubai-hills-mansion.html",
};

function routeLinks(html: string) {
  const routes: Record<string, string> = {
    "index.html#top": "/#top", "single-project.html": "/developments/seven-x-seven", "emerald-villa.html": "/developments/emerald-villa", "dubai-hills-mansion.html": "/developments/dubai-hills-mansion", "about-us.html": "/about", "legacy.html": "/legacy", "news.html": "/news", "invest-in-dubai.html": "/invest-in-dubai", "contact.html": "/contact", "terms.html": "/terms", "privacy-policy.html": "/privacy-policy", "cookie-policy.html": "/cookie-policy",
  };
  for (const [from, to] of Object.entries(routes)) html = html.replaceAll(`href="${from}`, `href="${to}`);
  return html;
}

function pageBody(slug: string) {
  const filename = files[slug];
  if (!filename) return null;
  const document = readFileSync(join(process.cwd(), "public", "legacy", filename), "utf8");
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error("The delivered development page does not contain a body element.");
  return routeLinks(match[1]
    .replace(/\s*<script\b[^>]*src="assets\/js\/(?:site|ownership-cost-planner)\.js[^"]*"[^>]*><\/script>/gi, "")
    .replace(/\b(src|href|poster|data-lightbox-src|data-image)="assets\//g, '$1="/legacy/assets/'));
}

function sliceBetween(html: string, startMarker: string, endMarker: string, includeEnd = true) {
  const start = html.indexOf(startMarker);
  if (start === -1) return "";
  const end = html.indexOf(endMarker, start);
  if (end === -1) return "";
  return includeEnd ? html.slice(start, end + endMarker.length) : html.slice(start, end);
}

/// Tag-stripped text with <br> preserved as newlines — editor-friendly
/// fallback copy extracted from the delivered files.
function textOf(html: string) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}

export type ProjectShell = {
  beforeMain: string;
  afterMain: string;
  heroVideo: string;
  heroPoster: string;
  overviewHeading: string;
  overviewText: string;
  overviewFigure: string;
  meydanFigure: string;
  calmFigure: string;
  /// The delivered travel-timeline + map block inside the location section —
  /// not CMS-managed, so it rides through verbatim.
  locationShell: string;
};

export function getProjectShell(slug: string): ProjectShell | null {
  const body = pageBody(slug);
  if (!body) return null;
  const mainStart = body.indexOf("<main");
  const mainEnd = body.indexOf("</main>");
  if (mainStart === -1 || mainEnd === -1) throw new Error("The delivered development page does not contain a main element.");
  const main = body.slice(mainStart, mainEnd);

  const hero = sliceBetween(main, '<section class="single-project-hero', "</section>");
  const overview = sliceBetween(main, '<section class="single-project-intro', "</section>");

  return {
    beforeMain: body.slice(0, mainStart),
    afterMain: body.slice(mainEnd + "</main>".length),
    heroVideo: hero.match(/\bsrc="([^"]+)"/)?.[1] ?? "",
    heroPoster: hero.match(/\bposter="([^"]+)"/)?.[1] ?? "",
    overviewHeading: textOf(overview.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? ""),
    overviewText: textOf(overview.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? ""),
    overviewFigure: sliceBetween(main, '<figure class="single-project-sketch', "</figure>"),
    meydanFigure: sliceBetween(main, '<figure class="single-project-meydan-media', "</figure>"),
    calmFigure: sliceBetween(main, '<figure class="single-project-calm-media', "</figure>"),
    locationShell: sliceBetween(main, '<div class="villa23-travel-shell"', "</section>", false),
  };
}