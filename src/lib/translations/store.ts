import { cache } from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE, prefixedLocales, type Locale } from "@/lib/locales";
import { getLocale } from "@/lib/locale";
import { getNavDevelopments } from "@/lib/nav-developments";
import { applySeoOverride, parseSeoOverride, seoKey } from "@/lib/seo-overrides";
import { projectChromeKey } from "@/lib/project-chrome";
import { loadFixedPageSeo } from "@/lib/seo-store";
import { getGlobalSettings } from "@/lib/site-contact";
import { hasTranslation, mergeLocale, translationDiff, translationSettingKey, type TranslationJson } from "./merge-locale";

// ─────────────────────────────────────────────────────────────────────────────
// Translations of CMS content: reading them on the public pages and storing
// them from the editors' Arabic and Japanese tabs.
//
// Where a translation lives, next to the English it translates:
//   site_settings           "home", "global", "sxs", "news_listing",
//                           "project-chrome:<id>", "seo:<kind>:<id>"
//     → a row per language  "home:ar", "seo:page:about:ja", …
//   articles                article_translations   (title, summary, body, alt text)
//   pages                   page_translations      (title, content)
//   developments            project_translations   (name, tagline, description, location)
//   development sections    project_modules.translations  { ar: { title, content } }
//
// Two rules hold everywhere in this file:
// - English never reads a translation. Every loader hands back the English
//   value it was given, without a query, when the language is English.
// - A translation that cannot be read never shows: the page falls back to its
//   English text. So the site keeps working in any order of deploy and
//   database migration, and a damaged translation row cannot break a page.
// ─────────────────────────────────────────────────────────────────────────────

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
export const textOrNull = (value: unknown) => (typeof value === "string" ? value : null);

/// The stored form of a diff: null when nothing in it is translated.
function stored(diff: TranslationJson): RecordValue | null {
  return hasTranslation(diff) && isRecord(diff) ? diff : null;
}

// ── Reading ──────────────────────────────────────────────────────────────────

/// A record's translation (the site_settings row "home:ar"), or null.
export const settingTranslation = cache(async (key: string, locale: Locale): Promise<unknown> => {
  if (locale === DEFAULT_LOCALE) return null;
  try {
    return (await db.siteSetting.findUnique({ where: { key: translationSettingKey(key, locale) } }))?.value ?? null;
  } catch {
    return null;
  }
});

/// A record in a language: the English value with the translation's text laid
/// over it.
export async function localizedSetting<T>(key: string, english: T, locale: Locale): Promise<T> {
  if (locale === DEFAULT_LOCALE) return english;
  return mergeLocale(english, await settingTranslation(key, locale));
}

// The three below read the language of the request themselves, so a shared
// component swaps one call for another. For English they are exactly the
// English loader: same value, same object, no query for a translation.

/// Site-wide copy (header button, floating buttons, enquiry popup, footer) in
/// the language of the request.
export const getLocalizedGlobalSettings = cache(async () => {
  const [settings, locale] = await Promise.all([getGlobalSettings(), getLocale()]);
  return localizedSetting("global", settings, locale);
});

/// The developments listed in the site menu and the footer, in the language of
/// the request.
export const getLocalizedNavDevelopments = cache(async () => {
  const [developments, locale] = await Promise.all([getNavDevelopments(), getLocale()]);
  return localizedDevelopments(developments, locale);
});

/// A fixed page's title, description and path with its search text in the
/// language of the request.
export const loadLocalizedFixedPageSeo = cache(async (slug: string) => {
  const [seo, locale] = await Promise.all([loadFixedPageSeo(slug), getLocale()]);
  return localizedSeo(seo, seoKey("page", slug), locale);
});

/// A page's search title and description in a language, over the English text
/// they start from.
export async function localizedSeo<T extends { title: string; description: string }>(base: T, key: string, locale: Locale): Promise<T> {
  if (locale === DEFAULT_LOCALE) return base;
  return applySeoOverride(base, parseSeoOverride(await settingTranslation(key, locale)));
}

