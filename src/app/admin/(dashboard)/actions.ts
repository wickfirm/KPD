"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePublicContent } from "@/lib/revalidate";
import {
  recordVersion,
  snapshotFormData,
  snapshotToFormData,
  type ContentVersionEntity,
  type VersionSnapshot,
} from "@/lib/versions";
import { legacyProjectTemplates } from "@/lib/legacy-project-templates";
import { ownershipCostPlannerDefaults, type OwnershipCostPlanner } from "@/lib/ownership-cost-planner";
import { sanitizeInvestContent } from "@/lib/invest-defaults";
import { findEditablePage } from "@/lib/editable-pages";
import { nextCopySlug, reorderIds, starterModules } from "@/lib/project-starter";
import { pairedGalleryContent, parseItemRow } from "@/lib/gallery-content";
import { sectionDraftKey, type SectionDraft } from "@/lib/section-preview";
import { articleDraftKey, type ArticleDraft } from "@/lib/article-preview";
import { pageDraftKey, paragraphBlocks, type PageDraft } from "@/lib/page-preview";
import { newSiteDraft, siteDraftKey } from "@/lib/site-preview";
import { moduleSectionId } from "@/lib/module-section-id";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseBody(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // accept plain text with blank lines between paragraphs
    parsed = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  }
  if (!Array.isArray(parsed)) throw new Error("Body must be a JSON array of paragraphs.");
  return parsed.map(String);
}

export type ArticleFormState = { error?: string };
export type ProjectFormState = { error?: string };
export type ProjectModuleFormState = { error?: string };
export type StaticPageFormState = { error?: string };
export type SiteSettingsFormState = { error?: string };
export type OwnershipCostPlannerFormState = { error?: string };

type ApplyResult = { error?: string; id?: string; projectId?: string; label?: string };

function isMissingRecord(error: unknown) {
  return (
    String((error as { code?: string }).code) === "P2025" ||
    String((error as Error).message).includes("Record to update not found")
  );
}

/// Editor URL for a versioned entity — where restores return the editor to.
function editorPathFor(entityType: string, entityId: string): string {
  switch (entityType) {
    case "ARTICLE": return `/admin/articles/${entityId}`;
    case "STATIC_PAGE": return `/admin/pages/${entityId}`;
    case "PROJECT": return `/admin/projects/${entityId}`;
    case "PROJECT_MODULE": return "/admin/projects";
    case "HOME_SETTINGS": return "/admin/pages/home";
    case "GLOBAL_SETTINGS": return "/admin/settings";
    case "CALCULATOR": return "/admin/calculator";
    default: return "/admin";
  }
}

/// Shared article write path, used by both the editor form and version restore.
/// If the record was hard-deleted, a restore re-creates it (recovery).
async function applyArticle(id: string, formData: FormData): Promise<ApplyResult> {
  const title = String(formData.get("title") || "").trim();
  const kind = formData.get("kind") === "BLOG" ? "BLOG" : "NEWS";
  const slug = slugify(String(formData.get("slug") || "") || title);
  const summary = String(formData.get("summary") || "").trim();
  const coverImage = String(formData.get("coverImage") || "").trim() || null;
  const coverImageAlt = String(formData.get("coverImageAlt") || "").trim() || null;
  const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(formData.get("status")))
    ? (String(formData.get("status")) as "DRAFT" | "PUBLISHED" | "ARCHIVED")
    : "DRAFT";

  if (!title || !summary) return { error: "Title and summary are required." };

  let body: string[];
  try {
    body = parseBody(String(formData.get("body") || "[]"));
  } catch (err) {
    return { error: (err as Error).message };
  }

  const data = {
    slug,
    kind: kind as "NEWS" | "BLOG",
    title,
    summary,
    body,
    coverImage,
    coverImageAlt,
    status,
    publishedAt: status === "PUBLISHED" ? new Date() : null,
  };

  try {
    if (id) {
      const existing = await db.article.findUnique({ where: { id }, select: { id: true, status: true, publishedAt: true } });
      if (!existing) {
        const created = await db.article.create({ data });
        return { id: created.id, label: created.title };
      }
      // Re-publishing keeps the original publish date — only a transition into
      // PUBLISHED (first publish, or publish after draft/archive) stamps a new one.
      const keepPublishedAt = status === "PUBLISHED" && existing.status === "PUBLISHED" && existing.publishedAt;
      const updated = await db.article.update({ where: { id }, data: keepPublishedAt ? { ...data, publishedAt: existing.publishedAt } : data });
      return { id: updated.id, label: updated.title };
    }
    const created = await db.article.create({ data });
    return { id: created.id, label: created.title };
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "Slug already exists." : msg };
  }
}

