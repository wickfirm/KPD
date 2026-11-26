import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { getPublishedLocales } from "@/lib/locale";
import { DEFAULT_LOCALE, localeHref, type Locale } from "@/lib/locales";
import { articleTranslationLocales, pageTranslationLocalesBySlug, projectTranslationLocales, settingTranslationLocales } from "@/lib/translations/store";

/// Dynamic sitemap: core routes plus every published article, development and
/// legal page. A database problem degrades to the static core routes instead
/// of a 500 — search engines must always receive a valid document.
///
/// A page that has a translation in a published language is listed with its
/// hreflang alternates, followed by each of those languages' own addresses. A
/// page with none is listed exactly as before.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/// An entry with its alternates, then one entry for each language's own
/// address, all carrying the same alternates.
function withLanguages(entry: Entry, path: string, translated: readonly Locale[]): MetadataRoute.Sitemap {
  if (!translated.length) return [entry];
  const languages: Record<string, string> = { en: entry.url, "x-default": entry.url };
  for (const locale of translated) languages[locale] = absoluteUrl(localeHref(path, locale));
  const alternates = { languages };
  return [
    { ...entry, alternates },
    ...translated.map((locale) => ({ url: languages[locale], lastModified: entry.lastModified, changeFrequency: entry.changeFrequency, priority: entry.priority, alternates })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const core: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/invest-in-dubai"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/news"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/seven-x-seven"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/legacy"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.6 },
  ];
  const corePaths = ["/", "/invest-in-dubai", "/news", "/about", "/seven-x-seven", "/legacy", "/contact"];

  const legalSlugs = ["privacy-policy", "terms", "cookie-policy"];
  try {
    const [articles, projects, legalPages, published, pageLanguages, settingLanguages] = await Promise.all([
      db.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: { id: true, slug: true, publishedAt: true },
      }),
      db.project.findMany({
        where: { status: "PUBLISHED", profile: "FULL" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, slug: true, updatedAt: true },
      }),
      db.staticPage.findMany({
        where: { slug: { in: legalSlugs }, status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      getPublishedLocales(),
      // Each page's languages; only a published one is ever listed.
      pageTranslationLocalesBySlug(["invest-in-dubai", "about", "legacy", "contact", ...legalSlugs]),
      settingTranslationLocales(["home", "news_listing", "sxs"]),
    ]);
    const [articleFound, projectFound] = await Promise.all([articleTranslationLocales(articles.map((article) => article.id)), projectTranslationLocales(projects.map((project) => project.id))]);
    const languages = published.filter((locale) => locale !== DEFAULT_LOCALE);
    const of = (found: Locale[] | undefined) => languages.filter((locale) => found?.includes(locale));
    const list = (entry: Entry, path: string, found?: Locale[]) => withLanguages(entry, path, of(found));

    const coreNow: MetadataRoute.Sitemap = core.flatMap((entry, index) => {
      const path = corePaths[index];
      const found = path === "/" ? settingLanguages.get("home") : path === "/news" ? settingLanguages.get("news_listing") : path === "/seven-x-seven" ? settingLanguages.get("sxs") : pageLanguages.get(path.slice(1));
      return list(entry, path, found);
    });

    const articleEntries: MetadataRoute.Sitemap = articles.flatMap((article) => list({
      url: absoluteUrl(`/news/${article.slug}`),
      lastModified: article.publishedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    }, `/news/${article.slug}`, articleFound.get(article.id)));
    const projectEntries: MetadataRoute.Sitemap = projects.flatMap((project) => list({
      url: absoluteUrl(`/developments/${project.slug}`),
      lastModified: project.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    }, `/developments/${project.slug}`, projectFound.get(project.id)));
    const legalEntries: MetadataRoute.Sitemap = legalPages.flatMap((page) => list({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: page.updatedAt,
      changeFrequency: "yearly",
      priority: 0.2,
    }, `/${page.slug}`, pageLanguages.get(page.slug)));

    return [...coreNow, ...projectEntries, ...articleEntries, ...legalEntries];
  } catch {
    return core;
  }
}