/// What the "Search appearance" box starts with on a translation tab: the
/// translation's saved text, with the English search text it falls back to as
/// the placeholder. `english` is what the box starts with on the English tab.
export async function translatedSeoDefaults(key: string, english: { title: string; description: string; autoTitle?: string; autoDescription?: string }, locale: Locale) {
  if (locale === DEFAULT_LOCALE) return english;
  const saved = parseSeoOverride(await settingTranslation(key, locale));
  return { title: saved.title ?? "", description: saved.description ?? "", autoTitle: english.title || english.autoTitle || "", autoDescription: english.description || english.autoDescription || "" };
}

type PageTranslationValue = { title?: string; content?: unknown };

/// The translations of pages, by slug. Never throws.
export async function pageTranslations(slugs: readonly string[], locale: Locale): Promise<Map<string, PageTranslationValue>> {
  const found = new Map<string, PageTranslationValue>();
  if (locale === DEFAULT_LOCALE || !slugs.length) return found;
  try {
    const rows = await db.pageTranslation.findMany({
      where: { locale, page: { slug: { in: [...slugs] } } },
      select: { title: true, content: true, page: { select: { slug: true } } },
    });
    for (const row of rows) {
      found.set(row.page.slug, { ...(row.title !== null ? { title: row.title } : {}), ...(row.content !== null ? { content: row.content } : {}) });
    }
  } catch {}
  return found;
}

/// A page's blocks in a language: the saved English blocks with the
/// translation's text laid over them, block by block.
export async function localizedBlocks<T extends unknown[]>(slug: string, blocks: T, locale: Locale): Promise<T> {
  if (locale === DEFAULT_LOCALE) return blocks;
  return mergeLocale(blocks, (await pageTranslations([slug], locale)).get(slug)?.content);
}

/// A page's title in a language.
export async function localizedPageTitle(slug: string, title: string, locale: Locale): Promise<string> {
  if (locale === DEFAULT_LOCALE) return title;
  return mergeLocale(title, (await pageTranslations([slug], locale)).get(slug)?.title);
}

/// A legal page (Terms, Privacy, Cookies) shows two things that can be
/// translated: the "Questions" block and the document itself. Its translation
/// stores them as two blocks, in this order, whatever the English page's own
/// blocks are — the English document is the client's text in
/// src/lib/terms-defaults.ts and is not in the database.
export const LEGAL_TRANSLATION_BLOCKS = ["legal-contact", "legal-document"] as const;
export type LegalTranslation = { contact?: RecordValue; document?: RecordValue };

export async function legalTranslation(slug: string, locale: Locale): Promise<LegalTranslation> {
  const content = (await pageTranslations([slug], locale)).get(slug)?.content;
  const found: LegalTranslation = {};
  if (!Array.isArray(content)) return found;
  for (const block of content) {
    if (!isRecord(block)) continue;
    if (block.type === "legal-contact") found.contact ??= block;
    if (block.type === "legal-document") found.document ??= block;
  }
  return found;
}

export const articleTranslation = cache(async (articleId: string, locale: Locale): Promise<RecordValue | null> => {
  if (locale === DEFAULT_LOCALE) return null;
  try {
    const row = await db.articleTranslation.findUnique({ where: { articleId_locale: { articleId, locale } } });
    if (!row) return null;
    const value = {
      ...(row.title !== null ? { title: row.title } : {}),
      ...(row.summary !== null ? { summary: row.summary } : {}),
      ...(row.body !== null ? { body: row.body } : {}),
      ...(row.coverImageAlt !== null ? { coverImageAlt: row.coverImageAlt } : {}),
    };
    return hasTranslation(value) ? value : null;
  } catch {
    return null;
  }
});

/// An article in a language: title, summary, body and alt text over the English ones.
export async function localizedArticle<T extends { id: string }>(article: T, locale: Locale): Promise<T> {
  if (locale === DEFAULT_LOCALE) return article;
  return mergeLocale(article, await articleTranslation(article.id, locale));
}

