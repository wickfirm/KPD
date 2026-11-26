import { cache } from "react";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, developmentDescription, developmentTitle, pageMetadata, residenceJsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { DevelopmentView } from "@/components/public/development-view";
import { loadSeoOverride } from "@/lib/seo-store";
import { parseProjectChrome, projectChromeKey } from "@/lib/project-chrome";
import { sharedModuleFields } from "@/lib/project-modules";
import { applySeoOverride, seoKey } from "@/lib/seo-overrides";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { localizedProject, localizedSeo, localizedSetting } from "@/lib/translations/store";

export const dynamic = "force-dynamic";

/// One query per request, shared by generateMetadata and the page via cache().
/// The sections come without their translation column: English never reads it
/// (src/lib/project-modules.ts).
const getPublishedProject = cache(async (slug: string) => {
  return db.project.findFirst({
    where: { slug, status: "PUBLISHED", profile: "FULL" },
    include: { modules: { where: { profile: "FULL" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: sharedModuleFields } },
  });
});

/// Published developments are prerendered at deploy time; a database outage at
/// build falls back to on-demand rendering.
export async function generateStaticParams() {
  try {
    const rows = await db.project.findMany({
      where: { status: "PUBLISHED", profile: "FULL" },
      select: { slug: true },
    });
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug).catch(() => null);
  if (!project) return { title: "Development not found" };
  const locale = await getLocale();
  // In another language the name and the introduction are the development's translation.
  const shown = await localizedProject(project, locale);
  const seo = await localizedSeo(
    applySeoOverride({ title: developmentTitle(shown.name, shown.location), description: developmentDescription(shown) }, await loadSeoOverride(seoKey("project", project.id))),
    seoKey("project", project.id),
    locale,
  );
  return pageMetadata({
    ...seo,
    path: `/developments/${project.slug}`,
    image: project.heroImage,
  }, locale);
}

/// Unified delivered shell + React content rendered from the project row and
/// its CMS modules (shared with the admin draft preview).
export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const project = await getPublishedProject(slug);
  if (!project) notFound();
  const chromeRow = await db.siteSetting.findUnique({ where: { key: projectChromeKey(project.id) } }).catch(() => null);
  const [shown, chrome] = await Promise.all([
    localizedProject(project, locale),
    localizedSetting(projectChromeKey(project.id), parseProjectChrome(chromeRow?.value), locale),
  ]);
  return <>
    <JsonLd data={residenceJsonLd(shown, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: shown.name, path: `/developments/${project.slug}` }], locale)} />
    <DevelopmentView project={{ ...shown, chrome }} />
  </>;
}
