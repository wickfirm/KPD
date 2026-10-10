import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DevelopmentView } from "@/components/public/development-view";
import { isFreshDraft, overlayDraftSection, sectionDraftKey } from "@/lib/section-preview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of a development in any state (Draft, Published or
/// Archived) rendered through the same view as the public page. /admin is
/// guarded by the session middleware; requireUser() re-verifies the account.
export default async function DevelopmentPreviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const project = await db.project.findUnique({
    where: { slug },
    include: { modules: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!project) notFound();
  // "Preview with unsaved changes": swap in the section as it looks in the editor.
  let modules = project.modules;
  let draftNote = "";
  if (query.draft) {
    const row = await db.siteSetting.findUnique({ where: { key: sectionDraftKey(project.id) } }).catch(() => null);
    if (row && isFreshDraft(row.value)) {
      const overlay = overlayDraftSection(project.modules, row.value);
      modules = overlay.modules as typeof project.modules;
      draftNote = `UNSAVED draft of “${row.value.title}” — not saved, not public · `;
    }
  }
  const state = project.status === "PUBLISHED" ? "Published" : project.status === "ARCHIVED" ? "Archived" : "Draft";
  return <div className="home-development-page single-project-page">
    <DevelopmentView project={{ ...project, modules }} previewNote={`${draftNote}Admin preview · ${state} · ${project.name} · visitors cannot see this URL`} />
  </div>;
}
