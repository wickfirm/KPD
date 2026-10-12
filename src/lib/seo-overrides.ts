import { legalSeo, pageSeo } from "./seo";

// ── Editor-written search titles and descriptions ─────────────────────────────
//
// Pages, developments and articles get their search title and description
// automatically (src/lib/seo.ts). Editors can replace either one from the
// "Search appearance" box in each editor. The replacement is stored as one
// site_settings row per item, so no table needs a new column:
//   seo:page:<slug>   fixed pages (home, about, legacy, invest-in-dubai, contact, legal pages)
//   seo:project:<id>  developments (by id, so a changed page address keeps it)
//   seo:article:<id>  news and blog articles
// A blank box means "use the automatic text".

export type SeoOverride = { title?: string; description?: string };
export type SeoKind = "page" | "project" | "article";

export function seoKey(kind: SeoKind, id: string): string {
  return `seo:${kind}:${id}`;
}

const tidy = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

/// The two boxes as the editor submitted them, or null when the form has no
/// SEO boxes at all (a version saved before they existed), so a restore of
/// such a version leaves the saved SEO text alone.
export function seoOverrideFromForm(formData: FormData): SeoOverride | null {
  if (!formData.has("seoTitle") && !formData.has("seoDescription")) return null;
  return parseSeoOverride({ title: formData.get("seoTitle"), description: formData.get("seoDescription") });
}

/// A stored row's value, keeping only non-empty text.
export function parseSeoOverride(value: unknown): SeoOverride {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  const title = tidy(row.title);
  const description = tidy(row.description);
  return { ...(title ? { title } : {}), ...(description ? { description } : {}) };
}

/// The automatic title/description with the editor's text laid over it.
export function applySeoOverride<T extends { title: string; description: string }>(base: T, override: SeoOverride): T {
  return { ...base, title: override.title || base.title, description: override.description || base.description };
}

const fixedPageKeys: Record<string, keyof typeof pageSeo> = {
  home: "home",
  about: "about",
  legacy: "legacy",
  "invest-in-dubai": "invest",
  contact: "contact",
  news: "news",
};

/// The built-in title, description and path of a fixed page, by its slug.
export function fixedPageSeoDefaults(slug: string): { title: string; description: string; path: string } | null {
  const key = fixedPageKeys[slug];
  if (key) return pageSeo[key];
  const legal = legalSeo[slug as keyof typeof legalSeo];
  return legal ? { ...legal, path: `/${slug}` } : null;
}
