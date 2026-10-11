// ─────────────────────────────────────────────────────────────────────────────
// Canonical site identity. Single source of truth for absolute URLs used by
// metadata (metadataBase / Open Graph), the sitemap, robots.txt and JSON-LD.
// Override NEXT_PUBLIC_SITE_URL only in environments that serve a different
// canonical host; preview deployments must never become canonical.
// ─────────────────────────────────────────────────────────────────────────────
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kpd.ae").replace(/\/+$/, "");

/// Stable identifiers so structured data on every page points at the same entities.
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Absolute URL for a root-relative path ("/news" → "https://kpd.ae/news"). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/// Shared Organization structured data (root layout JSON-LD block).
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Kasumigaseki Properties Development",
  alternateName: "KPD",
  url: SITE_URL,
  logo: `${SITE_URL}/legacy/assets/images/brand/kasumigaseki-logo-horizontal-black-text.svg`,
  description: "Kasumigaseki Properties Development (KPD) extends Kasumigaseki Capital's development discipline to Dubai with a curated residential pipeline.",
  areaServed: "Dubai",
  email: "info@kpd.ae",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Bay Gate Tower, Floor 36, Business Bay",
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
} as const;