/// Articles in a language, matched by slug (the News page and the homepage cards).
export async function localizedArticles<T extends { slug: string }>(items: T[], locale: Locale): Promise<T[]> {
  if (locale === DEFAULT_LOCALE || !items.length) return items;
  const found = new Map<string, RecordValue>();
  try {
    const rows = await db.articleTranslation.findMany({
      where: { locale, article: { slug: { in: items.map((item) => item.slug) } } },
      select: { title: true, summary: true, body: true, coverImageAlt: true, article: { select: { slug: true } } },
    });
    for (const row of rows) {
      const value = {
        ...(row.title !== null ? { title: row.title } : {}),
        ...(row.summary !== null ? { summary: row.summary } : {}),
        ...(row.body !== null ? { body: row.body } : {}),
        ...(row.coverImageAlt !== null ? { coverImageAlt: row.coverImageAlt } : {}),
      };
      if (hasTranslation(value)) found.set(row.article.slug, value);
    }
  } catch {}
  return items.map((item) => mergeLocale(item, found.get(item.slug)));
}

type ProjectTranslationValue = { name?: string; tagline?: string; description?: string; location?: string };

async function projectTranslationsWhere(where: Prisma.ProjectTranslationWhereInput, locale: Locale, by: "id" | "slug"): Promise<Map<string, ProjectTranslationValue>> {
  const found = new Map<string, ProjectTranslationValue>();
  if (locale === DEFAULT_LOCALE) return found;
  try {
    const rows = await db.projectTranslation.findMany({ where, select: { projectId: true, project: { select: { slug: true } }, name: true, tagline: true, description: true, location: true } });
    for (const row of rows) {
      const value = {
        ...(row.name !== null ? { name: row.name } : {}),
        ...(row.tagline !== null ? { tagline: row.tagline } : {}),
        ...(row.description !== null ? { description: row.description } : {}),
        ...(row.location !== null ? { location: row.location } : {}),
      };
      if (hasTranslation(value)) found.set(by === "id" ? row.projectId : row.project.slug, value);
    }
  } catch {}
  return found;
}

/// The translations of developments, by id or by slug.
export function projectTranslations(ids: readonly string[], locale: Locale) {
  return projectTranslationsWhere({ locale, projectId: { in: [...ids] } }, locale, "id");
}
export function projectTranslationsBySlug(slugs: readonly string[], locale: Locale) {
  return projectTranslationsWhere({ locale, project: { slug: { in: [...slugs] } } }, locale, "slug");
}

/// A development section in a language: its title and text with the section's
/// translation for that language (one entry of project_modules.translations,
/// see moduleTranslations) laid over them. No entry, or a null one, is English.
export function localizedModule<T extends { title: string; content: unknown }>(module: T, translation: unknown): T {
  return { ...module, ...mergeLocale({ title: module.title, content: module.content }, translation) };
}

/// The translations of development sections, by section id: the language's
/// entry of each section's `translations` column. English asks for nothing.
/// Never throws: with none readable, the sections show their English text.
export async function moduleTranslations(ids: readonly string[], locale: Locale): Promise<Map<string, unknown>> {
  const found = new Map<string, unknown>();
  if (locale === DEFAULT_LOCALE || !ids.length) return found;
  try {
    const rows = await db.projectModule.findMany({ where: { id: { in: [...ids] } }, select: { id: true, translations: true } });
    for (const row of rows) {
      const translation = isRecord(row.translations) ? row.translations[locale] : null;
      if (translation) found.set(row.id, translation);
    }
  } catch {}
  return found;
}

/// A development page in a language: the development's own text, each
/// section's title and text, and the page labels. The sections arrive without
/// their translation column (src/lib/project-modules.ts); it is read here, and
/// only for another language than English.
export async function localizedProject<T extends { id: string; modules?: unknown }>(project: T, locale: Locale): Promise<T> {
  if (locale === DEFAULT_LOCALE) return project;
  const merged = mergeLocale(project, (await projectTranslations([project.id], locale)).get(project.id)) as T;
  if (!Array.isArray(project.modules)) return merged;
  const translations = await moduleTranslations(project.modules.flatMap((module) => (isRecord(module) && typeof module.id === "string" ? [module.id] : [])), locale);
  return {
    ...merged,
    modules: project.modules.map((module) => (isRecord(module) && typeof module.title === "string" ? localizedModule(module as { title: string; content: unknown }, translations.get(String(module.id))) : module)),
  } as T;
}

