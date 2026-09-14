"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { legacyProjectTemplates } from "@/lib/legacy-project-templates";

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

export async function saveArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  await requireSession();

  const id = String(formData.get("id") || "");
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
      await db.article.update({ where: { id }, data });
    } else {
      await db.article.create({ data });
    }
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "Slug already exists." : msg };
  }

  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function deleteArticle(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  if (id) await db.article.delete({ where: { id } });
  revalidatePath("/admin/articles");
}

export async function reviewRssItem(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "");

  if (!id) return;

  if (decision === "REJECT") {
    await db.rssItem.update({
      where: { id },
      data: { status: "REJECTED", reviewedBy: session.email, reviewedAt: new Date() },
    });
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
  }

  revalidatePath("/admin/rss");
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

/// Create or update a development shell; its reusable content is managed as modules.
export async function saveProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireSession();

  const id = String(formData.get("id") || "");
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
    const project = id
      ? await db.project.update({ where: { id }, data })
      : await db.project.create({ data });
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${project.id}`);
    revalidatePath(`/developments/${project.slug}`);
    redirect(`/admin/projects/${project.id}`);
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "Slug already exists." : "Unable to save this development." };
  }
}

/// Add or update one ordered module on a development template.
export async function saveProjectModule(
  _prev: ProjectModuleFormState,
  formData: FormData,
): Promise<ProjectModuleFormState> {
  await requireSession();
  const id = String(formData.get("id") || "");
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
    const module = id
      ? await db.projectModule.update({ where: { id }, data })
      : await db.projectModule.create({ data: { ...data, projectId } });
    const project = await db.project.findUnique({ where: { id: module.projectId }, select: { slug: true } });
    revalidatePath(`/admin/projects/${projectId}`);
    if (project) revalidatePath(`/developments/${project.slug}`);
    redirect(`/admin/projects/${projectId}`);
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "A module with this slug already exists." : "Unable to save this module." };
  }
}

export async function deleteProjectModule(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!id || !projectId) return;
  const module = await db.projectModule.delete({ where: { id }, select: { project: { select: { slug: true } } } });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/developments/${module.project.slug}`);
}

/// Save a conventional editorial page. Page templates render these named
/// blocks; editors never need to hand-author the JSON representation.
export async function saveStaticPage(
  _prev: StaticPageFormState,
  formData: FormData,
): Promise<StaticPageFormState> {
  await requireSession();
  const id = String(formData.get("id") || "");
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
  const content = [
    ...(heading || intro || image || ctaLabel || ctaUrl ? [{ type: "hero", heading, text: intro, image, ctaLabel, ctaUrl }] : []),
    ...paragraphs.map((text) => ({ type: "paragraph", text })),
  ];

  try {
    const page = id
      ? await db.staticPage.update({ where: { id }, data: { slug, title, status, content } })
      : await db.staticPage.create({ data: { slug, title, status, content } });
    revalidatePath("/admin/pages");
    revalidatePath(`/admin/pages/${page.id}`);
    redirect(`/admin/pages/${page.id}`);
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "A page with this slug already exists." : "Unable to save this page." };
  }
}

export async function deleteStaticPage(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.staticPage.delete({ where: { id } });
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

/// Site-wide and homepage content is stored in two named settings records so
/// navigation, contact details, and homepage copy have one editorial source.
export async function saveSiteSettings(
  _prev: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  await requireSession();
  const global = {
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    whatsapp: String(formData.get("whatsapp") || "").trim(),
    newsletterNote: String(formData.get("newsletterNote") || "").trim(),
  };
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
    await db.$transaction([
      db.siteSetting.upsert({ where: { key: "global" }, update: { value: global }, create: { key: "global", value: global } }),
      db.siteSetting.upsert({ where: { key: "home" }, update: { value: home }, create: { key: "home", value: home } }),
    ]);
    revalidatePath("/");
    revalidatePath("/admin/settings");
    redirect("/admin/settings");
  } catch {
    return { error: "Unable to save site settings." };
  }
}

/// One-time bridge from the delivered static development pages into editable CMS modules.
export async function importLegacyProjectTemplate(formData: FormData) {
  await requireSession();
  const projectId = String(formData.get("projectId") || "");
  const slug = String(formData.get("slug") || "");
  const template = legacyProjectTemplates[slug];
  if (!projectId || !template) return;

  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { tagline: template.tagline, description: template.description },
    });
    for (const module of template.modules) {
      await tx.projectModule.upsert({
        where: { projectId_slug: { projectId, slug: module.slug } },
        update: { title: module.title, kind: module.kind, profile: "FULL", content: module.content as never, sortOrder: module.sortOrder },
        create: { projectId, ...module, profile: "FULL", content: module.content as never },
      });
    }
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/developments/${slug}`);
  redirect(`/admin/projects/${projectId}`);
}
