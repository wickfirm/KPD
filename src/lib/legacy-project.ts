import { readFileSync } from "node:fs";
import { join } from "node:path";

type Item = { label?: string; value?: string; image?: string; url?: string };
type Module = { slug: string; title: string; kind: string; content: unknown };
type Project = { slug: string; name: string; tagline?: string | null; description?: string | null; heroImage?: string | null; modules: Module[] };
type Content = { text?: string; images?: string[]; items?: Item[]; url?: string };

const files: Record<string, string> = {
  "seven-x-seven": "single-project.html",
  "emerald-villa": "emerald-villa.html",
  "dubai-hills-mansion": "dubai-hills-mansion.html",
};
const requiredModuleSlugs = ["location", "tour", "amenities", "brochure", "floor-plans", "payment-plan"];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function content(value: unknown): Content {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Content : {};
}

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
  return routeLinks(match[1].replace(/\b(src|href|poster|data-lightbox-src|data-image)="assets\//g, '$1="/legacy/assets/'));
}

function section(html: string, id: string, edit: (value: string) => string) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`(<section\\b(?=[^>]*\\bid="${escapedId}")[^>]*>[\\s\\S]*?<\\/section>)`);
  return html.replace(expression, (_match, value: string) => edit(value));
}

function replaceHeadingAndText(html: string, title?: string, text?: string) {
  if (title) html = html.replace(/(<h2>)[\s\S]*?(<\/h2>)/, `$1${escapeHtml(title)}$2`);
  if (text) html = html.replace(/(<p>)[\s\S]*?(<\/p>)/, `$1${escapeHtml(text)}$2`);
  return html;
}

function projectModule(project: Project, slug: string) {
  return project.modules.find((module) => module.slug === slug);
}

/// Returns the delivered client page verbatim until its full CMS section set
/// has been initialized. Once initialized, only named editable fields are
/// substituted; the delivered layout and interactions remain untouched.
export function getLegacyProject(project: Project) {
  let html = pageBody(project.slug);
  if (!html) return null;

  const initialized = requiredModuleSlugs.every((slug) => projectModule(project, slug));
  if (!initialized) return html;

  html = html.replace(/(<section class="single-project-hero[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, `$1${escapeHtml(project.name)}$2`);
  if (project.heroImage) html = html.replace(/(<video\b[^>]*\bposter=")[^"]+/, `$1${escapeHtml(project.heroImage)}`);
  if (project.tagline || project.description) html = section(html, "overview", (value) => {
    if (project.tagline) value = value.replace(/(<div class="single-project-intro-copy">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, `$1${escapeHtml(project.tagline)}$2`);
    if (project.description) value = value.replace(/(<div class="single-project-intro-copy">[\s\S]*?<p>)[\s\S]*?(<\/p>)/, `$1${escapeHtml(project.description)}$2`);
    return value;
  });

  const feature = project.modules.find((module) => module.kind === "CUSTOM" && module.slug !== "brochure" && module.slug !== "payment-plan");
  if (feature) {
    const data = content(feature.content);
    html = section(html, feature.slug, (value) => {
      value = replaceHeadingAndText(value, feature.title, data.text);
      if (data.images?.[0]) value = value.replace(/(<figure[^>]*>\s*<img src=")[^"]+/, `$1${escapeHtml(data.images[0])}`);
      if (data.items?.length) value = value.replace(/(<div class="single-project-meydan-stats"[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<figure)/, `$1${data.items.map((item) => `<div><strong>${escapeHtml(item.value || "")}</strong><span>${escapeHtml(item.label || "")}</span></div>`).join("")}$2`);
      return value;
    });
  }

  const location = projectModule(project, "location");
  if (location) {
    const data = content(location.content);
    html = section(html, "location", (value) => {
      value = replaceHeadingAndText(value, location.title, data.text);
      if (data.items?.length) {
        const split = Math.ceil(data.items.length / 2);
        const list = (items: Item[]) => `<ul>${items.map((item) => `<li><span>${escapeHtml(item.value || "")}</span><strong>${escapeHtml(item.label || "")}</strong></li>`).join("")}</ul>`;
        value = value.replace(/(<div class="single-project-proximity-grid"[^>]*>)[\s\S]*?(<\/div>\s*<div class="villa23-travel-shell")/, `$1${list(data.items.slice(0, split))}${list(data.items.slice(split))}$2`);
      }
      return value;
    });
  }

  const tour = projectModule(project, "tour");
  if (tour) {
    const data = content(tour.content);
    html = section(html, "showcase", (value) => {
      if (tour.title) value = value.replace(/(<div class="pdf-development-content">\s*<h2>)[\s\S]*?(<\/h2>)/, `$1${escapeHtml(tour.title)}$2`);
      if (data.images?.length) value = value.replace(/(<div class="pdf-development-slides"[^>]*>)[\s\S]*?(<\/div>\s*<div class="pdf-development-content">)/, `$1${data.images.map((image, index) => `<div class="pdf-development-slide${index === 0 ? " active" : ""}"><img src="${escapeHtml(image)}" alt=""></div>`).join("")}$2`);
      return value;
    });
  }

  const amenities = projectModule(project, "amenities");
  if (amenities) {
    const data = content(amenities.content);
    html = section(html, "amenities", (value) => {
      value = replaceHeadingAndText(value, amenities.title, data.text);
      if (data.images?.length) value = value.replace(/(<div class="pdf-vertical-gallery[^>]*>)[\s\S]*?(<\/div>\s*<\/section>)/, `$1${data.images.map((image, index) => `<button class="pdf-gallery-panel${index === 0 ? " is-active" : ""}" type="button" data-gallery-panel data-lightbox-src="${escapeHtml(image)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(data.items?.[index]?.label || amenities.title)}"><span>${escapeHtml(data.items?.[index]?.label || `Image ${index + 1}`)}</span></button>`).join("")}$2`);
      return value;
    });
  }

  const brochure = projectModule(project, "brochure");
  if (brochure) {
    const data = content(brochure.content);
    html = section(html, "brochure", (value) => {
      value = replaceHeadingAndText(value, brochure.title, data.text);
      if (data.images?.[0]) value = value.replace(/(<figure class="single-project-calm-media[\s\S]*?<img src=")[^"]+/, `$1${escapeHtml(data.images[0])}`);
      return value;
    });
  }

  const plans = projectModule(project, "floor-plans");
  if (plans) {
    const data = content(plans.content);
    html = section(html, "floor-plans", (value) => {
      value = replaceHeadingAndText(value, plans.title, data.text);
      if (data.items?.length) value = value.replace(/(<div class="single-project-floor-grid">)[\s\S]*?(<\/div>\s*<\/section>)/, `$1${data.items.map((item) => `<article class="single-project-floor-card">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.label || "Floor plan")}">` : ""}<div><strong>${escapeHtml(item.label || "Floor plan")}</strong>${item.url ? `<a href="${escapeHtml(item.url)}">Download</a>` : ""}</div></article>`).join("")}$2`);
      return value;
    });
  }

  const payment = projectModule(project, "payment-plan");
  if (payment) {
    const data = content(payment.content);
    html = section(html, "payment-plan", (value) => {
      value = replaceHeadingAndText(value, payment.title, data.text);
      if (data.items?.length) value = value.replace(/(<div class="single-project-payment-grid">)[\s\S]*?(<\/div>\s*<\/section>)/, `$1${data.items.map((item) => `<article><strong>${escapeHtml(item.value || "")}</strong><span>${escapeHtml(item.label || "")}</span></article>`).join("")}$2`);
      return value;
    });
  }
  return html;
}
