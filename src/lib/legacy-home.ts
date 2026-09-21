import { readFileSync } from "node:fs";
import { join } from "node:path";

type HomeContent = {
  heroVideo?: string;
  introHeading?: string;
  introParagraphs?: string[];
  developmentHeading?: string;
  contactHeading?: string;
  contactText?: string;
  experienceImages?: string[];
};

const legacyPath = join(process.cwd(), "public", "legacy", "index.html");

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function bodyFromDocument(document: string) {
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error("The delivered homepage does not contain a body element.");
  return match[1]
    .replace(/\s*<script\b[^>]*src="assets\/js\/(?:live-news|site)\.js[^"]*"[^>]*><\/script>/gi, "")
    .replace(/\b(src|href|data-lightbox-src|data-image)="assets\//g, "$1=\"/legacy/assets/");
}

/// Returns the supplied client homepage with only the CMS-managed content
/// substituted. All remaining markup, class names, image treatments, and
/// interaction hooks stay byte-for-byte aligned with the delivered source.
export function getLegacyHomepage(content: HomeContent) {
  let html = bodyFromDocument(readFileSync(legacyPath, "utf8"));

  // Route links migrate to their canonical Next.js destinations while anchors
  // and all visual markup continue to match the supplied document.
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

  if (content.heroVideo) html = html.replace(/(<section class="pdf-section pdf-hero">\s*<video src=")[^"]+/, `$1${escapeHtml(content.heroVideo)}`);
  if (content.introHeading) html = html.replace("Turning Challenge<br>Into Value", escapeHtml(content.introHeading).replace(/\n/g, "<br>"));
  if (content.introParagraphs?.length) {
    html = html.replace(/(<div class="pdf-intro-copy">)[\s\S]*?(<\/div>\s*<\/div>\s*<div class="pdf-stat-grid">)/, `$1${content.introParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}$2`);
  }
  if (content.developmentHeading) html = html.replace("<h2>Our Developments</h2>", `<h2>${escapeHtml(content.developmentHeading)}</h2>`);
  if (content.contactHeading) html = html.replace("<h2>A first point of contact</h2>", `<h2>${escapeHtml(content.contactHeading)}</h2>`);
  if (content.contactText) {
    html = html.replace(/(<div class="pdf-contact-copy">\s*)<p>[\s\S]*?<\/p>/, `$1<p>${escapeHtml(content.contactText)}</p>`);
  }
  if (content.experienceImages?.length === 5) {
    const panels = content.experienceImages.map((image, index) => {
      const source = escapeHtml(image);
      const label = `Experience Center image ${index + 1}`;
      return `<button class="pdf-gallery-panel" type="button" data-gallery-panel="cms-${index + 1}" data-lightbox-src="${source}" data-lightbox-caption="${label}"><img src="${source}" alt="${label}"></button>`;
    }).join("");
    html = html.replace(/(<section class="pdf-section pdf-vertical-gallery pdf-gallery-flex" id="experience-center"[^>]*>)[\s\S]*?(<\/section>)/, `$1${panels}$2`);
  }

  return html;
}
