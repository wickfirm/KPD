import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DevelopmentView } from "@/components/public/development-view";
import { isFreshDraft, overlayDraftSection, sectionDraftKey } from "@/lib/section-preview";
import { parseProjectChrome, projectChromeKey } from "@/lib/project-chrome";
import { sharedModuleFields } from "@/lib/project-modules";
import { editorLocale, languageNames } from "@/lib/locales";
import { translationDraftKey } from "@/lib/translations/form-translation";
import { localizedProject, localizedSetting } from "@/lib/translations/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of a development in any state (Draft, Published or
/// Archived) rendered through the same view as the public page. With
/// ?lang=ar or ?lang=ja it shows the development's translation: the saved one,
/// or the unsaved section from that language's tab. /admin is guarded by the
/// session middleware; requireUser() re-verifies the account.
export default async function DevelopmentPreviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const lang = editorLocale(query.lang);
  const language = lang === "en" ? "" : `${languageNames[lang]} translation · `;
  const project = await db.project.findUnique({
    where: { slug },
    include: { modules: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: sharedModuleFields } },
  });
  if (!project) notFound();
  // "Preview with unsaved changes": swap in the section as it looks in the editor.
  let modules = project.modules;
  let draftNote = "";
  if (query.draft) {
    const row = await db.siteSetting.findUnique({ where: { key: translationDraftKey(sectionDraftKey(project.id), lang) } }).catch(() => null);
    if (row && isFreshDraft(row.value)) {
      const overlay = overlayDraftSection(project.modules, row.value);
      modules = overlay.modules as typeof project.modules;
      draftNote = `UNSAVED draft of “${row.value.title}” — not saved, not public · `;
    }
  }
  const state = project.status === "PUBLISHED" ? "Published" : project.status === "ARCHIVED" ? "Archived" : "Draft";
  const chromeRow = await db.siteSetting.findUnique({ where: { key: projectChromeKey(project.id) } }).catch(() => null);
  // A draft of a translation tab already holds the translated section; the
  // saved development takes its translation where it has one.
  const [shown, chrome] = await Promise.all([
    localizedProject({ ...project, modules }, lang),
    localizedSetting(projectChromeKey(project.id), parseProjectChrome(chromeRow?.value), lang),
  ]);
  return <div className="home-development-page single-project-page">
    <DevelopmentView project={{ ...shown, chrome }} previewNote={`${language}${draftNote}Admin preview · ${state} · ${shown.name} · visitors cannot see this URL`} />
  </div>;
}
