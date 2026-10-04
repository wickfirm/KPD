"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
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
      const existing = await db.article.findUnique({ where: { id }, select: { id: true } });
      if (!existing) {
        const created = await db.article.create({ data });
        return { id: created.id, label: created.title };
      }
      const updated = await db.article.update({ where: { id }, data });
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
function moduleContentFromForm(formData: FormData, kind: ReturnType<typeof moduleKind>) {
  const images = nonEmptyLines(formData.get("images"));
  const items = nonEmptyLines(formData.get("items")).map((line) => {
    const [label = "", value = "", image = "", url = ""] = line.split("|").map((part) => part.trim());
    if (kind === "FLOOR_PLAN") return { label, image, url };
    if (kind === "GALLERY") return { label };
    return { label, value, ...(image ? { image } : {}), ...(url ? { url } : {}) };
  }).filter((item) => Object.values(item).some(Boolean));

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
    publishedAt: status === "PUBLISHED" ? new Date() : null,
  };

  try {
    if (id) {
      const existing = await db.project.findUnique({ where: { id }, select: { id: true } });
      if (!existing) {
        const created = await db.project.create({ data });
        return { id: created.id, label: created.name };
      }
      const updated = await db.project.update({ where: { id }, data });
      return { id: updated.id, label: updated.name };
    }
    const created = await db.project.create({ data });
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
  redirect(`/admin/projects/${result.id}?saved=1`);
}

/// Shared module write path (editor form + version restore). Restoring a
/// module that was meanwhile deleted re-creates it inside its development.
async function applyProjectModule(id: string, formData: FormData): Promise<ApplyResult> {
  const projectId = String(formData.get("projectId") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || "") || title);
  if (!projectId || !title || !slug) return { error: "Module title is required." };

  const kind = moduleKind(formData.get("kind"));
  const content = moduleContentFromForm(formData, kind);

  const data = {
    slug,
    title,
    kind,
    profile: projectProfile(formData.get("profile")),
    content: content as never,
    sortOrder: Math.max(0, Number(formData.get("sortOrder") || 0) || 0),
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

/// Save a conventional editorial page. Page templates render these named
/// blocks; editors never need to hand-author the JSON representation.
/// Shared page write path (editor form + version restore). Registry pages and
/// hard-deleted rows are re-created on restore.
async function applyStaticPage(id: string, formData: FormData): Promise<ApplyResult> {
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || "") || title);
  const status = projectStatus(formData.get("status"));
  if (!title || !slug) return { error: "Page title is required." };

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
  const content = [
    ...(heading || intro || image || ctaLabel || ctaUrl ? [{ type: "hero", heading, text: intro, image, ctaLabel, ctaUrl }] : []),
    ...paragraphs.map((text) => ({ type: "paragraph", text })),
    ...(about ? [about] : []),
    ...(legacy ? [legacy] : []),
  ];

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

function revalidatePublicPage(slug: string) {
  if (slug === "about") revalidatePath("/about");
  if (slug === "legacy") revalidatePath("/legacy");
  if (slug === "invest-in-dubai") revalidatePath("/invest-in-dubai");
  if (slug === "contact") revalidatePath("/contact");
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
  const { session } = await requireUser();
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

/// Shared write path for the homepage content record.
async function applyHomeSettings(formData: FormData): Promise<ApplyResult> {
  const home = {
    heroVideo: String(formData.get("heroVideo") || "").trim(),
    introHeading: String(formData.get("introHeading") || "").trim(),
    introParagraphs: nonEmptyLines(formData.get("introParagraphs")),
    developmentHeading: String(formData.get("developmentHeading") || "").trim(),
    contactHeading: String(formData.get("contactHeading") || "").trim(),
    contactText: String(formData.get("contactText") || "").trim(),
    experienceImages: nonEmptyLines(formData.get("experienceImages")),
  };
  try {
    await db.siteSetting.upsert({ where: { key: "home" }, update: { value: home }, create: { key: "home", value: home } });
    return { label: "Homepage" };
  } catch {
    return { error: "Unable to save the homepage." };
  }
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
  const { session } = await requireUser();
  const versionId = String(formData.get("versionId") || "");
  const version = await db.contentVersion.findUnique({ where: { id: versionId } });
  if (!version) redirect("/admin");

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
