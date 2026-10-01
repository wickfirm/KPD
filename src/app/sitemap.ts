import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

/// Dynamic sitemap: core routes plus every published article, development and
/// legal page. A database problem degrades to the static core routes instead
/// of a 500 — search engines must always receive a valid document.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const core: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/invest-in-dubai"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/news"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.6 },
  ];

  const legalSlugs = ["privacy-policy", "terms", "cookie-policy"];
  try {
    const [articles, projects, legalPages] = await Promise.all([
      db.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, publishedAt: true },
      }),
      db.project.findMany({
        where: { status: "PUBLISHED", profile: "FULL" },
        orderBy: { updatedAt: "desc" },
        select: { slug: true, updatedAt: true },
      }),
      db.staticPage.findMany({
        where: { slug: { in: legalSlugs }, status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
      url: absoluteUrl(`/news/${article.slug}`),
      lastModified: article.publishedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    const projectEntries: MetadataRoute.Sitemap = projects.map((project) => ({
      url: absoluteUrl(`/developments/${project.slug}`),
      lastModified: project.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
    const legalEntries: MetadataRoute.Sitemap = legalPages.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: page.updatedAt,
      changeFrequency: "yearly",
      priority: 0.2,
    }));

    return [...core, ...projectEntries, ...articleEntries, ...legalEntries];
  } catch {
    return core;
  }
}
