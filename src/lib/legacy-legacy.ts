import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LegacyMilestone = { year?: string; title?: string; summary?: string; body?: string; image?: string };
export type LegacyContent = { heading?: string; text?: string; image?: string; timeline?: LegacyMilestone[] };

const legacyPath = join(process.cwd(), "public", "legacy", "legacy.html");

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function richText(value: string) {
  return escapeHtml(value).replace(/\n\s*\n/g, "<br><br>").replace(/\n/g, "<br>");
}

function pageBody() {
  const document = readFileSync(legacyPath, "utf8");
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error("The delivered Legacy page does not contain a body element.");
  return match[1].replace(/\b(src|href|data-lightbox-src|data-image)="assets\//g, "$1=\"/legacy/assets/");
}

function routeLinks(html: string) {
  const routes: Record<string, string> = {
    "index.html#top": "/#top", "single-project.html": "/developments/seven-x-seven", "emerald-villa.html": "/developments/emerald-villa", "dubai-hills-mansion.html": "/developments/dubai-hills-mansion", "about-us.html": "/about", "legacy.html": "/legacy", "news.html": "/news", "invest-in-dubai.html": "/invest-in-dubai", "contact.html": "/contact", "terms.html": "/terms", "privacy-policy.html": "/privacy-policy", "cookie-policy.html": "/cookie-policy",
  };
  for (const [from, to] of Object.entries(routes)) html = html.replaceAll(`href="${from}`, `href="${to}`);
  return html;
}

function timelineMarkup(timeline: LegacyMilestone[]) {
  return `<section class="legacy-timeline-section kpd-section" id="legacy-timeline" aria-label="Legacy milestones"><div class="legacy-timeline">${timeline.map((milestone, index) => {
    const side = index % 2 ? "right" : "left";
    const active = index === 0;
    return `<div class="legacy-timeline-row is-${side}${active ? " is-expanded" : ""}"${active ? ' style="--legacy-media-height: 420px;"' : ""}><details class="legacy-timeline-item timeline-item is-${side}${active ? " is-expanded" : ""}"${active ? " open" : ""}><summary><span class="legacy-year">${escapeHtml(milestone.year || "")}</span><span class="legacy-summary-copy"><strong>${escapeHtml(milestone.title || "")}</strong><span>${richText(milestone.summary || "")}</span></span></summary><div class="legacy-timeline-body"><p>${richText(milestone.body || "")}</p></div></details><figure class="legacy-timeline-media"><img src="${escapeHtml(milestone.image || "")}" alt="Legacy milestone ${escapeHtml(milestone.year || "")}"></figure></div>`;
  }).join("")}</div></section>`;
}

/// The supplied Legacy page remains the visual and interaction baseline.
export function getLegacyPage(content: LegacyContent) {
  let html = routeLinks(pageBody());
  if (content.heading) html = html.replace(/(<div class="page-reference-hero-copy[\s\S]*?<span>Legacy<\/span>\s*<h1>)[\s\S]*?(<\/h1>)/, `$1${richText(content.heading)}$2`);
  if (content.text) html = html.replace(/(<div class="page-reference-hero-copy[\s\S]*?<\/h1>\s*<p>)[\s\S]*?(<\/p>)/, `$1${richText(content.text)}$2`);
  if (content.image) html = html.replace(/(<section class="page-reference-hero"[\s\S]*?<img src=")[^"]+/, `$1${escapeHtml(content.image)}`);
  if (content.timeline?.length === 6) html = html.replace(/<section class="legacy-timeline-section kpd-section" id="legacy-timeline"[\s\S]*?<\/section>/, timelineMarkup(content.timeline));
  return html;
}
