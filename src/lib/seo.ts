import type { Metadata } from "next";
import { ORGANIZATION_ID, WEBSITE_ID, SITE_URL, absoluteUrl } from "./site";

export { ORGANIZATION_ID, WEBSITE_ID };

// ── SEO and answer-engine (AEO) helpers ───────────────────────────────────────
//
// One place for page titles, descriptions, canonical links, social tags and
// structured data (JSON-LD). Copy below is written only from what the site
// itself says, so nothing here promises more than the pages deliver.

export const SITE_NAME = "Kasumigaseki Properties Development";
export const BRAND_SHORT = "KPD";

/// The branded social card generated at src/app/opengraph-image.tsx (1200 x 630).
/// Pages without artwork of their own share this one.
export const DEFAULT_SOCIAL_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: disciplined, long-horizon real estate in Dubai` };

/// Search results show roughly 60 characters of a title and 155 to 160 of a
/// description before cutting them off.
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/// Collapse whitespace and cut to at most `max` characters, preferring the end
/// of a sentence, then a word boundary (with an ellipsis).
export function clampDescription(text: string | null | undefined, max = DESCRIPTION_MAX): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const window = clean.slice(0, max);
  const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  if (sentenceEnd >= max * 0.6) return window.slice(0, sentenceEnd + 1);
  const wordEnd = window.lastIndexOf(" ", max - 2);
  return `${window.slice(0, wordEnd > 0 ? wordEnd : max - 1).replace(/[\s.,;:–-]+$/, "")}…`;
}

/// "<title> | KPD", unless that would run past the length search engines show.
export function withBrand(title: string): string {
  const branded = `${title} | ${BRAND_SHORT}`;
  return branded.length <= TITLE_MAX ? branded : title;
}

type MetadataInput = {
  title: string;
  description: string;
  /// Root-relative path ("/about"); becomes the canonical URL.
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
};

/// Complete metadata for one page: title (exactly as given, no site suffix
/// added), description, canonical link, Open Graph and Twitter cards.
export function pageMetadata(input: MetadataInput): Metadata {
  const description = clampDescription(input.description);
  const url = absoluteUrl(input.path);
  const images = [input.image ? { url: input.image } : DEFAULT_SOCIAL_IMAGE];
  return {
    title: { absolute: input.title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      siteName: SITE_NAME,
      url,
      title: input.title,
      description,
      images,
      ...(input.type === "article" && input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.type === "article" && input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: input.title, description, images },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// ── Copy for the fixed pages ──────────────────────────────────────────────────

export const pageSeo = {
  home: {
    path: "/",
    title: "Kasumigaseki Properties Development (KPD) | Dubai Developer",
    description: "KPD extends Kasumigaseki Capital's development discipline to Dubai with a curated residential pipeline: Seven X Seven, Emerald Villa and Dubai Hills Mansion.",
  },
  about: {
    path: "/about",
    title: "About KPD | Kasumigaseki Capital's Dubai Developer",
    description: "How Kasumigaseki Properties Development brings institutional discipline, long-term capital and a decades-deep development track record to Dubai.",
  },
  legacy: {
    path: "/legacy",
    title: "Our Legacy: From Tokyo to Dubai | KPD",
    description: "From Tokyo to Dubai, KPD's platform is shaped by disciplined capital, measured execution and development value built to hold over time. See the timeline.",
  },
  invest: {
    path: "/invest-in-dubai",
    title: "Invest in Dubai Property: Investor Guide | KPD",
    description: "A practical guide to buying Dubai residential property: ownership, residency, off-plan payment plans, resale and leasing, and how KPD supports buyers.",
  },
  contact: {
    path: "/contact",
    title: "Contact KPD | Plan a Visit to the Experience Center",
    description: "Plan a visit to the KPD Experience Center in Dubai or start a conversation about our residences. Project previews, walkthroughs and advisory appointments.",
  },
  news: {
    path: "/news",
    title: "News & Updates | Kasumigaseki Properties Development",
    description: "Announcements, market observations and development commentary from Kasumigaseki Properties Development.",
  },
} as const;

export const legalSeo = {
  "privacy-policy": {
    title: "Privacy Policy | KPD",
    description: "How KPD collects, uses and shares personal information from website visitors, buyers, investors and partners, and the choices you have.",
  },
  terms: {
    title: "Terms of Use | KPD",
    description: "The terms governing use of the Kasumigaseki Properties Development website, its project information, content and contact pages.",
  },
  "cookie-policy": {
    title: "Cookie Policy | KPD",
    description: "How this website uses cookies and similar technologies for essential functions, analytics and preferences, and how to manage them.",
  },
} as const;

// ── Development and article metadata ──────────────────────────────────────────

/// "Seven X Seven | Development in Dubai | KPD" (shortened if it would be cut off).
export function developmentTitle(name: string, location?: string | null): string {
  const place = (location ?? "").trim() || "Dubai";
  const long = `${name} | Development in ${place} | ${BRAND_SHORT}`;
  if (long.length <= TITLE_MAX) return long;
  const medium = `${name} | ${place} | ${BRAND_SHORT}`;
  return medium.length <= TITLE_MAX ? medium : withBrand(name);
}

/// The text that describes a development in search results: its description,
/// or its tagline when there is none (line breaks in either become spaces).
export function developmentDescription(project: { name: string; tagline?: string | null; description?: string | null }): string {
  const text = clampDescription(project.description) || clampDescription(project.tagline);
  return text || `${project.name}, a residential development by ${SITE_NAME} in Dubai.`;
}

// ── Structured data (JSON-LD) ─────────────────────────────────────────────────

/// Media URLs are either already absolute (R2 / CDN) or root-relative.
export function mediaUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : absoluteUrl(url);
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

type WebPageKind = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "FAQPage";

export function webPageJsonLd(input: { kind?: WebPageKind; name: string; description: string; path: string; image?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": input.kind ?? "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: clampDescription(input.description),
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    ...(input.image ? { primaryImageOfPage: { "@type": "ImageObject", url: mediaUrl(input.image) } } : {}),
  };
}

/// A development as a place: name, description, image and where it is. No
/// price or availability is claimed, because the site does not publish them.
export function residenceJsonLd(project: { slug: string; name: string; tagline?: string | null; description?: string | null; heroImage?: string | null; location?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Residence",
    "@id": `${absoluteUrl(`/developments/${project.slug}`)}#residence`,
    name: project.name,
    description: developmentDescription(project),
    url: absoluteUrl(`/developments/${project.slug}`),
    ...(project.heroImage ? { image: mediaUrl(project.heroImage) } : {}),
    address: { "@type": "PostalAddress", addressLocality: (project.location ?? "").trim() || "Dubai", addressCountry: "AE" },
  };
}
