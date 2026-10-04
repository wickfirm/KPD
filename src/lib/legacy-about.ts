import { readFileSync } from "node:fs";
import { join } from "node:path";
import { aboutDefaults } from "./about-defaults";

export { aboutDefaults };
export type { AboutContent, AboutPerson } from "./about-defaults";

const aboutPath = join(process.cwd(), "public", "legacy", "about-us.html");

function pageBody() {
  const document = readFileSync(aboutPath, "utf8");
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error("The delivered About page does not contain a body element.");
  return match[1]
    .replace(/\b(src|href|data-lightbox-src|data-image)="assets\//g, "$1=\"/legacy/assets/");
}

function routeLinks(html: string) {
  const routes: Record<string, string> = {
    "index.html#top": "/#top", "single-project.html": "/developments/seven-x-seven", "emerald-villa.html": "/developments/emerald-villa", "dubai-hills-mansion.html": "/developments/dubai-hills-mansion", "about-us.html": "/about", "legacy.html": "/legacy", "news.html": "/news", "invest-in-dubai.html": "/invest-in-dubai", "contact.html": "/contact", "terms.html": "/terms", "privacy-policy.html": "/privacy-policy", "cookie-policy.html": "/cookie-policy",
  };
  for (const [from, to] of Object.entries(routes)) html = html.replaceAll(`href="${from}`, `href="${to}`);
  return html;
}

/// The delivered page keeps a guaranteed pixel-identical shell: everything
/// outside <main> (header, menu, booking dialog, footer) is served verbatim,
/// with legacy routes mapped to the Next.js ones. The main content renders as
/// React components (src/components/public/about-page.tsx).
export function getAboutPageShell() {
  const body = routeLinks(pageBody());
  const mainStart = body.indexOf("<main");
  const mainEnd = body.indexOf("</main>");
  if (mainStart === -1 || mainEnd === -1) throw new Error("The delivered About page does not contain a main element.");
  // The delivered site.js script tag is inert inside innerHTML - the page
  // re-attaches it via AboutPageScripts. Drop it from the shell.
  const afterMain = body.slice(mainEnd + "</main>".length).replace(/\s*<script src="[^"]*site\.js[^"]*"><\/script>\s*$/i, "");
  return { beforeMain: body.slice(0, mainStart), afterMain };
}