/// The homepage's development cards in a language (they carry a slug, not an id).
export async function localizedDevelopmentCards<T extends { href: string; title: string; copy: string }>(cards: T[], locale: Locale): Promise<T[]> {
  if (locale === DEFAULT_LOCALE || !cards.length) return cards;
  const slugs = cards.map((card) => card.href.replace(/^\/developments\//, "").split(/[?#]/)[0]);
  const found = await projectTranslationsBySlug(slugs, locale);
  return cards.map((card, index) => {
    const text = found.get(slugs[index]);
    if (!text) return card;
    return mergeLocale(card, { ...(text.name ? { title: text.name } : {}), ...(text.description ? { copy: text.description } : {}) });
  });
}

/// Developments in a language by slug: the names in the site menu and the
/// footer (src/lib/nav-developments.ts).
export async function localizedDevelopments<T extends { slug: string; name: string }>(items: T[], locale: Locale): Promise<T[]> {
  if (locale === DEFAULT_LOCALE || !items.length) return items;
  const found = await projectTranslationsBySlug(items.map((item) => item.slug), locale);
  return items.map((item) => mergeLocale(item, found.get(item.slug)));
}

/// The investor guide in a language. Its loader hands out the hero and the
/// sections on their own, so the blocks are read again here to lay the
/// translation over them block by block.
export async function localizedInvestPage<T extends { hero?: unknown; saved?: unknown }>(english: T, locale: Locale): Promise<T> {
  if (locale === DEFAULT_LOCALE) return english;
  try {
    const page = await db.staticPage.findUnique({ where: { slug: "invest-in-dubai" }, select: { content: true } });
    if (!Array.isArray(page?.content)) return english;
    const blocks = mergeLocale(page.content as unknown[], (await pageTranslations(["invest-in-dubai"], locale)).get("invest-in-dubai")?.content);
    const pick = (type: string) => blocks.find((block) => isRecord(block) && block.type === type);
    const hero = pick("hero");
    const saved = pick("invest");
    return { ...(hero ? { hero } : {}), ...(saved ? { saved } : {}) } as T;
  } catch {
    return english;
  }
}

// ── Storing ──────────────────────────────────────────────────────────────────

/// The diff of what a form translates, in its stored form.
export function diffOf(english: unknown, built: unknown): RecordValue | null {
  return stored(translationDiff(english, built));
}

/// Stores a record's translation (site_settings "<key>:<locale>"), or removes
/// it when the form translated nothing. Returns whether anything is translated.
export async function writeSettingTranslation(key: string, locale: Locale, english: unknown, built: unknown): Promise<boolean> {
  const diff = diffOf(english, built);
  const settingKey = translationSettingKey(key, locale);
  if (!diff) {
    await db.siteSetting.deleteMany({ where: { key: settingKey } });
    return false;
  }
  await db.siteSetting.upsert({ where: { key: settingKey }, create: { key: settingKey, value: diff as never }, update: { value: diff as never } });
  return true;
}

/// A page's translation: its title and its blocks. A block list is stored with
/// null where a block is still English, so it stays lined up by position.
export async function writePageTranslation(pageId: string, locale: Locale, english: { title?: string; content?: unknown }, built: { title?: string; content?: unknown }): Promise<boolean> {
  const diff = diffOf({ title: english.title ?? "", content: english.content ?? null }, { title: built.title ?? "", content: built.content ?? null });
  const where = { pageId_locale: { pageId, locale } };
  if (!diff) {
    await db.pageTranslation.deleteMany({ where: { pageId, locale } });
    return false;
  }
  const data = { title: textOrNull(diff.title), content: diff.content === undefined ? Prisma.DbNull : (diff.content as Prisma.InputJsonValue) };
  await db.pageTranslation.upsert({ where, create: { pageId, locale, ...data }, update: data });
  return true;
}

export async function writeArticleTranslation(articleId: string, locale: Locale, english: { title: string; summary: string; body: unknown; coverImageAlt: string | null }, built: { title: string; summary: string; body: unknown; coverImageAlt: string | null }): Promise<boolean> {
  const diff = diffOf(
    { title: english.title, summary: english.summary, body: english.body, coverImageAlt: english.coverImageAlt ?? "" },
    { title: built.title, summary: built.summary, body: built.body, coverImageAlt: built.coverImageAlt ?? "" },
  );
  const where = { articleId_locale: { articleId, locale } };
  if (!diff) {
    await db.articleTranslation.deleteMany({ where: { articleId, locale } });
    return false;
  }
  const data = {
    title: textOrNull(diff.title),
    summary: textOrNull(diff.summary),
    body: diff.body === undefined ? Prisma.DbNull : (diff.body as Prisma.InputJsonValue),
    coverImageAlt: textOrNull(diff.coverImageAlt),
  };
  await db.articleTranslation.upsert({ where, create: { articleId, locale, ...data }, update: data });
  return true;
}

export async function writeProjectTranslation(projectId: string, locale: Locale, english: { name: string; tagline: string | null; description: string | null; location: string | null }, built: { name: string; tagline: string | null; description: string | null; location: string | null }): Promise<boolean> {
  const diff = diffOf(
    { name: english.name, tagline: english.tagline ?? "", description: english.description ?? "", location: english.location ?? "" },
    { name: built.name, tagline: built.tagline ?? "", description: built.description ?? "", location: built.location ?? "" },
  );
  const where = { projectId_locale: { projectId, locale } };
  if (!diff) {
    await db.projectTranslation.deleteMany({ where: { projectId, locale } });
    return false;
  }
  const data = { name: textOrNull(diff.name), tagline: textOrNull(diff.tagline), description: textOrNull(diff.description), location: textOrNull(diff.location) };
  await db.projectTranslation.upsert({ where, create: { projectId, locale, ...data }, update: data });
  return true;
}

/// Stores a section's translation under its language in the section's own
/// `translations` column, leaving every other language there as it was. The
/// English row's own "last updated" time is kept: a translation is not a
/// change to the English section.
export async function writeModuleTranslation(moduleId: string, locale: Locale, english: { title: string; content: unknown }, built: { title: string; content: unknown }): Promise<boolean> {
  const diff = diffOf(english, built);
  const current = await db.projectModule.findUnique({ where: { id: moduleId }, select: { translations: true, updatedAt: true } });
  if (!current) return false;
  const translations: RecordValue = isRecord(current.translations) ? { ...current.translations } : {};
  if (diff) translations[locale] = diff;
  else delete translations[locale];
  await db.projectModule.update({
    where: { id: moduleId },
    data: {
      translations: Object.keys(translations).length ? (translations as Prisma.InputJsonValue) : Prisma.DbNull,
      updatedAt: current.updatedAt,
    },
  });
  return diff !== null;
}

// ── Which languages a piece of content is translated in (the AR / JA badges) ──

/// The languages each record ("home", "sxs", "news_listing", …) is translated in.
/// A read of the translation tables failed because the database has not had
/// prisma/add-translations.sql — a missing table or column, nothing else: a
/// connection problem is not remembered. Every later read returns at once, so
/// a page that only asks which languages it has (hreflang, the sitemap) is not
/// held up by it.
let translationTablesMissing = false;
function noteMissingTranslationTables(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2021" || code === "P2022") translationTablesMissing = true;
}

export async function settingTranslationLocales(keys: readonly string[]): Promise<Map<string, Locale[]>> {
  const found = new Map<string, Locale[]>();
  if (translationTablesMissing) return found;
  try {
    const rows = await db.siteSetting.findMany({ where: { key: { in: keys.flatMap((key) => prefixedLocales.map((locale) => translationSettingKey(key, locale))) } }, select: { key: true, value: true } });
    for (const row of rows) {
      if (!hasTranslation(row.value)) continue;
      const locale = prefixedLocales.find((candidate) => row.key.endsWith(`:${candidate}`));
      const key = locale ? row.key.slice(0, -(locale.length + 1)) : "";
      if (locale && keys.includes(key)) found.set(key, [...(found.get(key) ?? []), locale]);
    }
  } catch (error) {
    noteMissingTranslationTables(error);
  }
  return found;
}

export async function articleTranslationLocales(ids: readonly string[]): Promise<Map<string, Locale[]>> {
  const found = new Map<string, Locale[]>();
  if (translationTablesMissing) return found;
  try {
    const rows = await db.articleTranslation.findMany({ where: { articleId: { in: [...ids] } }, select: { articleId: true, locale: true, title: true, summary: true, body: true, coverImageAlt: true } });
    for (const row of rows) {
      if (!(prefixedLocales as readonly string[]).includes(row.locale)) continue;
      if (hasTranslation({ ...(row.title !== null ? { title: row.title } : {}), ...(row.summary !== null ? { summary: row.summary } : {}), ...(row.body !== null ? { body: row.body } : {}), ...(row.coverImageAlt !== null ? { coverImageAlt: row.coverImageAlt } : {}) })) {
        found.set(row.articleId, [...(found.get(row.articleId) ?? []), row.locale as Locale]);
      }
    }
  } catch (error) {
    noteMissingTranslationTables(error);
  }
  return found;
}

export async function pageTranslationLocales(ids: readonly string[]): Promise<Map<string, Locale[]>> {
  const found = new Map<string, Locale[]>();
  try {
    const rows = await db.pageTranslation.findMany({ where: { pageId: { in: [...ids] } }, select: { pageId: true, locale: true, title: true, content: true } });
    for (const row of rows) {
      if (!(prefixedLocales as readonly string[]).includes(row.locale)) continue;
      if (hasTranslation({ ...(row.title !== null ? { title: row.title } : {}), ...(row.content !== null ? { content: row.content } : {}) })) {
        found.set(row.pageId, [...(found.get(row.pageId) ?? []), row.locale as Locale]);
      }
    }
  } catch {}
  return found;
}

/// The same by slug, for the public side (hreflang, the sitemap), which knows
/// a page by its address. Never throws.
export async function pageTranslationLocalesBySlug(slugs: readonly string[]): Promise<Map<string, Locale[]>> {
  const found = new Map<string, Locale[]>();
  if (translationTablesMissing) return found;
  try {
    const rows = await db.pageTranslation.findMany({ where: { page: { slug: { in: [...slugs] } } }, select: { locale: true, title: true, content: true, page: { select: { slug: true } } } });
    for (const row of rows) {
      if (!(prefixedLocales as readonly string[]).includes(row.locale)) continue;
      if (hasTranslation({ ...(row.title !== null ? { title: row.title } : {}), ...(row.content !== null ? { content: row.content } : {}) })) {
        found.set(row.page.slug, [...(found.get(row.page.slug) ?? []), row.locale as Locale]);
      }
    }
  } catch (error) {
    noteMissingTranslationTables(error);
  }
  return found;
}

/// A development counts as translated in a language when its own text, one of
/// its sections, or its page labels are.
export async function projectTranslationLocales(ids: readonly string[]): Promise<Map<string, Locale[]>> {
  const found = new Map<string, Locale[]>();
  if (translationTablesMissing) return found;
  if (!ids.length) return found;
  const add = (id: string, locale: string) => {
    if (!(prefixedLocales as readonly string[]).includes(locale)) return;
    const found_ = found.get(id) ?? [];
    if (!found_.includes(locale as Locale)) found_.push(locale as Locale);
    found.set(id, found_);
  };
  try {
    const [rows, modules, chromeRows] = await Promise.all([
      db.projectTranslation.findMany({ where: { projectId: { in: [...ids] } }, select: { projectId: true, locale: true, name: true, tagline: true, description: true, location: true } }),
      db.projectModule.findMany({ where: { projectId: { in: [...ids] } }, select: { projectId: true, translations: true } }),
      db.siteSetting.findMany({ where: { key: { in: ids.flatMap((id) => prefixedLocales.map((locale) => translationSettingKey(projectChromeKey(id), locale))) } }, select: { key: true, value: true } }),
    ]);
    for (const own of rows) {
      if (hasTranslation({ ...(own.name !== null ? { name: own.name } : {}), ...(own.tagline !== null ? { tagline: own.tagline } : {}), ...(own.description !== null ? { description: own.description } : {}), ...(own.location !== null ? { location: own.location } : {}) })) add(own.projectId, own.locale);
    }
    for (const section of modules) {
      if (!isRecord(section.translations)) continue;
      for (const locale of prefixedLocales) {
        if (hasTranslation(section.translations[locale])) add(section.projectId, locale);
      }
    }
    for (const row of chromeRows) {
      if (!hasTranslation(row.value)) continue;
      const locale = prefixedLocales.find((candidate) => row.key.endsWith(`:${candidate}`));
      const id = locale ? row.key.slice("project-chrome:".length, -(locale.length + 1)) : "";
      if (locale && ids.includes(id)) add(id, locale);
    }
  } catch (error) {
    noteMissingTranslationTables(error);
  }
  return found;
}
