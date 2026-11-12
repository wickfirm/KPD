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

/// "Sections on this page": saves which blocks of one page are switched off.
/// Only that page's entry in the shared record changes; the page content itself
/// is never touched, so switching a block back on restores it as it was.
export async function saveSectionVisibility(formData: FormData) {
  const { session } = await requirePermission("content.editLive");
  const page = String(formData.get("page") || "");
  const returnTo = String(formData.get("returnTo") || "");
  const back = returnTo.startsWith("/admin/") && !returnTo.startsWith("//") ? returnTo : "/admin/pages";

  let sections: SectionDef[] | null = null;
  let label = page;
  let publicPath = "/";
  if (isFixedSectionPage(page)) {
    sections = pageSections[page];
    publicPath = page === "home" ? "/" : `/${page}`;
  } else if (page.startsWith("development:")) {
    const project = await db.project.findUnique({
      where: { id: page.slice("development:".length) },
      include: { modules: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
    if (project) {
      sections = developmentSections(project.modules, galleryLightDevelopments.has(project.slug));
      label = project.name;
      publicPath = `/developments/${project.slug}`;
    }
  }
  if (!sections) redirect(`${back}?error=${encodeURIComponent("That page cannot hide sections.")}`);

  const hidden = hiddenFromForm(formData, sections);
  const row = await db.siteSetting.findUnique({ where: { key: sectionVisibilityKey } });
  const all = parseHiddenSections(row?.value);
  if (hidden.length) all[page] = hidden;
  else delete all[page];
  await db.siteSetting.upsert({ where: { key: sectionVisibilityKey }, create: { key: sectionVisibilityKey, value: all }, update: { value: all } });

  revalidatePath(publicPath);
  revalidatePath(back);
  revalidatePublicContent();
  const names = sections.filter((section) => hidden.includes(section.id)).map((section) => section.label);
  await logActivity({
    action: "content.save",
    session,
    entityType: "SECTION_VISIBILITY",
    entityId: page,
    summary: names.length ? `Hid sections on ${label}: ${names.join(", ")}` : `Showed every section on ${label}`,
  });
  const notice = names.length ? `Saved. Hidden on the live page: ${names.join(", ")}.` : "Saved. Every section is shown on the live page.";
  redirect(`${back}?notice=${encodeURIComponent(notice)}`);
}