export async function saveArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const { session } = await requireUser();

  const id = String(formData.get("id") || "");
  const result = await applyArticle(id, formData);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this article." };

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${result.id}`);
  revalidatePublicContent();
  await recordVersion({
    entityType: "ARTICLE",
    entityId: result.id,
    path: `/admin/articles/${result.id}`,
    label: result.label || "Article",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.save", session, entityType: "ARTICLE", entityId: result.id, summary: `Saved article “${result.label}”` });
  redirect(`/admin/articles/${result.id}?saved=1`);
}

/// "Preview with unsaved changes" for an article: keeps it exactly as it
/// currently looks in the editor in a throw-away draft row (see
/// article-preview.ts). Nothing public changes and the article is not saved.
export async function previewArticleDraft(formData: FormData): Promise<{ error?: string; id?: string }> {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the article a title to preview it." };
  let body: string[];
  try { body = parseBody(String(formData.get("body") || "")); } catch (err) { return { error: (err as Error).message }; }
  const draft: ArticleDraft = {
    kind: formData.get("kind") === "BLOG" ? "BLOG" : "NEWS",
    slug: slugify(String(formData.get("slug") || "") || title),
    title,
    summary: String(formData.get("summary") || "").trim(),
    body,
    coverImage: String(formData.get("coverImage") || "").trim() || null,
    coverImageAlt: String(formData.get("coverImageAlt") || "").trim() || null,
    savedAt: Date.now(),
  };
  const key = articleDraftKey(id, session.email);
  await db.siteSetting.upsert({ where: { key }, create: { key, value: draft as never }, update: { value: draft as never } });
  return { id: id || "new" };
}

export async function deleteArticle(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const article = await db.article.delete({ where: { id } }).catch(() => null);
  if (article) {
    await db.contentVersion.deleteMany({ where: { entityType: "ARTICLE", entityId: id } });
    await logActivity({ action: "content.delete", session, entityType: "ARTICLE", entityId: id, summary: `Deleted article “${article.title}”` });
  }
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/articles");
  revalidatePublicContent();
}

export async function reviewRssItem(formData: FormData) {
  const session = (await requireUser()).session;
  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "");

  if (!id) return;

  if (decision === "REJECT") {
    await db.rssItem.update({
      where: { id },
      data: { status: "REJECTED", reviewedBy: session.email, reviewedAt: new Date() },
    });
    await logActivity({ action: "rss.reject", session, entityType: "RSS_ITEM", entityId: id, summary: `Rejected RSS item “${String(formData.get("title") || id)}”` });
  } else if (decision === "APPROVE") {
    const item = await db.rssItem.findUnique({ where: { id } });
    if (!item) return;
    await db.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          slug: `rss-${Date.now()}-${slugify(item.title).slice(0, 40)}`,
          kind: "NEWS",
          title: item.title,
          summary: (item.snippet || item.title).slice(0, 280),
          body: [item.snippet || item.title, `Source: ${item.url}`],
          coverImage: item.imageUrl,
          coverImageAlt: item.title,
          status: "PUBLISHED",
          publishedAt: new Date(),
          sourceRssItemId: item.id,
        },
      });
      await tx.rssItem.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: session.email,
          reviewedAt: new Date(),
        },
      });
    });
    await logActivity({ action: "rss.approve", session, entityType: "RSS_ITEM", entityId: id, summary: `Approved RSS item and published article “${item.title}”` });
  }

  revalidatePath("/admin/rss");
  revalidatePath("/news");
  revalidatePublicContent();
}

function projectStatus(value: FormDataEntryValue | null) {
  return ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(value))
    ? (String(value) as "DRAFT" | "PUBLISHED" | "ARCHIVED")
    : "DRAFT";
}

function projectProfile(value: FormDataEntryValue | null): "FULL" | "RESTRICTED" {
  return value === "RESTRICTED" ? "RESTRICTED" : "FULL";
}

function moduleKind(value: FormDataEntryValue | null) {
  const kinds = ["GALLERY", "FLOOR_PLAN", "SPECIFICATIONS", "LOCATION", "VIDEO", "BROCHURE", "CUSTOM"];
  return kinds.includes(String(value))
    ? (String(value) as "GALLERY" | "FLOOR_PLAN" | "SPECIFICATIONS" | "LOCATION" | "VIDEO" | "BROCHURE" | "CUSTOM")
    : "CUSTOM";
}

function nonEmptyLines(value: FormDataEntryValue | null) {
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

/// Converts editor-friendly rows into the stable JSON structure consumed by
/// the public development renderer. Rows use: Label | Value | Image URL | Link.
function moduleContentFromForm(formData: FormData) {
  // Galleries pair each caption with its image by position (see gallery-content.ts).
  const paired = formData.get("kind") === "GALLERY" ? pairedGalleryContent(String(formData.get("images") || ""), String(formData.get("items") || "")) : null;
  const images = paired ? paired.images : nonEmptyLines(formData.get("images"));
  const items = paired ? paired.items : nonEmptyLines(formData.get("items")).map(parseItemRow).filter((item) => Object.values(item).some(Boolean));

  const text = String(formData.get("text") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const mapUrl = String(formData.get("mapUrl") || "").trim();
  const presentation = formData.get("presentation") === "calm" ? "calm" : undefined;

  return {
    ...(text ? { text } : {}),
    ...(images.length ? { images } : {}),
    ...(items.length ? { items } : {}),
    ...(url ? { url } : {}),
    ...(mapUrl ? { mapUrl } : {}),
    ...(presentation ? { presentation } : {}),
  };
}

/// Shared development write path (editor form + version restore).
async function applyProject(id: string, formData: FormData): Promise<ApplyResult> {
  const name = String(formData.get("name") || "").trim();
  const slug = slugify(String(formData.get("slug") || "") || name);
  if (!name || !slug) return { error: "Development name is required." };

  const status = projectStatus(formData.get("status"));
  const data = {
    slug,
    name,
    tagline: String(formData.get("tagline") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    profile: projectProfile(formData.get("profile")),
    status,
    heroImage: String(formData.get("heroImage") || "").trim() || null,
    location: String(formData.get("location") || "").trim() || null,
    sortOrder: Math.max(0, Number(formData.get("sortOrder") || 0) || 0),
  };

  try {
    if (id) {
      const existing = await db.project.findUnique({ where: { id }, select: { id: true, status: true, publishedAt: true } });
      if (!existing) {
        const created = await db.project.create({ data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null } });
        return { id: created.id, label: created.name };
      }
      // Re-publishing keeps the original publish date — only a transition into
      // PUBLISHED (first publish, or publish after draft/archive) stamps a new one.
      const publishedAt = status === "PUBLISHED"
        ? (existing.status === "PUBLISHED" && existing.publishedAt ? existing.publishedAt : new Date())
        : null;
      const updated = await db.project.update({ where: { id }, data: { ...data, publishedAt } });
      return { id: updated.id, label: updated.name };
    }
    const created = await db.project.create({ data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null } });
    return { id: created.id, label: created.name };
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "Slug already exists." : "Unable to save this development." };
  }
}

/// Create or update a development shell; its reusable content is managed as modules.
export async function saveProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");

  const result = await applyProject(id, formData);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this development." };

  // A new development can start with the standard sections already in place.
  const startedWithSections = !id && formData.get("starter") === "on";
  if (startedWithSections) {
    await db.projectModule.createMany({ data: starterModules.map((module) => ({ projectId: result.id as string, slug: module.slug, title: module.title, kind: module.kind, profile: "FULL" as const, content: module.content as never, sortOrder: module.sortOrder })), skipDuplicates: true });
  }

  const publicSlug = slugify(String(formData.get("slug") || "") || String(formData.get("name") || ""));
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${result.id}`);
  revalidatePublicContent();
  if (publicSlug) revalidatePath(`/developments/${publicSlug}`);
  await recordVersion({
    entityType: "PROJECT",
    entityId: result.id,
    path: `/admin/projects/${result.id}`,
    label: result.label || "Development",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.save", session, entityType: "PROJECT", entityId: result.id, summary: `Saved development “${result.label}”` });
  redirect(startedWithSections ? `/admin/projects/${result.id}?notice=${encodeURIComponent("Development created with the standard sections. Fill them in, then publish when you are ready.")}` : `/admin/projects/${result.id}?saved=1`);
}

/// Shared module write path (editor form + version restore). Restoring a
/// module that was meanwhile deleted re-creates it inside its development.
async function applyProjectModule(id: string, formData: FormData): Promise<ApplyResult> {
  const projectId = String(formData.get("projectId") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || "") || title);
  if (!projectId || !title || !slug) return { error: "Module title is required." };

  const kind = moduleKind(formData.get("kind"));
  // Order is managed with the up/down buttons; a brand-new section goes to the end.
  let sortOrder = Math.max(0, Number(formData.get("sortOrder") || 0) || 0);
  if (!id && !sortOrder) {
    const last = await db.projectModule.findFirst({ where: { projectId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    sortOrder = (last?.sortOrder ?? 0) + 10;
  }
  const content = moduleContentFromForm(formData);

  const data = {
    slug,
    title,
    kind,
    profile: projectProfile(formData.get("profile")),
    content: content as never,
    sortOrder,
  };

  try {
    if (id) {
      const existing = await db.projectModule.findUnique({ where: { id }, select: { projectId: true } });
      if (!existing) {
        const created = await db.projectModule.create({ data: { ...data, projectId } });
        return { id: created.id, projectId, label: created.title };
      }
      const updated = await db.projectModule.update({ where: { id }, data });
      return { id, projectId: updated.projectId, label: updated.title };
    }
    const created = await db.projectModule.create({ data: { ...data, projectId } });
    return { id: created.id, projectId, label: created.title };
  } catch (err) {
    if (isMissingRecord(err)) {
      const created = await db.projectModule.create({ data: { ...data, projectId } }).catch(() => null);
      if (created) return { id: created.id, projectId, label: created.title };
    }
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "A module with this slug already exists." : "Unable to save this module." };
  }
}

/// Add or update one ordered module on a development template.
export async function saveProjectModule(
  _prev: ProjectModuleFormState,
  formData: FormData,
): Promise<ProjectModuleFormState> {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");

  const result = await applyProjectModule(id, formData);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this module." };

  const ownerProjectId = result.projectId ?? projectId;
  const project = await db.project.findUnique({ where: { id: ownerProjectId }, select: { slug: true } });
  revalidatePath(`/admin/projects/${ownerProjectId}`);
  revalidatePublicContent();
  if (project) revalidatePath(`/developments/${project.slug}`);
  await recordVersion({
    entityType: "PROJECT_MODULE",
    entityId: result.id,
    path: `/admin/projects/${ownerProjectId}`,
    label: result.label || "Content section",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.save", session, entityType: "PROJECT_MODULE", entityId: result.id, summary: `Saved section “${result.label}”` });
  redirect(`/admin/projects/${ownerProjectId}?saved=1`);
}

/// "Preview with unsaved changes": keeps the section exactly as it currently
/// looks in the editor in a throw-away draft row (see section-preview.ts) and
/// tells the editor where to open the admin preview. Nothing public changes
/// and nothing is saved to the section itself.
export async function previewSectionDraft(formData: FormData): Promise<{ error?: string; slug?: string; anchor?: string }> {
  await requireUser();
  const projectId = String(formData.get("projectId") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || "") || title);
  if (!projectId || !title || !slug) return { error: "Give the section a title to preview it." };
  const project = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  if (!project) return { error: "This development no longer exists." };
  const draft: SectionDraft = {
    id: String(formData.get("id") || ""),
    title,
    slug,
    kind: moduleKind(formData.get("kind")),
    content: moduleContentFromForm(formData),
    savedAt: Date.now(),
  };
  const key = sectionDraftKey(projectId);
  await db.siteSetting.upsert({ where: { key }, create: { key, value: draft as never }, update: { value: draft as never } });
  return { slug: project.slug, anchor: moduleSectionId(slug) };
}

export async function deleteProjectModule(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!id || !projectId) return;
  const module = await db.projectModule.delete({ where: { id }, select: { project: { select: { slug: true } }, title: true } }).catch(() => null);
  if (module) {
    await db.contentVersion.deleteMany({ where: { entityType: "PROJECT_MODULE", entityId: id } });
    await logActivity({ action: "content.delete", session, entityType: "PROJECT_MODULE", entityId: id, summary: `Deleted section “${module.title}”` });
    revalidatePath(`/developments/${module.project.slug}`);
  }
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePublicContent();
}

/// The stored content blocks for a managed page, built from the editor form.
/// Shared by the real save and the unsaved-changes preview so the two can
/// never disagree.
function buildStaticPageContent(slug: string, formData: FormData): { content: Record<string, unknown>[] } | { error: string } {
  const heading = String(formData.get("heading") || "").trim();
  const intro = String(formData.get("intro") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const ctaLabel = String(formData.get("ctaLabel") || "").trim();
  const ctaUrl = String(formData.get("ctaUrl") || "").trim();
  const paragraphs = nonEmptyLines(formData.get("paragraphs"));
  const legacyManagement = nonEmptyLines(formData.get("management")).map((line) => {
    const [name = "", role = "", bio = "", image = ""] = line.split("|").map((part) => part.trim());
    return { name, role, bio, image };
  }).filter((person) => person.name || person.role || person.bio || person.image);
  const managementNames = formData.getAll("managementName").map(String);
  const managementRoles = formData.getAll("managementRole").map(String);
  const managementBios = formData.getAll("managementBio").map(String);
  const managementImages = formData.getAll("managementImage").map(String);
  const management = managementNames.length
    ? managementNames.map((name, index) => ({
      name: name.trim(),
      role: (managementRoles[index] || "").trim(),
      bio: (managementBios[index] || "").trim(),
      image: (managementImages[index] || "").trim(),
    })).filter((person) => person.name || person.role || person.bio || person.image)
    : legacyManagement;
  // Timeline arrives as JSON from the milestone cards. Version snapshots saved
  // before the card editor store pipe-delimited lines instead — still accepted.
  const timelineJson = String(formData.get("legacyTimelineJson") || "").trim();
  let legacyTimeline: { year: string; title: string; summary: string; body: string; image: string }[];
  if (timelineJson) {
    try {
      const parsed: unknown = JSON.parse(timelineJson);
      if (!Array.isArray(parsed)) throw new Error("Timeline must be a list of milestones.");
      legacyTimeline = parsed.map((item) => {
        const milestone = (item ?? {}) as Record<string, unknown>;
        return {
          year: String(milestone.year ?? "").trim(),
          title: String(milestone.title ?? "").trim(),
          summary: String(milestone.summary ?? "").trim(),
          body: String(milestone.body ?? "").trim(),
          image: String(milestone.image ?? "").trim(),
        };
      });
    } catch {
      return { error: "The timeline could not be read. Please review the milestone cards and save again." };
    }
  } else {
    legacyTimeline = nonEmptyLines(formData.get("legacyTimeline")).map((line) => {
      const [year = "", title = "", summary = "", body = "", image = ""] = line.split("|").map((part) => part.trim());
      return { year, title, summary, body, image };
    });
  }
  legacyTimeline = legacyTimeline.filter((item) => item.year || item.title || item.summary || item.body || item.image);
  const about = slug === "about" ? {
    type: "about",
    mission: String(formData.get("mission") || "").trim(),
    vision: String(formData.get("vision") || "").trim(),
    chairmanText: String(formData.get("chairmanText") || "").trim(),
    chairmanName: String(formData.get("chairmanName") || "").trim(),
    chairmanRole: String(formData.get("chairmanRole") || "").trim(),
    chairmanImage: String(formData.get("chairmanImage") || "").trim(),
    management,
  } : null;
  const legacy = slug === "legacy" ? { type: "legacy", timeline: legacyTimeline } : null;
  // The investor-guide editor sends its structured sections as JSON.
  let invest: ({ type: "invest" } & ReturnType<typeof sanitizeInvestContent>) | null = null;
  if (slug === "invest-in-dubai" && String(formData.get("investJson") || "").trim()) {
    try {
      invest = { type: "invest", ...sanitizeInvestContent(JSON.parse(String(formData.get("investJson")))) };
    } catch {
      return { error: "The investor guide sections could not be read. Please review them and save again." };
    }
  }
  const content = [
    ...(heading || intro || image || ctaLabel || ctaUrl ? [{ type: "hero", heading, text: intro, image, ctaLabel, ctaUrl }] : []),
    ...paragraphBlocks(paragraphs),
    ...(about ? [about] : []),
    ...(legacy ? [legacy] : []),
    ...(invest ? [invest] : []),
  ];

  return { content };
}

/// Save a conventional editorial page. Page templates render these named
/// blocks; editors never need to hand-author the JSON representation.
/// Shared page write path (editor form + version restore). Registry pages and
/// hard-deleted rows are re-created on restore.
async function applyStaticPage(id: string, formData: FormData): Promise<ApplyResult> {
  const title = String(formData.get("title") || "").trim();
  let slug = slugify(String(formData.get("slug") || "") || title);
  if (id) {
    // The public URL of a fixed page (About, Legacy, Contact, Investor guide, the legal
    // pages) is defined by the site's routes: renaming its slug would orphan the row so
    // neither the editor nor the public page could find it again. Those pages keep their slug.
    const current = await db.staticPage.findUnique({ where: { id }, select: { slug: true } });
    if (current && findEditablePage(current.slug)) slug = current.slug;
  }
  const status = projectStatus(formData.get("status"));
  if (!title || !slug) return { error: "Page title is required." };

  const built = buildStaticPageContent(slug, formData);
  if ("error" in built) return { error: built.error };
  const content = built.content as never; // JSON column: blocks are built from sanitised form values

  try {
    if (id) {
      const existing = await db.staticPage.findUnique({ where: { id }, select: { id: true } });
      if (!existing) {
        const created = await db.staticPage.create({ data: { slug, title, status, content } });
        return { id: created.id, label: created.title };
      }
      const updated = await db.staticPage.update({ where: { id }, data: { slug, title, status, content } });
      return { id: updated.id, label: updated.title };
    }
    const created = await db.staticPage.create({ data: { slug, title, status, content } });
    return { id: created.id, label: created.title };
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "A page with this slug already exists." : "Unable to save this page." };
  }
}

const previewablePageSlugs = ["terms", "privacy-policy", "cookie-policy", "about", "legacy", "contact"];

/// "Preview with unsaved changes" for a managed page (legal pages, About, Legacy,
/// Contact): keeps the page exactly as
/// it currently looks in the editor in a throw-away draft row (see
/// page-preview.ts). Nothing public changes and the page is not saved.
export async function previewPageDraft(formData: FormData): Promise<{ error?: string; slug?: string }> {
  await requireUser();
  const slug = slugify(String(formData.get("slug") || ""));
  if (!previewablePageSlugs.includes(slug)) return { error: "This page cannot be previewed this way." };
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the page a title to preview it." };
  const built = buildStaticPageContent(slug, formData);
  if ("error" in built) return { error: built.error };
  const draft: PageDraft = { title, content: built.content, savedAt: Date.now() };
  const key = pageDraftKey(slug);
  await db.siteSetting.upsert({ where: { key }, create: { key, value: draft as never }, update: { value: draft as never } });
  return { slug };
}

function revalidatePublicPage(slug: string) {
  if (slug === "about") revalidatePath("/about");
  if (slug === "legacy") revalidatePath("/legacy");
  if (slug === "invest-in-dubai") revalidatePath("/invest-in-dubai");
  if (slug === "contact") revalidatePath("/contact");
  if (slug === "terms" || slug === "privacy-policy" || slug === "cookie-policy") revalidatePath(`/${slug}`);
}

export async function saveStaticPage(
  _prev: StaticPageFormState,
  formData: FormData,
): Promise<StaticPageFormState> {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const slug = slugify(String(formData.get("slug") || "") || String(formData.get("title") || ""));

  const result = await applyStaticPage(id, formData);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this page." };

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${result.id}`);
  revalidatePublicPage(slug);
  revalidatePublicContent();
  await recordVersion({
    entityType: "STATIC_PAGE",
    entityId: result.id,
    path: `/admin/pages/${result.id}`,
    label: result.label || "Page",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.save", session, entityType: "STATIC_PAGE", entityId: result.id, summary: `Saved page “${result.label}”` });
  redirect(`/admin/pages/${result.id}?saved=1`);
}

export async function deleteStaticPage(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const page = await db.staticPage.delete({ where: { id } }).catch(() => null);
  if (page) {
    await db.contentVersion.deleteMany({ where: { entityType: "STATIC_PAGE", entityId: id } });
    await logActivity({ action: "content.delete", session, entityType: "STATIC_PAGE", entityId: id, summary: `Deleted page “${page.title}”` });
    revalidatePublicPage(page.slug);
  }
  revalidatePath("/admin/pages");
  revalidatePublicContent();
  redirect("/admin/pages");
}

/// Shared write path for the site-wide contact details record.
async function applyGlobalSettings(formData: FormData): Promise<ApplyResult> {
  const global = {
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    whatsapp: String(formData.get("whatsapp") || "").trim(),
    newsletterNote: String(formData.get("newsletterNote") || "").trim(),
    facebook: String(formData.get("facebook") || "").trim(),
    x: String(formData.get("x") || "").trim(),
    instagram: String(formData.get("instagram") || "").trim(),
    youtube: String(formData.get("youtube") || "").trim(),
  };
  try {
    await db.siteSetting.upsert({ where: { key: "global" }, update: { value: global }, create: { key: "global", value: global } });
    return { label: "Site settings" };
  } catch {
    return { error: "Unable to save site settings." };
  }
}

/// Site-wide contact details live in one named settings record. Homepage
/// content has its own editor under Pages → Homepage (saveHomeSettings).
export async function saveGlobalSettings(
  _prev: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const { session } = await requireRole(["ADMIN"]);
  const result = await applyGlobalSettings(formData);
  if (result.error) return { error: result.error };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePublicContent();
  await recordVersion({
    entityType: "GLOBAL_SETTINGS",
    entityId: "global",
    path: "/admin/settings",
    label: "Site settings",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "settings.save", session, entityType: "GLOBAL_SETTINGS", entityId: "global", summary: "Saved site settings" });
  redirect("/admin/settings?saved=1");
}

/// A list serialised as JSON by a repeater editor (hidden field). Malformed or
/// non-list input yields an empty list, which the public page treats as "use
/// the delivered defaults".
function parseJsonList<T>(raw: FormDataEntryValue | null, map: (item: Record<string, unknown>) => T | null): T[] {
  try {
    const parsed: unknown = JSON.parse(String(raw || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => map((item && typeof item === "object" ? item : {}) as Record<string, unknown>)).filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}
const text = (value: unknown) => String(value ?? "").trim();

/// Shared write path for the homepage content record.
/// The homepage settings as the editor currently has them. Shared by the real
/// save and the unsaved-changes preview so the two can never disagree.
function homeSettingsFromForm(formData: FormData) {
  return {
    introStats: parseJsonList(formData.get("introStatsJson"), (item) => (text(item.value) || text(item.label) ? { value: text(item.value), label: text(item.label) } : null)),
    statsNote: String(formData.get("statsNote") ?? "").trim(),
    bannerSlides: parseJsonList(formData.get("bannerSlidesJson"), (item) => (text(item.image) ? { image: text(item.image), label: text(item.label) || "Development" } : null)),
    developmentCards: parseJsonList(formData.get("developmentCardsJson"), (item) => (text(item.title) || text(item.image) ? { href: text(item.href), image: text(item.image), title: text(item.title), copy: text(item.copy) } : null)),
    heroVideo: String(formData.get("heroVideo") || "").trim(),
    introHeading: String(formData.get("introHeading") || "").trim(),
    introParagraphs: nonEmptyLines(formData.get("introParagraphs")),
    developmentHeading: String(formData.get("developmentHeading") || "").trim(),
    contactHeading: String(formData.get("contactHeading") || "").trim(),
    contactText: String(formData.get("contactText") || "").trim(),
    experienceImages: nonEmptyLines(formData.get("experienceImages")),
  };
}

async function applyHomeSettings(formData: FormData): Promise<ApplyResult> {
  const home = homeSettingsFromForm(formData);
  try {
    await db.siteSetting.upsert({ where: { key: "home" }, update: { value: home }, create: { key: "home", value: home } });
    return { label: "Homepage" };
  } catch {
    return { error: "Unable to save the homepage." };
  }
}

/// "Preview with unsaved changes" for the homepage: keeps it exactly as it
/// currently looks in the editor in a throw-away draft row (see
/// site-preview.ts). Nothing public changes and nothing is saved.
export async function previewHomeDraft(formData: FormData): Promise<{ error?: string }> {
  const { session } = await requireUser();
  const key = siteDraftKey("home", session.email);
  const value = newSiteDraft(homeSettingsFromForm(formData));
  await db.siteSetting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } });
  return {};
}

/// Same for the investor guide: the hero block and the structured sections as
/// the editor currently has them (validated the way a real save validates them).
export async function previewInvestDraft(formData: FormData): Promise<{ error?: string }> {
  const { session } = await requireUser();
  let invest: ReturnType<typeof sanitizeInvestContent> | undefined;
  const raw = String(formData.get("investJson") || "").trim();
  if (raw) {
    try { invest = sanitizeInvestContent(JSON.parse(raw)); } catch { return { error: "The investor guide sections could not be read. Please review them and try again." }; }
  }
  const hero = { type: "hero", heading: String(formData.get("heading") || "").trim(), text: String(formData.get("intro") || "").trim(), image: String(formData.get("image") || "").trim() };
  const key = siteDraftKey("invest", session.email);
  const value = newSiteDraft({ hero, saved: invest ? { type: "invest", ...invest } : undefined });
  await db.siteSetting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } });
  return {};
}

/// Homepage content is stored in the "home" settings record and edited from
/// the Pages section, where editors expect to find page content.
export async function saveHomeSettings(
  _prev: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const { session } = await requireUser();
  const result = await applyHomeSettings(formData);
  if (result.error) return { error: result.error };
  revalidatePath("/");
  revalidatePath("/admin/pages/home");
  revalidatePublicContent();
  await recordVersion({
    entityType: "HOME_SETTINGS",
    entityId: "home",
    path: "/admin/pages/home",
    label: "Homepage",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.save", session, entityType: "HOME_SETTINGS", entityId: "home", summary: "Saved homepage content" });
  redirect("/admin/pages/home?saved=1");
}

/// Shared write path for the calculator assumptions record (form + restore).
async function applyCalculator(formData: FormData): Promise<ApplyResult> {
  const number = (name: string, fallback: number) => {
    const parsed = Number(formData.get(name));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  const slugs = formData.getAll("projectSlug").map(String);
  const prices = formData.getAll("startingPrice");
  const rates = formData.getAll("interestRate");
  const projects = ownershipCostPlannerDefaults.projects.map((fallback, projectIndex) => {
    const index = slugs.indexOf(fallback.slug);
    const rowCount = Math.max(0, Number(formData.get(`milestoneCount-${projectIndex}`)) || 0);
    const milestones: { label: string; percentage: number; date: string }[] = [];
    for (let row = 0; row < rowCount; row += 1) {
      const rawLabel = formData.get(`ml-${projectIndex}-${row}`);
      const rawPercentage = formData.get(`mp-${projectIndex}-${row}`);
      const rawDate = formData.get(`md-${projectIndex}-${row}`);
      // Silently drop rows the editor left completely blank.
      if (!String(rawLabel || "").trim() && !String(rawPercentage || "").trim() && !String(rawDate || "").trim()) continue;
      const percentage = Number(rawPercentage);
      if (String(rawLabel || "").trim() && Number.isFinite(percentage) && percentage >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(rawDate || "").trim())) {
        milestones.push({ label: String(rawLabel).trim(), percentage, date: String(rawDate).trim() });
      }
    }
    return {
      ...fallback,
      startingPrice: numberFrom(prices[index], fallback.startingPrice),
      interestRate: numberFrom(rates[index], fallback.interestRate),
      milestones,
    };
  });
  if (projects.some((project) => !project.milestones.length || Math.abs(project.milestones.reduce((total, milestone) => total + milestone.percentage, 0) - 100) > 0.01)) {
    return { error: "Every development needs at least one payment step with a label, percentage, and date, and the percentages must add up to 100%." };
  }
  const planner: OwnershipCostPlanner = {
    dldRate: number("dldRate", ownershipCostPlannerDefaults.dldRate), registrationFee: number("registrationFee", ownershipCostPlannerDefaults.registrationFee),
    mortgageRegistrationRate: number("mortgageRegistrationRate", ownershipCostPlannerDefaults.mortgageRegistrationRate), mortgageAdminFee: number("mortgageAdminFee", ownershipCostPlannerDefaults.mortgageAdminFee),
    bankArrangementRate: number("bankArrangementRate", ownershipCostPlannerDefaults.bankArrangementRate), vatRate: number("vatRate", ownershipCostPlannerDefaults.vatRate),
    ltv: { national: number("ltvNational", ownershipCostPlannerDefaults.ltv.national), resident: number("ltvResident", ownershipCostPlannerDefaults.ltv.resident), nonResident: number("ltvNonResident", ownershipCostPlannerDefaults.ltv.nonResident) },
    disclaimer: String(formData.get("disclaimer") || "").trim() || ownershipCostPlannerDefaults.disclaimer,
    projects,
  };
  try {
    await db.siteSetting.upsert({ where: { key: "ownership_cost_planner" }, update: { value: planner }, create: { key: "ownership_cost_planner", value: planner } });
    return { label: "Ownership Cost Planner" };
  } catch {
    return { error: "Unable to save calculator settings." };
  }
}

/// Stores editable calculator assumptions in a single named setting. Keeping
/// this JSON record makes fee/rate updates independent of a code deployment.
export async function saveOwnershipCostPlanner(
  _prev: OwnershipCostPlannerFormState,
  formData: FormData,
): Promise<OwnershipCostPlannerFormState> {
  const { session } = await requireUser();
  const result = await applyCalculator(formData);
  if (result.error) return { error: result.error };
  revalidatePath("/admin/calculator");
  revalidatePath("/api/calculator/kpd");
  await recordVersion({
    entityType: "CALCULATOR",
    entityId: "ownership_cost_planner",
    path: "/admin/calculator",
    label: "Ownership Cost Planner",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "settings.save", session, entityType: "CALCULATOR", entityId: "ownership_cost_planner", summary: "Saved calculator settings" });
  redirect("/admin/calculator?saved=1");
}

function numberFrom(value: FormDataEntryValue | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/// One-time bridge from the delivered static development pages into editable CMS modules.
export async function importLegacyProjectTemplate(formData: FormData) {
  const { session } = await requireUser();
  const projectId = String(formData.get("projectId") || "");
  const slug = String(formData.get("slug") || "");
  const template = legacyProjectTemplates[slug];
  if (!projectId || !template) return;

  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { tagline: template.tagline, description: template.description, heroImage: template.heroImage },
    });
    for (const module of template.modules) {
      await tx.projectModule.upsert({
        where: { projectId_slug: { projectId, slug: module.slug } },
        update: { title: module.title, kind: module.kind, profile: "FULL", content: module.content as never, sortOrder: module.sortOrder },
        create: { projectId, ...module, profile: "FULL", content: module.content as never },
      });
    }
  });

  await logActivity({ action: "content.import", session, entityType: "PROJECT", entityId: projectId, summary: `Imported the delivered page content (template: ${slug})` });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/developments/${slug}`);
  revalidatePublicContent();
  redirect(`/admin/projects/${projectId}?saved=1`);
}

// ── Version restore ──────────────────────────────────────────────────────────
// Replays a stored editor payload through the regular save path, so validation,
// revalidation and activity logging behave exactly like a manual save. The
// restore itself is recorded as a new version, which makes it undoable.

export async function restoreVersion(formData: FormData) {
  const { session, user } = await requireUser();
  const versionId = String(formData.get("versionId") || "");
  const version = await db.contentVersion.findUnique({ where: { id: versionId } });
  if (!version) redirect("/admin");
  // GLOBAL_SETTINGS snapshots carry site-wide settings — restoring them is
  // admin-only, exactly like the settings screen that produced them.
  if (version.entityType === "GLOBAL_SETTINGS" && user.role !== "ADMIN") {
    redirect(`${version.path || "/admin"}?denied=1`);
  }

  const payload = snapshotToFormData(version.snapshot);
  let result: ApplyResult;
  switch (version.entityType) {
    case "ARTICLE": result = await applyArticle(version.entityId, payload); break;
    case "STATIC_PAGE": result = await applyStaticPage(version.entityId, payload); break;
    case "PROJECT": result = await applyProject(version.entityId, payload); break;
    case "PROJECT_MODULE": result = await applyProjectModule(version.entityId, payload); break;
    case "HOME_SETTINGS": result = await applyHomeSettings(payload); break;
    case "GLOBAL_SETTINGS": result = await applyGlobalSettings(payload); break;
    case "CALCULATOR": result = await applyCalculator(payload); break;
    default: redirect(version.path || "/admin");
  }

  const returnPath = version.entityType === "PROJECT_MODULE"
    ? version.path
    : editorPathFor(version.entityType, result.id ?? version.entityId);
  if (result.error) redirect(`${returnPath}?error=${encodeURIComponent(result.error)}`);

  const entityId = result.id ?? version.entityId;
  await recordVersion({
    entityType: version.entityType as ContentVersionEntity,
    entityId,
    path: returnPath,
    label: `${version.label} — restored from v${version.versionNumber}`,
    snapshot: snapshotFormData(payload),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.restore", session, entityType: version.entityType, entityId, summary: `Restored “${version.label}” to version ${version.versionNumber}` });

  if (version.entityType === "ARTICLE" || version.entityType === "STATIC_PAGE") revalidatePath("/");
  if (version.entityType === "CALCULATOR") revalidatePath("/api/calculator/kpd");
  revalidatePath(returnPath);
  revalidatePublicContent();
  redirect(`${returnPath}?restored=1`);
}

/// Only ever send an editor back to the development screens.
function projectsReturnPath(value: FormDataEntryValue | null, fallback = "/admin/projects") {
  const path = String(value || "");
  return path.startsWith("/admin/projects") && !path.includes("//") ? path : fallback;
}

/// Quick status change from the Developments list or editor. Archiving (and
/// returning to Draft) removes the page from the public site immediately.
export async function setProjectStatus(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const status = projectStatus(formData.get("status"));
  const returnTo = projectsReturnPath(formData.get("returnTo"));
  const existing = id ? await db.project.findUnique({ where: { id }, select: { id: true, slug: true, name: true, status: true, publishedAt: true } }) : null;
  if (!existing) redirect(`/admin/projects?error=${encodeURIComponent("That development no longer exists.")}`);

  const publishedAt = status === "PUBLISHED" ? (existing.status === "PUBLISHED" && existing.publishedAt ? existing.publishedAt : new Date()) : null;
  await db.project.update({ where: { id }, data: { status, publishedAt } });
  revalidatePath(`/developments/${existing.slug}`);
  revalidatePath("/admin/projects");
  revalidatePublicContent();

  const verb = status === "PUBLISHED" ? "Published" : status === "ARCHIVED" ? "Archived" : "Moved to draft";
  await logActivity({ action: "content.save", session, entityType: "PROJECT", entityId: id, summary: `${verb} development \u201c${existing.name}\u201d` });
  const notice = status === "PUBLISHED" ? `\u201c${existing.name}\u201d is now published.`
    : status === "ARCHIVED" ? `\u201c${existing.name}\u201d was archived and removed from the public site. Use Restore to bring it back as a draft.`
    : `\u201c${existing.name}\u201d is a draft again and no longer public.`;
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}notice=${encodeURIComponent(notice)}`);
}

/// Copies a development (and all its sections) as a new draft.
export async function duplicateProject(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const source = id ? await db.project.findUnique({ where: { id }, include: { modules: true } }) : null;
  if (!source) redirect(`/admin/projects?error=${encodeURIComponent("That development no longer exists.")}`);

  const slugs = (await db.project.findMany({ select: { slug: true } })).map((row) => row.slug);
  const created = await db.project.create({
    data: {
      slug: nextCopySlug(source.slug, slugs),
      name: `${source.name} (copy)`,
      tagline: source.tagline,
      description: source.description,
      profile: source.profile,
      status: "DRAFT",
      heroImage: source.heroImage,
      location: source.location,
      sortOrder: source.sortOrder + 1,
      modules: { create: source.modules.map((module) => ({ slug: module.slug, title: module.title, kind: module.kind, profile: module.profile, content: module.content as never, sortOrder: module.sortOrder })) },
    },
  });
  revalidatePath("/admin/projects");
  await logActivity({ action: "content.save", session, entityType: "PROJECT", entityId: created.id, summary: `Duplicated development \u201c${source.name}\u201d` });
  redirect(`/admin/projects/${created.id}?notice=${encodeURIComponent("Copied as a draft. Rename it and change the page URL before publishing.")}`);
}

/// Moves a development one place up or down the order used on the site.
export async function moveProject(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const rows = await db.project.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true } });
  const order = reorderIds(rows.map((row) => row.id), id, direction);
  await db.$transaction(order.map((projectId, index) => db.project.update({ where: { id: projectId }, data: { sortOrder: index } })));
  revalidatePath("/admin/projects");
  revalidatePublicContent();
  redirect("/admin/projects");
}

/// Moves a content section one place up or down on its development page.
export async function moveProjectModule(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const rows = await db.projectModule.findMany({ where: { projectId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const order = reorderIds(rows.map((row) => row.id), id, direction);
  await db.$transaction(order.map((moduleId, index) => db.projectModule.update({ where: { id: moduleId }, data: { sortOrder: (index + 1) * 10 } })));
  const project = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  if (project) revalidatePath(`/developments/${project.slug}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePublicContent();
  redirect(`/admin/projects/${projectId}#section-${id}`);
}

/// Quick status change for an article from the News & Blog list. Publishing
/// stamps the publish date once; unpublishing/archiving removes it from the
/// public News page immediately.
export async function setArticleStatus(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const requested = String(formData.get("status") || "");
  const status = (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(requested) ? requested : "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  const article = id ? await db.article.findUnique({ where: { id }, select: { id: true, title: true, status: true, publishedAt: true } }) : null;
  if (!article) redirect(`/admin/articles?error=${encodeURIComponent("That article no longer exists.")}`);

  const publishedAt = status === "PUBLISHED" ? (article.status === "PUBLISHED" && article.publishedAt ? article.publishedAt : new Date()) : null;
  await db.article.update({ where: { id }, data: { status, publishedAt } });
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/articles");
  revalidatePublicContent();
  const verb = status === "PUBLISHED" ? "Published" : status === "ARCHIVED" ? "Archived" : "Moved to draft";
  await logActivity({ action: "content.save", session, entityType: "ARTICLE", entityId: id, summary: `${verb} article \u201c${article.title}\u201d` });
  const notice = status === "PUBLISHED" ? `\u201c${article.title}\u201d is now published.`
    : status === "ARCHIVED" ? `\u201c${article.title}\u201d was archived and removed from the News page.`
    : `\u201c${article.title}\u201d is a draft again and no longer public.`;
  redirect(`/admin/articles?notice=${encodeURIComponent(notice)}`);
}

/// Copies an article as a new draft (new slug, same content and cover).
export async function duplicateArticle(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");
  const source = id ? await db.article.findUnique({ where: { id } }) : null;
  if (!source) redirect(`/admin/articles?error=${encodeURIComponent("That article no longer exists.")}`);

  const slugs = (await db.article.findMany({ select: { slug: true } })).map((row) => row.slug);
  const created = await db.article.create({
    data: {
      slug: nextCopySlug(source.slug, slugs),
      kind: source.kind,
      title: `${source.title} (copy)`,
      summary: source.summary,
      body: source.body as never,
      coverImage: source.coverImage,
      coverImageAlt: source.coverImageAlt,
      status: "DRAFT",
      publishedAt: null,
    },
  });
  revalidatePath("/admin/articles");
  await logActivity({ action: "content.save", session, entityType: "ARTICLE", entityId: created.id, summary: `Duplicated article \u201c${source.title}\u201d` });
  redirect(`/admin/articles/${created.id}?notice=${encodeURIComponent("Copied as a draft. Edit the title and publish when it is ready.")}`);
}
