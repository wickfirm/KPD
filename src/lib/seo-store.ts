import { cache } from "react";
import { db } from "./db";
import { clampDescription } from "./seo";
import { applySeoOverride, fixedPageSeoDefaults, parseSeoOverride, seoKey, type SeoOverride } from "./seo-overrides";

// ── Reading and writing editor SEO text (see seo-overrides.ts) ────────────────

/// The editor's SEO text for one item; empty when none is saved or the
/// database cannot be reached (the page then uses its automatic text).
export const loadSeoOverride = cache(async (key: string): Promise<SeoOverride> => {
  try {
    const row = await db.siteSetting.findUnique({ where: { key } });
    return parseSeoOverride(row?.value);
  } catch {
    return {};
  }
});

/// Stores the editor's SEO text; two blank boxes remove the row. `null` (a
/// form without SEO boxes) changes nothing.
export async function saveSeoOverride(key: string, override: SeoOverride | null): Promise<void> {
  if (!override) return;
  if (!override.title && !override.description) {
    await db.siteSetting.deleteMany({ where: { key } });
    return;
  }
  await db.siteSetting.upsert({ where: { key }, create: { key, value: override }, update: { value: override } });
}

export async function deleteSeoOverride(key: string): Promise<void> {
  await db.siteSetting.deleteMany({ where: { key } }).catch(() => undefined);
}

/// A fixed page's title, description and path, with any editor text applied.
export async function loadFixedPageSeo(slug: string): Promise<{ title: string; description: string; path: string }> {
  const base = fixedPageSeoDefaults(slug);
  if (!base) throw new Error(`No built-in SEO copy for "${slug}".`);
  return applySeoOverride(base, await loadSeoOverride(seoKey("page", slug)));
}

/// What an editor's "Search appearance" box starts with: the saved text plus
/// the automatic text it falls back to (shown as the placeholder).
export async function editorSeoDefaults(key: string, auto: { title: string; description: string }) {
  const saved = await loadSeoOverride(key);
  return { title: saved.title ?? "", description: saved.description ?? "", autoTitle: auto.title, autoDescription: clampDescription(auto.description) };
}
