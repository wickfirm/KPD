import { readFileSync } from "node:fs";
import { join } from "node:path";

export type AboutContent = {
  heading?: string;
  heroText?: string;
  heroImage?: string;
  story?: string[];
  mission?: string;
  vision?: string;
  chairmanText?: string;
  chairmanName?: string;
  chairmanRole?: string;
  chairmanImage?: string;
  management?: { name?: string; role?: string; bio?: string; image?: string }[];
};

const legacyPath = join(process.cwd(), "public", "legacy", "about-us.html");

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function richText(value: string) {
  return escapeHtml(value).replace(/\n\s*\n/g, "<br><br>").replace(/\n/g, "<br>");
}

function pageBody() {
  const document = readFileSync(legacyPath, "utf8");
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

/// Uses the client's document as the visual contract and swaps only named CMS
/// blocks. Blank CMS fields intentionally retain the supplied client content.
export function getLegacyAbout(content: AboutContent) {
  let html = routeLinks(pageBody());
  const heading = content.heading ? richText(content.heading) : undefined;
  if (heading) {
    html = html.replace(/(<div class="page-reference-hero-copy[^"]*">[\s\S]*?<span>About<\/span>\s*<h1>)[\s\S]*?(<\/h1>)/, `$1${heading}$2`);
    html = html.replace(/(<h2 class="about-story-title">)[\s\S]*?(<\/h2>)/, `$1${heading}$2`);
  }
  if (content.heroText) html = html.replace(/(<div class="page-reference-hero-copy[\s\S]*?<\/h1>\s*<p>)[\s\S]*?(<\/p>)/, `$1${richText(content.heroText)}$2`);
  if (content.heroImage) html = html.replace(/(<section class="page-reference-hero"[\s\S]*?<img src=")[^"]+/, `$1${escapeHtml(content.heroImage)}`);
  if (content.story?.length) html = html.replace(/(<div class="about-story-copy">[\s\S]*?<\/h2>)[\s\S]*?(<\/div>\s*<div class="about-story-media">)/, `$1${content.story.map((paragraph) => `<p>${richText(paragraph)}</p>`).join("")}$2`);
  if (content.mission) html = html.replace(/(<article class="about-mission-card">\s*<h2>Our Mission<\/h2>\s*<p>)[\s\S]*?(<\/p>)/, `$1${richText(content.mission)}$2`);
  if (content.vision) html = html.replace(/(<article class="about-mission-card">\s*<h2>Our Vision<\/h2>\s*<p>)[\s\S]*?(<\/p>)/, `$1${richText(content.vision)}$2`);
  if (content.chairmanText) html = html.replace(/(<section class="about-chairman"[\s\S]*?<div class="about-chairman-copy">\s*<p>)[\s\S]*?(<\/p>)/, `$1${richText(content.chairmanText)}$2`);
  if (content.chairmanName) html = html.replace(/(<section class="about-chairman"[\s\S]*?<div class="about-chairman-signature">\s*<strong>)[\s\S]*?(<\/strong>)/, `$1${escapeHtml(content.chairmanName)}$2`);
  if (content.chairmanRole) html = html.replace(/(<section class="about-chairman"[\s\S]*?<div class="about-chairman-signature">[\s\S]*?<span>)[\s\S]*?(<\/span>)/, `$1${escapeHtml(content.chairmanRole)}$2`);
  if (content.chairmanImage) html = html.replace(/(<div class="about-chairman-media">\s*<img src=")[^"]+/, `$1${escapeHtml(content.chairmanImage)}`);
  if (content.management?.length === 3) {
    const cards = content.management.map((person, index) => `<article class="about-management-card" role="button" tabindex="0" aria-label="Open biography for ${escapeHtml(person.name || `Executive ${index + 1}`)}" data-management-name="${escapeHtml(person.name || "")}" data-management-role="${escapeHtml(person.role || "")}" data-management-bio="${escapeHtml(person.bio || "")}"><figure><div class="about-management-image"><img src="${escapeHtml(person.image || "")}" alt="Executive management portrait"></div><figcaption><strong>${escapeHtml(person.name || "")}</strong><span>${escapeHtml(person.role || "")}</span></figcaption></figure></article>`).join("");
    html = html.replace(/(<div class="about-management-grid">)[\s\S]*?(<\/div>\s*<\/section>)/, `$1${cards}$2`);
  }
  // The supplied file repeats the Chairman's copy in a second CEO block. The
  // client has confirmed that duplicate should not appear on the public page.
  return html.replace(/\s*<section class="about-ceo"[\s\S]*?<\/section>/, "");
}
