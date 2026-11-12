"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePublicContent } from "@/lib/revalidate";
import { galleryLightDevelopments } from "@/lib/development-gallery-light";
import {
  developmentSectionPage,
  developmentSections,
  hiddenFromForm,
  isFixedSectionPage,
  pageSections,
  parseHiddenSections,
  sectionVisibilityKey,
  type SectionDef,
} from "@/lib/section-visibility";

type PageTarget = { sections: SectionDef[]; label: string; publicPath: string };

/// The sections a page offers, its name for the activity log and its public path.
async function pageTarget(page: string): Promise<PageTarget | null> {
  if (isFixedSectionPage(page)) return { sections: pageSections[page], label: page, publicPath: page === "home" ? "/" : `/${page}` };
  if (!page.startsWith("development:")) return null;
  const project = await db.project.findUnique({
    where: { id: page.slice("development:".length) },
    include: { modules: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!project) return null;
  return { sections: developmentSections(project.modules, galleryLightDevelopments.has(project.slug)), label: project.name, publicPath: `/developments/${project.slug}` };
}

function safeReturn(value: FormDataEntryValue | null) {
  const returnTo = String(value || "");
  return returnTo.startsWith("/admin/") && !returnTo.startsWith("//") ? returnTo : "/admin/pages";
}

/// Writes one page's hidden list into the shared record, logs it and returns
/// the confirmation shown after the redirect.
async function storeHidden(page: string, target: PageTarget, hidden: string[], back: string, session: Parameters<typeof logActivity>[0]["session"]) {
  const row = await db.siteSetting.findUnique({ where: { key: sectionVisibilityKey } });
  const all = parseHiddenSections(row?.value);
  if (hidden.length) all[page] = hidden;
  else delete all[page];
  await db.siteSetting.upsert({ where: { key: sectionVisibilityKey }, create: { key: sectionVisibilityKey, value: all }, update: { value: all } });
  revalidatePath(target.publicPath);
  revalidatePath(back.split("#")[0]);
  revalidatePublicContent();
  const names = target.sections.filter((section) => hidden.includes(section.id)).map((section) => section.label);
  await logActivity({
    action: "content.save",
    session,
    entityType: "SECTION_VISIBILITY",
    entityId: page,
    summary: names.length ? `Hid sections on ${target.label}: ${names.join(", ")}` : `Showed every section on ${target.label}`,
  });
  return names;
}

function withNotice(back: string, notice: string) {
  const [path, hash] = back.split("#");
  return `${path}?notice=${encodeURIComponent(notice)}${hash ? `#${hash}` : ""}`;
}

/// "Sections on this page": saves which blocks of one page are switched off.
/// Only that page's entry in the shared record changes; the page content itself
/// is never touched, so switching a block back on restores it as it was.
export async function saveSectionVisibility(formData: FormData) {
  const { session } = await requirePermission("content.editLive");
  const page = String(formData.get("page") || "");
  const back = safeReturn(formData.get("returnTo"));
  const target = await pageTarget(page);
  if (!target) redirect(withNotice(back, "That page cannot hide sections."));
  const names = await storeHidden(page, target, hiddenFromForm(formData, target.sections), back, session);
  redirect(withNotice(back, names.length ? `Saved. Hidden on the live page: ${names.join(", ")}.` : "Saved. Every section is shown on the live page."));
}

/// The Hide / Show button on a single section's own card.
export async function toggleSectionVisibility(formData: FormData) {
  const { session } = await requirePermission("content.editLive");
  const page = String(formData.get("page") || "");
  const id = String(formData.get("section") || "");
  const hide = formData.get("hide") === "1";
  const back = safeReturn(formData.get("returnTo"));
  const target = await pageTarget(page);
  const section = target?.sections.find((entry) => entry.id === id);
  if (!target || !section) redirect(withNotice(back, "That section cannot be hidden."));
  const current = (parseHiddenSections((await db.siteSetting.findUnique({ where: { key: sectionVisibilityKey } }))?.value)[page] ?? [])
    .filter((entry) => target.sections.some((known) => known.id === entry));
  const hidden = hide ? [...new Set([...current, id])] : current.filter((entry) => entry !== id);
  await storeHidden(page, target, hidden, back, session);
  redirect(withNotice(back, hide ? `“${section.label}” is now hidden on the live page. Its content is kept.` : `“${section.label}” is shown on the live page again.`));
}
