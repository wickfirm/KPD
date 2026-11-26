"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { allowedStatus, mayEditContent } from "@/lib/permissions";
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
import { generateArticleField, type ArticleAiField, type ArticleAiResult } from "@/lib/article-ai";
import { pageDraftKey, paragraphBlocks, type PageDraft } from "@/lib/page-preview";
import { applySxsSettings, applySxsTranslation } from "./seven-x-seven/actions";
import { newSiteDraft, siteDraftKey } from "@/lib/site-preview";
import { moduleSectionId } from "@/lib/module-section-id";
import { normalizeLineBreaks, preserveLineBreaks } from "@/lib/line-breaks";
import { textStyleFromForm } from "@/lib/text-style";
import { projectChromeKey, parseProjectChrome, developmentSlots, type ProjectChrome } from "@/lib/project-chrome";
import { sharedModuleFields } from "@/lib/project-modules";
import { applySeoOverride, fixedPageSeoDefaults, seoKey, seoOverrideFromForm } from "@/lib/seo-overrides";
import { deleteSeoOverride, loadSeoOverride, saveSeoOverride } from "@/lib/seo-store";
import { developmentDescription, developmentTitle, pageSeo, withBrand } from "@/lib/seo";
import { contactInquiryDefaults } from "@/lib/contact-inquiry-content";
import { detectLang, normalizePressItems, resolvePressItems, splitGoogleNewsTitle, type PressItem } from "@/lib/press-coverage";
import { DEFAULT_LOCALE, languageNames, type Locale } from "@/lib/locales";
import { localesSettingKey } from "@/lib/published-locales";
import { mergeGlobalSettings } from "@/lib/site-contact";
import { legalContact, legalDocuments, legalTabForSlug, type LegalDocument } from "@/lib/terms-defaults";
import { splitTranslationForm, translationDraftKey } from "@/lib/translations/form-translation";
import { alignToSaved } from "@/lib/translations/align-blocks";
import { legalDocumentFromForm, legalFormFields } from "@/lib/translations/legal-form";
import {
  LEGAL_TRANSLATION_BLOCKS,
  writeArticleTranslation,
  writeModuleTranslation,
  writePageTranslation,
  writeProjectTranslation,
  writeSettingTranslation,
} from "@/lib/translations/store";

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

/// The status of the development a section belongs to (looked up through the
/// section when it already exists). Used to keep Contributors to drafts.
async function owningProjectStatus(projectId: string, moduleId?: string) {
  const owner = moduleId ? (await db.projectModule.findUnique({ where: { id: moduleId }, select: { projectId: true } }))?.projectId ?? projectId : projectId;
  return (await db.project.findUnique({ where: { id: owner }, select: { status: true } }))?.status ?? null;
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
    case "SXS_PAGE": return "/admin/seven-x-seven";
    default: return "/admin";
  }
}

/// Stores the "Search appearance" boxes of an editor form (see seo-overrides.ts)
/// for the item just saved. Only items with a public page of their own have one.
async function saveSeoFor(entityType: string, entityId: string, formData: FormData): Promise<{ error?: string }> {
  let key: string | null = null;
  if (entityType === "ARTICLE") key = seoKey("article", entityId);
  else if (entityType === "PROJECT") key = seoKey("project", entityId);
  else if (entityType === "HOME_SETTINGS") key = seoKey("page", "home");
  else if (entityType === "STATIC_PAGE") {
    const slug = (await db.staticPage.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug;
    if (slug && fixedPageSeoDefaults(slug)) key = seoKey("page", slug);
  }
  if (!key) return {};
  try {
    await saveSeoOverride(key, seoOverrideFromForm(formData));
    return {};
  } catch {
    return { error: "The content was saved, but the search title and description could not be stored. Please save again." };
  }
}

/// Shared article write path, used by both the editor form and version restore.
/// If the record was hard-deleted, a restore re-creates it (recovery).
async function applyArticle(id: string, formData: FormData): Promise<ApplyResult> {
  const title = String(formData.get("title") || "").trim();
  const kind = formData.get("kind") === "BLOG" ? "BLOG" : "NEWS";
  const existingSlug = id ? await db.article.findUnique({ where: { id }, select: { slug: true } }) : null;
  const slug = existingSlug?.slug ?? slugify(title);
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
  const { session, user } = await requirePermission("content.write");

  const id = String(formData.get("id") || "");
  // Contributors only work on drafts: they cannot edit what is live and cannot publish.
  const current = id ? await db.article.findUnique({ where: { id }, select: { status: true } }) : null;
  if (!mayEditContent(user.role, current?.status)) return { error: "Only an Editor can change an article once it is published or archived." };
  formData.set("status", allowedStatus(user.role, String(formData.get("status") || "DRAFT")));
  // Nothing is filled in automatically: the editor types the summary or uses
  // "Generate with AI" under it.
  if (!String(formData.get("summary") || "").trim()) return { error: "Add a summary: type one, or press Generate with AI under the Summary field." };
  const result = await applyArticle(id, formData);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this article." };
  const seo = await saveSeoFor("ARTICLE", result.id, formData);

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
  if (seo.error) return seo;
  redirect(`/admin/articles/${result.id}?saved=1`);
}

/// "Generate with AI" next to an article's Title, Summary or Cover image alt
/// text. Writes a suggestion from the body as it is in the editor now; nothing
/// is saved, so the editor can regenerate and keep the version they like.
export async function generateArticleText(field: ArticleAiField, formData: FormData): Promise<ArticleAiResult> {
  await requirePermission("content.write");
  if (!["title", "summary", "alt"].includes(field)) return { error: "Unknown field." };
  let body: string[];
  try { body = parseBody(String(formData.get("body") || "")); } catch (err) { return { error: (err as Error).message }; }
  const current = field === "title" ? formData.get("title") : field === "summary" ? formData.get("summary") : formData.get("coverImageAlt");
  return generateArticleField(field, {
    title: String(formData.get("title") || ""),
    body,
    coverImage: String(formData.get("coverImage") || "").trim() || null,
    current: String(current || ""),
  });
}

/// "Preview with unsaved changes" for an article: keeps it exactly as it
/// currently looks in the editor in a throw-away draft row (see
/// article-preview.ts). Nothing public changes and the article is not saved.
export async function previewArticleDraft(formData: FormData): Promise<{ error?: string; id?: string }> {
  const { session } = await requirePermission("content.write");
  // An Arabic or Japanese tab previews its translation from its own row.
  const { locale, form } = splitTranslationForm(formData);
  const id = String(form.get("id") || "");
  const title = String(form.get("title") || "").trim();
  if (!title) return { error: "Give the article a title to preview it." };
  let body: string[];
  try { body = parseBody(String(form.get("body") || "")); } catch (err) { return { error: (err as Error).message }; }
  const saved = id ? await db.article.findUnique({ where: { id }, select: { slug: true } }) : null;
  const draft: ArticleDraft = {
    kind: form.get("kind") === "BLOG" ? "BLOG" : "NEWS",
    slug: saved?.slug ?? slugify(title),
    title,
    summary: String(form.get("summary") || "").trim(),
    body,
    coverImage: String(form.get("coverImage") || "").trim() || null,
    coverImageAlt: String(form.get("coverImageAlt") || "").trim() || null,
    savedAt: Date.now(),
  };
  const key = translationDraftKey(articleDraftKey(id, session.email), locale);
  await db.siteSetting.upsert({ where: { key }, create: { key, value: draft as never }, update: { value: draft as never } });
  return { id: id || "new" };
}

export async function deleteArticle(formData: FormData) {
  const { session } = await requirePermission("content.delete");
  const id = String(formData.get("id") || "");
  if (!id) return;
  const article = await db.article.delete({ where: { id } }).catch(() => null);
  if (article) {
    await db.contentVersion.deleteMany({ where: { entityType: "ARTICLE", entityId: id } });
    await deleteSeoOverride(seoKey("article", id));
    await logActivity({ action: "content.delete", session, entityType: "ARTICLE", entityId: id, summary: `Deleted article “${article.title}”` });
  }
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/articles");
  revalidatePublicContent();
}

export async function reviewRssItem(formData: FormData) {
  const session = (await requirePermission("rss.review")).session;
  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "");

  if (!id) return;

  if (decision === "REJECT") {
    await db.rssItem.update({
      where: { id },
      data: { status: "REJECTED", reviewedBy: session.email, reviewedAt: new Date() },
    });
    await logActivity({ action: "rss.reject", session, entityType: "RSS_ITEM", entityId: id, summary: `Rejected RSS item “${String(formData.get("title") || id)}”` });
  } else if (decision === "PRESS") {
    // Outside coverage: list it under "In the press" (Pages → News) with a
    // link to the publication instead of copying it into a KPD article.
    const item = await db.rssItem.findUnique({ where: { id } });
    if (!item) return;
    const { title, publication } = item.source === "google-news" ? splitGoogleNewsTitle(item.title) : { title: item.title, publication: "" };
    const entry: PressItem = {
      publication: publication || hostLabel(item.url),
      title,
      url: item.url,
      date: item.publishedAt ? item.publishedAt.toISOString().slice(0, 10) : "",
      lang: detectLang(title),
    };
    await db.$transaction(async (tx) => {
      const row = await tx.siteSetting.findUnique({ where: { key: "news_listing" } });
      const listing = (row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? row.value : {}) as Record<string, unknown>;
      const coverage = resolvePressItems(listing.coverage).filter((existing) => existing.url !== entry.url);
      const value = { ...listing, coverage: [entry, ...coverage] };
      await tx.siteSetting.upsert({ where: { key: "news_listing" }, update: { value }, create: { key: "news_listing", value } });
      await tx.rssItem.update({ where: { id }, data: { status: "APPROVED", reviewedBy: session.email, reviewedAt: new Date() } });
    });
    await logActivity({ action: "rss.approve", session, entityType: "RSS_ITEM", entityId: id, summary: `Added “${title}” to In the press` });
    revalidatePath("/rss.xml");
    revalidatePath("/admin/pages/news");
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

/// "www.zawya.com" → "zawya.com", for coverage whose publication is unknown.
function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
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
  // Section caption: stored whenever the editor sends it, so an emptied field hides it.
  const eyebrow = formData.has("eyebrow") ? String(formData.get("eyebrow") ?? "").trim() : undefined;
  const url = String(formData.get("url") || "").trim();
  const ctaLabel = String(formData.get("ctaLabel") || "").trim();
  const ctaVisible = formData.get("ctaVisible") === "on";
  const mapUrl = String(formData.get("mapUrl") || "").trim();
  const presentation = formData.get("presentation") === "calm" ? "calm" : undefined;
  const style = (prefix: string) => textStyleFromForm(formData, prefix);
  const titleStyle = style("title");
  const bodyTextStyle = style("text");

  return {
    ...(eyebrow !== undefined ? { eyebrow } : {}),
    ...(text ? { text } : {}),
    // Stored even when empty: an explicit empty list means the editor removed
    // every image, which the delivered-figure renderer must honour instead of
    // falling back to the delivered slides.
    ...(images.length ? { images } : { images: [] }),
    ...(items.length ? { items } : {}),
    ...(url ? { url } : {}),
    ...(ctaLabel ? { ctaLabel } : {}),
    // Stored faithfully: the payment-plan section only shows its button when
    // ctaVisible is explicitly true (feedback item 11), so a ticked box used to
    // vanish here and the button could never appear.
    ...(ctaVisible ? { ctaVisible: true } : { ctaVisible: false }),
    ...(mapUrl ? { mapUrl } : {}),
    ...(presentation ? { presentation } : {}),
    ...(titleStyle ? { titleStyle } : {}),
    ...(bodyTextStyle ? { textStyle: bodyTextStyle } : {}),
  };
}

/// The development's own text as the editor's form has it. Shared by the real
/// save and the translation tabs so the two cannot disagree.
function projectTextFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    tagline: normalizeLineBreaks(formData.get("tagline") as string | null) || null,
    description: String(formData.get("description") || "").trim() || null,
    location: String(formData.get("location") || "").trim() || null,
  };
}

/// Shared development write path (editor form + version restore).
async function applyProject(id: string, formData: FormData): Promise<ApplyResult> {
  const text = projectTextFromForm(formData);
  const name = text.name;
  const currentSlug = id ? await db.project.findUnique({ where: { id }, select: { slug: true } }) : null;
  const slug = currentSlug?.slug ?? slugify(name);
  if (!name || !slug) return { error: "Development name is required." };

  const status = projectStatus(formData.get("status"));
  const data = {
    slug,
    ...text,
    profile: projectProfile(formData.get("profile")),
    status,
    heroImage: String(formData.get("heroImage") || "").trim() || null,
    heroVideo: String(formData.get("heroVideo") || "").trim() || null,
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

/// A development's page labels and buttons as the editor's form has them,
/// starting from what was saved for the fields this form does not show. Shared
/// by the real save and the translation tabs so the two cannot disagree.
function projectChromeFromForm(formData: FormData, previousChrome: ProjectChrome): ProjectChrome {
  return parseProjectChrome({
    ctaLabel: String(formData.get("heroCtaLabel") || "").trim(),
    ctaUrl: String(formData.get("heroCtaUrl") || "").trim(),
    ctaVisible: formData.get("heroCtaVisible") === "on",
    brochureLabel: String(formData.get("brochureLabel") || "").trim(),
    brochureUrl: String(formData.get("brochureUrl") || "").trim(),
    brochureVisible: formData.get("brochureVisible") === "on",
    bookLabel: formData.has("bookLabel") ? String(formData.get("bookLabel") || "").trim() : previousChrome.bookLabel,
    bookUrl: formData.has("bookUrl") ? String(formData.get("bookUrl") || "").trim() : previousChrome.bookUrl,
    enquireVisible: formData.get("enquireVisible") === "on",
    enquireEyebrow: String(formData.get("enquireEyebrow") || "").trim(),
    enquireHeading: String(formData.get("enquireHeading") || "").trim(),
    enquireText: String(formData.get("enquireText") || "").trim(),
    enquireImage: String(formData.get("enquireImage") || "").trim(),
    overviewLogo: formData.has("overviewLogo") ? String(formData.get("overviewLogo") || "").trim() : previousChrome.overviewLogo,
    enquirePrimaryLabel: String(formData.get("enquirePrimaryLabel") || "").trim(),
    enquirePrimaryUrl: String(formData.get("enquirePrimaryUrl") || "").trim(),
    enquireSecondaryLabel: String(formData.get("enquireSecondaryLabel") || "").trim(),
    enquireSecondaryUrl: String(formData.get("enquireSecondaryUrl") || "").trim(),
    showOnHomepage: formData.get("showOnHomepage") === "on",
    keyFacts: formData.has("keyFacts") ? String(formData.get("keyFacts") || "") : previousChrome.keyFacts,
    calculatorIndex: previousChrome.calculatorIndex,
    nameStyle: textStyleFromForm(formData, "projectName"),
    taglineStyle: textStyleFromForm(formData, "projectTagline"),
    descriptionStyle: textStyleFromForm(formData, "projectDescription"),
    // Gallery-light page labels: only on the forms that show them; others keep what was saved.
    // The introduction caption is no longer shown or edited; keep what was saved.
    labels: formData.has("labelDriveNote") ? {
      ...(previousChrome.labels?.overview !== undefined ? { overview: previousChrome.labels.overview } : {}),
      driveNote: String(formData.get("labelDriveNote") ?? ""),
      calculator: String(formData.get("labelCalculator") ?? ""),
      subnavCta: String(formData.get("labelSubnavCta") ?? ""),
    } : previousChrome.labels,

  });
}

/// Create or update a development shell; its reusable content is managed as modules.
export async function saveProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { session, user } = await requirePermission("content.write");
  const id = String(formData.get("id") || "");
  const current = id ? await db.project.findUnique({ where: { id }, select: { status: true } }) : null;
  if (!mayEditContent(user.role, current?.status)) return { error: "Only an Editor can change a development once it is published or archived." };
  formData.set("status", allowedStatus(user.role, String(formData.get("status") || "DRAFT")));

  const result = await applyProject(id, formData);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this development." };
  const previousChrome = parseProjectChrome((await db.siteSetting.findUnique({ where: { key: projectChromeKey(result.id) } }).catch(() => null))?.value);
  const chrome = projectChromeFromForm(formData, previousChrome);
  const chromeKey = projectChromeKey(result.id);
  await db.siteSetting.upsert({ where: { key: chromeKey }, update: { value: chrome }, create: { key: chromeKey, value: chrome } });
  const seo = await saveSeoFor("PROJECT", result.id, formData);

  // A new development can start with the standard sections already in place.
  const startedWithSections = !id && formData.get("starter") === "on";
  if (startedWithSections) {
    await db.projectModule.createMany({ data: starterModules.map((module) => ({ projectId: result.id as string, slug: module.slug, title: module.title, kind: module.kind, profile: "FULL" as const, content: module.content as never, sortOrder: module.sortOrder })), skipDuplicates: true });
  }

  const savedProject = await db.project.findUnique({ where: { id: result.id }, select: { slug: true } });
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${result.id}`);
  revalidatePublicContent();
  if (savedProject) revalidatePath(`/developments/${savedProject.slug}`);
  await recordVersion({
    entityType: "PROJECT",
    entityId: result.id,
    path: `/admin/projects/${result.id}`,
    label: result.label || "Development",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.save", session, entityType: "PROJECT", entityId: result.id, summary: `Saved development “${result.label}”` });
  if (seo.error) return seo;
  redirect(startedWithSections ? `/admin/projects/${result.id}?notice=${encodeURIComponent("Development created with the standard sections. Fill them in, then publish when you are ready.")}` : `/admin/projects/${result.id}?saved=1`);
}

/// Shared module write path (editor form + version restore). Restoring a
/// module that was meanwhile deleted re-creates it inside its development.
async function applyProjectModule(id: string, formData: FormData): Promise<ApplyResult> {
  const projectId = String(formData.get("projectId") || "");
  const title = normalizeLineBreaks(formData.get("title") as string | null);
  const existingSlug = id ? await db.projectModule.findUnique({ where: { id }, select: { slug: true } }) : null;
  const slug = existingSlug?.slug ?? slugify(title);
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
  const { session, user } = await requirePermission("content.write");
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!mayEditContent(user.role, await owningProjectStatus(projectId, id))) return { error: "Only an Editor can change a development once it is published or archived." };

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
  await requirePermission("content.write");
  // An Arabic or Japanese tab previews its translation from its own row.
  const { locale, form } = splitTranslationForm(formData);
  const projectId = String(form.get("projectId") || "");
  const title = normalizeLineBreaks(form.get("title") as string | null);
  const existing = form.get("id") ? await db.projectModule.findUnique({ where: { id: String(form.get("id")) }, select: { slug: true } }) : null;
  const slug = existing?.slug ?? slugify(title);
  if (!projectId || !title || !slug) return { error: "Give the section a title to preview it." };
  const project = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  if (!project) return { error: "This development no longer exists." };
  const draft: SectionDraft = {
    id: String(form.get("id") || ""),
    title,
    slug,
    kind: moduleKind(form.get("kind")),
    content: moduleContentFromForm(form),
    savedAt: Date.now(),
  };
  const key = translationDraftKey(sectionDraftKey(projectId), locale);
  await db.siteSetting.upsert({ where: { key }, create: { key, value: draft as never }, update: { value: draft as never } });
  return { slug: project.slug, anchor: moduleSectionId(slug) };
}

export async function deleteProjectModule(formData: FormData) {
  const { session, user } = await requirePermission("content.write");
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!id || !projectId) return;
  if (!mayEditContent(user.role, await owningProjectStatus(projectId, id))) redirect("/admin?denied=1");
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
  const heading = normalizeLineBreaks(formData.get("heading") as string | null);
  const intro = String(formData.get("intro") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const eyebrow = String(formData.get("eyebrow") || "").trim();
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
    sectionHeading: normalizeLineBreaks(formData.get("aboutSectionHeading") as string | null),
    sectionHeadingStyle: textStyleFromForm(formData, "aboutSectionHeading"),
    storyImage: String(formData.get("aboutStoryImage") || "").trim(),
    storyStyle: textStyleFromForm(formData, "aboutStory"),
    missionVisionStyle: textStyleFromForm(formData, "aboutMissionVision"),
    chairmanStyle: textStyleFromForm(formData, "aboutChairman"),
    mission: String(formData.get("mission") || "").trim(),
    vision: String(formData.get("vision") || "").trim(),
    chairmanText: String(formData.get("chairmanText") || "").trim(),
    chairmanName: String(formData.get("chairmanName") || "").trim(),
    chairmanRole: String(formData.get("chairmanRole") || "").trim(),
    chairmanImage: String(formData.get("chairmanImage") || "").trim(),
    ceoText: String(formData.get("ceoText") || "").trim(),
    ceoName: String(formData.get("ceoName") || "").trim(),
    ceoRole: String(formData.get("ceoRole") || "").trim(),
    ceoImage: String(formData.get("ceoImage") || "").trim(),
    management,
    // Gallery-light (Option 2.1) fields: an empty value hides that element.
    heroCtaLabel: String(formData.get("aboutHeroCtaLabel") ?? "").trim(),
    heroCtaUrl: String(formData.get("aboutHeroCtaUrl") ?? "").trim(),
    heroSecondaryLabel: String(formData.get("aboutHeroSecondaryLabel") ?? "").trim(),
    heroSecondaryUrl: String(formData.get("aboutHeroSecondaryUrl") ?? "").trim(),
    keyFacts: nonEmptyLines(formData.get("aboutKeyFacts")).map((line) => {
      const [label = "", ...value] = line.split("|");
      return { label: label.trim(), value: value.join("|").trim() };
    }).filter((fact) => fact.label || fact.value),
    philosophyKicker: String(formData.get("aboutPhilosophyKicker") ?? "").trim(),
    valueCaps: String(formData.get("aboutValueCaps") ?? "").replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()),
    missionKicker: String(formData.get("aboutMissionKicker") ?? "").trim(),
    visionKicker: String(formData.get("aboutVisionKicker") ?? "").trim(),
    leadershipKicker: String(formData.get("aboutLeadershipKicker") ?? "").trim(),
    leadershipHeading: normalizeLineBreaks(formData.get("aboutLeadershipHeading") as string | null),
    teamKicker: String(formData.get("aboutTeamKicker") ?? "").trim(),
    teamHeading: normalizeLineBreaks(formData.get("aboutTeamHeading") as string | null),
    visitKicker: String(formData.get("aboutVisitKicker") ?? "").trim(),
    visitHeading: normalizeLineBreaks(formData.get("aboutVisitHeading") as string | null),
    visitText: String(formData.get("aboutVisitText") ?? "").trim(),
    visitImage: String(formData.get("aboutVisitImage") ?? "").trim(),
    visitCtaLabel: String(formData.get("aboutVisitCtaLabel") ?? "").trim(),
    visitLinkLabel: String(formData.get("aboutVisitLinkLabel") ?? "").trim(),
    visitLinkUrl: String(formData.get("aboutVisitLinkUrl") ?? "").trim(),
  } : null;
  const legacy = slug === "legacy" ? {
    type: "legacy", timeline: legacyTimeline, ctaLabel: String(formData.get("legacyCtaLabel") || "").trim(), ctaUrl: String(formData.get("legacyCtaUrl") || "").trim(), ctaVisible: formData.get("legacyCtaVisible") === "on",
    // Gallery-light (Option 2.1) fields: an empty value hides that element.
    lede: normalizeLineBreaks(formData.get("legacyLede") as string | null),
    mapLabel: String(formData.get("legacyMapLabel") ?? "").trim(),
    ...(formData.has("legacyStartLabel") ? { startLabel: String(formData.get("legacyStartLabel") ?? "").trim() } : {}),
    nameKicker: String(formData.get("legacyNameKicker") ?? "").trim(),
    nameHeading: normalizeLineBreaks(formData.get("legacyNameHeading") as string | null),
    nameText: String(formData.get("legacyNameText") ?? "").replace(/\r\n/g, "\n").trim(),
    bandKicker: String(formData.get("legacyBandKicker") ?? "").trim(),
    bandHeading: normalizeLineBreaks(formData.get("legacyBandHeading") as string | null),
    bandText: String(formData.get("legacyBandText") ?? "").trim(),
    bandImage: String(formData.get("legacyBandImage") ?? "").trim(),
    bandLinkLabel: String(formData.get("legacyBandLinkLabel") ?? "").trim(),
    bandLinkUrl: String(formData.get("legacyBandLinkUrl") ?? "").trim(),
  } : null;
  const contactForm = slug === "contact" ? {
    type: "contact-form",
    salesLabel: String(formData.get("contactSalesLabel") || "").trim() || contactInquiryDefaults.salesLabel,
    customerLabel: String(formData.get("contactCustomerLabel") || "").trim() || contactInquiryDefaults.customerLabel,
    channelLabel: String(formData.get("contactChannelLabel") || "").trim() || contactInquiryDefaults.channelLabel,
    jobLabel: String(formData.get("contactJobLabel") || "").trim() || contactInquiryDefaults.jobLabel,
    pressLabel: String(formData.get("contactPressLabel") || "").trim() || contactInquiryDefaults.pressLabel,
    salesProjects: nonEmptyLines(formData.get("contactSalesProjects")).length ? nonEmptyLines(formData.get("contactSalesProjects")) : contactInquiryDefaults.salesProjects,
    customerProjects: nonEmptyLines(formData.get("contactCustomerProjects")).length ? nonEmptyLines(formData.get("contactCustomerProjects")) : contactInquiryDefaults.customerProjects,
    customerNatures: nonEmptyLines(formData.get("contactCustomerNatures")).length ? nonEmptyLines(formData.get("contactCustomerNatures")) : contactInquiryDefaults.customerNatures,
    salesMessagePrompt: String(formData.get("contactSalesMessagePrompt") || "").trim() || contactInquiryDefaults.salesMessagePrompt,
    customerMessagePrompt: String(formData.get("contactCustomerMessagePrompt") || "").trim() || contactInquiryDefaults.customerMessagePrompt,
    channelMessagePrompt: String(formData.get("contactChannelMessagePrompt") || "").trim() || contactInquiryDefaults.channelMessagePrompt,
    jobMessagePrompt: String(formData.get("contactJobMessagePrompt") || "").trim() || contactInquiryDefaults.jobMessagePrompt,
    pressMessagePrompt: String(formData.get("contactPressMessagePrompt") || "").trim() || contactInquiryDefaults.pressMessagePrompt,
    formHeading: String(formData.get("contactFormHeading") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.formHeading,
    submitLabel: String(formData.get("contactSubmitLabel") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.submitLabel,
    addressLabel: String(formData.get("contactAddressLabel") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.addressLabel,
    address: String(formData.get("contactAddress") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.address,
    directionsLabel: String(formData.get("contactDirectionsLabel") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.directionsLabel,
    directionsUrl: String(formData.get("contactDirectionsUrl") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.directionsUrl,
    callLabel: String(formData.get("contactCallLabel") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.callLabel,
    quickCallLabel: String(formData.get("contactQuickCallLabel") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.quickCallLabel,
    quickEmailLabel: String(formData.get("contactQuickEmailLabel") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.quickEmailLabel,
    termsText: String(formData.get("contactTermsText") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.termsText,
    marketingText: String(formData.get("contactMarketingText") || "").replace(/\r\n/g, "\n").trim() || contactInquiryDefaults.marketingText,
  } : null;
  // The investor-guide editor sends its structured sections as JSON.
  let invest: ({ type: "invest" } & ReturnType<typeof sanitizeInvestContent>) | null = null;
  if (slug === "invest-in-dubai" && String(formData.get("investJson") || "").trim()) {
    try {
      invest = { type: "invest", ...sanitizeInvestContent(JSON.parse(String(formData.get("investJson")))) };
    } catch {
      return { error: "The investor guide sections could not be read. Please review them and save again." };
    }
  }
  const headingStyle = textStyleFromForm(formData, "pageHeading");
  const introStyle = textStyleFromForm(formData, "pageIntro");
  // Legal pages: the contact block at the end (blank fields keep the standard wording).
  const legalContactBlock = formData.has("legalContactHeading") ? {
    type: "legal-contact",
    heading: String(formData.get("legalContactHeading") ?? "").trim(),
    text: String(formData.get("legalContactText") ?? "").trim(),
    email: String(formData.get("legalContactEmail") ?? "").trim(),
  } : null;
  const content = [
    ...(heading || intro || image || eyebrow || ctaLabel || ctaUrl || headingStyle || introStyle ? [{ type: "hero", heading, text: intro, image, eyebrow, ctaLabel, ctaUrl, ...(headingStyle ? { headingStyle } : {}), ...(introStyle ? { textStyle: introStyle } : {}) }] : []),
    ...paragraphBlocks(paragraphs),
    ...(about ? [about] : []),
    ...(legacy ? [legacy] : []),
    ...(contactForm ? [contactForm] : []),
    ...(invest ? [invest] : []),
    ...(legalContactBlock ? [legalContactBlock] : []),
  ];

  return { content };
}

/// Save a conventional editorial page. Page templates render these named
/// blocks; editors never need to hand-author the JSON representation.
/// Shared page write path (editor form + version restore). Registry pages and
/// hard-deleted rows are re-created on restore.
async function applyStaticPage(id: string, formData: FormData): Promise<ApplyResult> {
  const title = String(formData.get("title") || "").trim();
  let slug = slugify(title);
  if (id) {
    // The public URL of a fixed page (About, Legacy, Contact, Investor guide, the legal
    // pages) is defined by the site's routes: renaming its slug would orphan the row so
    // neither the editor nor the public page could find it again. Those pages keep their slug.
    const current = await db.staticPage.findUnique({ where: { id }, select: { slug: true } });
    if (current) slug = current.slug;
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
  await requirePermission("content.editLive");
  // An Arabic or Japanese tab previews its translation from its own row.
  const { locale, form } = splitTranslationForm(formData);
  const id = String(form.get("id") || "");
  const existing = id ? await db.staticPage.findUnique({ where: { id }, select: { slug: true, content: true } }) : null;
  const slug = existing?.slug ?? slugify(String(form.get("title") || ""));
  if (!previewablePageSlugs.includes(slug)) return { error: "This page cannot be previewed this way." };
  const title = String(form.get("title") || "").trim();
  if (!title) return { error: "Give the page a title to preview it." };
  const built = buildStaticPageContent(slug, form);
  if ("error" in built) return { error: built.error };
  // A translation's preview keeps the saved blocks the editor has no box for
  // (a paragraph of the History page), as the public page shows them.
  const saved: Record<string, unknown>[] = Array.isArray(existing?.content) ? (existing.content as Record<string, unknown>[]) : [];
  const draft: PageDraft = { title, content: locale === DEFAULT_LOCALE ? built.content : alignToSaved(saved, built.content), savedAt: Date.now() };
  const key = translationDraftKey(pageDraftKey(slug), locale);
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
  const { session } = await requirePermission("content.editLive");
  const id = String(formData.get("id") || "");
  const existing = id ? await db.staticPage.findUnique({ where: { id }, select: { slug: true } }) : null;
  const slug = existing?.slug ?? slugify(String(formData.get("title") || ""));

  const result = await applyStaticPage(id, formData);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this page." };
  const seo = await saveSeoFor("STATIC_PAGE", result.id, formData);

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
  if (seo.error) return seo;
  redirect(`/admin/pages/${result.id}?saved=1`);
}

export async function deleteStaticPage(formData: FormData) {
  const { session } = await requirePermission("content.delete");
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

/// The site-wide settings record as the editor's form has it. Shared by the
/// real save and the translation tabs so the two cannot disagree.
function globalSettingsFromForm(formData: FormData) {
  const textStyle = (prefix: string) => textStyleFromForm(formData, prefix) ?? {};
  return {
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    whatsapp: String(formData.get("whatsapp") || "").trim(),
    newsletterNote: String(formData.get("newsletterNote") || "").trim(),
    newsletterHeading: String(formData.get("newsletterHeading") || "").trim(),
    newsletterSubmitLabel: String(formData.get("newsletterSubmitLabel") || "").trim(),
    facebook: String(formData.get("facebook") || "").trim(),
    x: String(formData.get("x") || "").trim(),
    instagram: String(formData.get("instagram") || "").trim(),
    linkedin: String(formData.get("linkedin") || "").trim(),
    youtube: String(formData.get("youtube") || "").trim(),
    enquiryEnabled: formData.get("enquiryEnabled") === "on",
    callEnabled: formData.get("callEnabled") === "on",
    whatsappEnabled: formData.get("whatsappEnabled") === "on",
    enquiryLabel: String(formData.get("enquiryLabel") || "").trim(),
    callLabel: String(formData.get("callLabel") || "").trim(),
    whatsappLabel: String(formData.get("whatsappLabel") || "").trim(),
    headerCtaLabel: String(formData.get("headerCtaLabel") || "").trim(),
    headerCtaVisible: formData.get("headerCtaVisible") === "on",
    popupEnabled: formData.get("popupEnabled") === "on",
    popupFrequency: formData.get("popupFrequency") === "session" ? "session" : formData.get("popupFrequency") === "day" ? "day" : "every-page",
    popupDelaySeconds: Math.max(0, Math.min(120, Math.round(Number(formData.get("popupDelaySeconds")) || 0))),
    popupInterests: String(formData.get("popupInterests") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    formEmailsEnabled: formData.get("formEmailsEnabled") === "on",
    typography: { headings: textStyle("typographyHeadings"), body: textStyle("typographyBody"), ctas: textStyle("typographyCtas") },
    recipients: {
      enquiry: String(formData.get("recipientEnquiry") || "").trim(),
      booking: String(formData.get("recipientBooking") || "").trim(),
      floorPlan: String(formData.get("recipientFloorPlan") || "").trim(),
      calculator: String(formData.get("recipientCalculator") || "").trim(),
      newsletter: String(formData.get("recipientNewsletter") || "").trim(),
      brochure: String(formData.get("recipientBrochure") || "").trim(),
      sevenXSeven: String(formData.get("recipientSevenXSeven") || "").trim(),
      contactSales: String(formData.get("recipientContactSales") || "").trim(),
      contactCustomer: String(formData.get("recipientContactCustomer") || "").trim(),
      contactChannel: String(formData.get("recipientContactChannel") || "").trim(),
      contactCareers: String(formData.get("recipientContactCareers") || "").trim(),
      contactPress: String(formData.get("recipientContactPress") || "").trim(),
    },
    popupTitle: String(formData.get("popupTitle") || "").trim(),
    popupIntro: String(formData.get("popupIntro") || "").trim(),
    popupSubmitLabel: String(formData.get("popupSubmitLabel") || "").trim(),
    popupNote: String(formData.get("popupNote") || "").trim(),

  };
}

/// Shared write path for the site-wide contact details record.
async function applyGlobalSettings(formData: FormData): Promise<ApplyResult> {
  const global = globalSettingsFromForm(formData);
  try {
    // The News page copy (news_listing) is edited under Pages → News.
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
  const { session } = await requirePermission("settings.manage");
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
  return Object.fromEntries(Object.entries({
    introStats: parseJsonList(formData.get("introStatsJson"), (item) => (text(item.value) || text(item.label) ? { value: text(item.value), label: text(item.label) } : null)),
    statsKicker: String(formData.get("statsKicker") || "").trim(),
    statsNote: String(formData.get("statsNote") ?? "").trim(),
    statsNoteUrl: String(formData.get("statsNoteUrl") || "").trim(),
    statsValueStyle: textStyleFromForm(formData, "statsValue"),
    statsLabelStyle: textStyleFromForm(formData, "statsLabel"),
    bannerSlides: parseJsonList(formData.get("bannerSlidesJson"), (item) => (text(item.image) ? { image: text(item.image), label: text(item.label) || "Development", ...(text(item.text) ? { text: text(item.text) } : {}), ...(text(item.tag) ? { tag: text(item.tag) } : {}) } : null)),
    developmentCards: parseJsonList(formData.get("developmentCardsJson"), (item) => (text(item.title) || text(item.image) ? { href: text(item.href), image: text(item.image), title: text(item.title), copy: text(item.copy) } : null)),
    heroMediaType: formData.get("heroMediaType") === "image" ? "image" : "video",
    heroVideo: String(formData.get("heroVideo") || "").trim(),
    heroImage: String(formData.get("heroImage") || "").trim(),
    heroText: preserveLineBreaks(formData.get("heroText") as string | null),
    heroCtaLabel: String(formData.get("heroCtaLabel") || "").trim(),
    heroCtaUrl: String(formData.get("heroCtaUrl") || "").trim(),
    introKicker: String(formData.get("introKicker") || "").trim(),
    introValues: parseJsonList(formData.get("introValuesJson"), (item) => (text(item.title) || text(item.body) ? { title: text(item.title), body: text(item.body), ...(typeof item.cap === "string" ? { cap: text(item.cap) } : {}) } : null)),
    introHeading: normalizeLineBreaks(formData.get("introHeading") as string | null),
    introParagraphs: nonEmptyLines(formData.get("introParagraphs")),
    developmentHeading: normalizeLineBreaks(formData.get("developmentHeading") as string | null),
    developmentKicker: String(formData.get("developmentKicker") || "").trim(),
    developmentBannerText: preserveLineBreaks(formData.get("developmentBannerText") as string | null),
    developmentHeadingPosition: formData.get("developmentHeadingPosition") === "below" ? "below" : formData.get("developmentHeadingPosition") === "above" ? "above" : "overlay",
    developmentHeadingStyle: textStyleFromForm(formData, "developmentHeading"),
    introHeadingStyle: textStyleFromForm(formData, "introHeading"),
    introBodyStyle: textStyleFromForm(formData, "introBody"),
    developmentTextStyle: textStyleFromForm(formData, "developmentText"),
    newsHeadingStyle: textStyleFromForm(formData, "newsHeading"),
    newsBodyStyle: textStyleFromForm(formData, "newsBody"),
    contactHeadingStyle: textStyleFromForm(formData, "contactHeading"),
    contactBodyStyle: textStyleFromForm(formData, "contactBody"),
    cardCtaLabel: String(formData.get("cardCtaLabel") || "").trim(),
    cardCtaVisible: formData.get("cardCtaVisible") === "on",
    developmentCtaLabel: String(formData.get("developmentCtaLabel") || "").trim(),
    developmentCtaUrl: String(formData.get("developmentCtaUrl") || "").trim(),
    developmentCtaVisible: formData.get("developmentCtaVisible") === "on",
    developmentTextVisible: formData.get("developmentTextVisible") === "on",
    developmentTextPosition: formData.get("developmentTextPosition") === "above" ? "above" : "below",
    developmentText: preserveLineBreaks(formData.get("developmentText") as string | null),
    newsHeading: normalizeLineBreaks(formData.get("newsHeading") as string | null),
    newsText: preserveLineBreaks(formData.get("newsText") as string | null),
    newsCta: String(formData.get("newsCta") || "").trim(),
    newsCtaUrl: String(formData.get("newsCtaUrl") || "").trim(),
    newsCtaVisible: formData.get("newsCtaVisible") === "on",
    newsCardLabel: formData.has("newsCardLabel") ? String(formData.get("newsCardLabel") || "").trim() : undefined,
    newsCtaPosition: ["above", "left", "right"].includes(String(formData.get("newsCtaPosition") || "")) ? formData.get("newsCtaPosition") as "above" | "left" | "right" : "below",
    developmentCtaPosition: ["above", "left", "right"].includes(String(formData.get("developmentCtaPosition") || "")) ? formData.get("developmentCtaPosition") as "above" | "left" | "right" : "below",
    contactHeading: normalizeLineBreaks(formData.get("contactHeading") as string | null),
    contactKicker: String(formData.get("contactKicker") || "").trim(),
    contactText: String(formData.get("contactText") || "").trim(),
    contactCtaLabel: String(formData.get("contactCtaLabel") || "").trim(),
    contactCtaUrl: String(formData.get("contactCtaUrl") || "").trim(),
    contactCtaVisible: formData.get("contactCtaVisible") === "on",
    experienceImages: nonEmptyLines(formData.get("experienceImages")),
    /// Keep empty positions so captions stay paired with their image.
    experienceCaptions: String(formData.get("experienceCaptions") ?? "").split(/\r?\n/).map((caption) => caption.trim()),
  }).filter(([, value]) => value !== undefined));
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
  const { session } = await requirePermission("content.editLive");
  // An Arabic or Japanese tab previews its translation from its own row.
  const { locale, form } = splitTranslationForm(formData);
  const key = translationDraftKey(siteDraftKey("home", session.email), locale);
  const value = newSiteDraft(homeSettingsFromForm(form));
  await db.siteSetting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } });
  return {};
}

/// Same for the investor guide: the hero block and the structured sections as
/// the editor currently has them (validated the way a real save validates them).
export async function previewInvestDraft(formData: FormData): Promise<{ error?: string }> {
  const { session } = await requirePermission("content.editLive");
  // An Arabic or Japanese tab previews its translation from its own row.
  const { locale, form } = splitTranslationForm(formData);
  let invest: ReturnType<typeof sanitizeInvestContent> | undefined;
  const raw = String(form.get("investJson") || "").trim();
  if (raw) {
    try { invest = sanitizeInvestContent(JSON.parse(raw)); } catch { return { error: "The investor guide sections could not be read. Please review them and try again." }; }
  }
  const heroFields = { type: "hero", eyebrow: String(form.get("eyebrow") || "").trim(), heading: String(form.get("heading") || "").trim(), text: String(form.get("intro") || "").trim(), image: String(form.get("image") || "").trim(), ...(textStyleFromForm(form, "pageHeading") ? { headingStyle: textStyleFromForm(form, "pageHeading") } : {}), ...(textStyleFromForm(form, "pageIntro") ? { textStyle: textStyleFromForm(form, "pageIntro") } : {}) };
  // A real save drops the hero block when every field is empty; mirror that so
  // the preview shows the same delivered defaults the public page would.
  const hero = heroFields.eyebrow || heroFields.heading || heroFields.text || heroFields.image ? heroFields : undefined;
  const key = translationDraftKey(siteDraftKey("invest", session.email), locale);
  const value = newSiteDraft({ hero, saved: invest ? { type: "invest", ...invest } : undefined });
  await db.siteSetting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } });
  return {};
}

/// The /news page copy as the editor's form has it. Shared by the real save
/// and the translation tabs so the two cannot disagree.
function newsListingFromForm(formData: FormData): { value: Record<string, unknown> } | { error: string } {
  const field = (name: string) => String(formData.get(name) || "").trim();
  const value: Record<string, unknown> = {
    eyebrow: field("eyebrow"),
    heading: normalizeLineBreaks(formData.get("heading") as string | null),
    intro: field("intro"),
    featureCta: field("featureCta"),
    cardCta: field("cardCta"),
    emptyText: field("emptyText"),
    pressVisible: formData.get("pressVisible") === "on",
    pressLabel: field("pressLabel"),
    pressHeading: normalizeLineBreaks(formData.get("pressHeading") as string | null),
    pressText: field("pressText"),
    pressLinkLabel: field("pressLinkLabel"),
    pressLinkText: field("pressLinkText"),
    pressLinkUrl: field("pressLinkUrl"),
    coverageVisible: formData.get("coverageVisible") === "on",
    coverageLabel: field("coverageLabel"),
    coverageHeading: normalizeLineBreaks(formData.get("coverageHeading") as string | null),
    coverage: [] as PressItem[],
    layout: formData.get("layout") === "press" ? "press" as const : "articles" as const,
    filterAll: field("filterAll"),
    filterPerspective: field("filterPerspective"),
    filterAnnouncement: field("filterAnnouncement"),
    pressCardCta: field("pressCardCta"),
    headingStyle: textStyleFromForm(formData, "newsHeading"),
    pressHeadingStyle: textStyleFromForm(formData, "newsPressHeading"),
    pressTextStyle: textStyleFromForm(formData, "newsPressText"),

  };
  try {
    value.coverage = normalizePressItems(JSON.parse(String(formData.get("coverageJson") || "[]")));
  } catch {
    return { error: "The press coverage list could not be read. Reload the page and try again." };
  }
  return { value };
}

/// The /news page copy lives in the "news_listing" settings record and is
/// edited under Pages → News. Blank fields keep the approved wording.
export async function saveNewsListing(
  _prev: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const { session } = await requirePermission("content.editLive");
  const built = newsListingFromForm(formData);
  if ("error" in built) return { error: built.error };
  const value = built.value as never;
  try {
    await db.siteSetting.upsert({ where: { key: "news_listing" }, update: { value }, create: { key: "news_listing", value } });
  } catch {
    return { error: "Unable to save the News page." };
  }
  revalidatePath("/news");
  revalidatePath("/rss.xml");
  revalidatePath("/admin/pages/news");
  revalidatePublicContent();
  await logActivity({ action: "content.save", session, entityType: "NEWS_LISTING", entityId: "news_listing", summary: "Saved News page content" });
  redirect("/admin/pages/news?saved=1");
}

/// Homepage content is stored in the "home" settings record and edited from
/// the Pages section, where editors expect to find page content.
export async function saveHomeSettings(
  _prev: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const { session } = await requirePermission("content.editLive");
  const result = await applyHomeSettings(formData);
  if (result.error) return { error: result.error };
  const seo = await saveSeoFor("HOME_SETTINGS", "home", formData);
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
  if (seo.error) return seo;
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
  const { session } = await requirePermission("content.editLive");
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
  const { session } = await requirePermission("content.editLive");
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

// ── Translations (the Arabic and Japanese tabs) ──────────────────────────────
//
// An Arabic or Japanese tab is the English editor form with the translation's
// text in it. Saving it never writes the English record. The form is read with
// the same builders as the English save, compared with the English form the
// editor's browser sends along, and only the text that differs is stored — in
// the translation's own row (src/lib/translations/store.ts). Images, links,
// switches, order and styles cannot be stored: they are not text.
//
// Each apply* is the write path for both the tab's save and a version restore.

const LEGAL_PAGE_SLUGS = ["terms", "privacy-policy", "cookie-policy"];

/// An article's translation: title, summary, body and alt text.
async function applyArticleTranslation(articleId: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  const article = await db.article.findUnique({ where: { id: articleId }, select: { title: true, summary: true, body: true, coverImageAlt: true } });
  if (!article) return { error: "This article no longer exists." };
  let body: string[];
  let englishBody: string[];
  try {
    body = parseBody(String(form.get("body") || "[]"));
    // Without the English form, the comparison is with the article as it is saved.
    englishBody = englishForm ? parseBody(String(englishForm.get("body") || "[]")) : Array.isArray(article.body) ? article.body.map(String) : [];
  } catch (err) {
    return { error: (err as Error).message };
  }
  const boxes = (source: FormData) => ({
    title: String(source.get("title") || "").trim(),
    summary: String(source.get("summary") || "").trim(),
    coverImageAlt: String(source.get("coverImageAlt") || "").trim() || null,
  });
  const built = { ...boxes(form), body };
  const english = englishForm ? { ...boxes(englishForm), body: englishBody } : { title: article.title, summary: article.summary, body: englishBody, coverImageAlt: article.coverImageAlt };
  await writeArticleTranslation(articleId, locale, english, built);
  return { id: articleId, label: built.title || article.title };
}

/// A legal page's translation. Its English document is the client's text
/// (src/lib/terms-defaults.ts), not CMS content, so the form shows that
/// document line by line; only what differs from it is stored, as an overlay.
async function applyLegalTranslation(pageId: string, slug: string, locale: Locale, form: FormData): Promise<ApplyResult> {
  const englishDocument = legalDocuments.find((document) => document.id === legalTabForSlug(slug));
  if (!englishDocument) return { error: "This page has no document to translate." };
  const page = await db.staticPage.findUnique({ where: { id: pageId }, select: { content: true } });
  if (!page) return { error: "This page no longer exists." };
  const savedContact = Array.isArray(page.content)
    ? page.content.find((block): block is { type?: string; heading?: string; text?: string; email?: string } => Boolean(block) && typeof block === "object" && (block as { type?: string }).type === "legal-contact")
    : undefined;
  const englishContact = { ...legalContact, ...savedContact };
  const line = (name: string, shown: string) => {
    const value = form.get(name);
    return typeof value === "string" && value.trim() ? value : shown;
  };
  const builtContact = { ...englishContact, heading: line(legalFormFields.contactHeading, englishContact.heading), text: line(legalFormFields.contactText, englishContact.text) };
  const blocks = (contact: { heading: string; text: string }, document: LegalDocument) => [
    { type: LEGAL_TRANSLATION_BLOCKS[0], heading: contact.heading, text: contact.text },
    { type: LEGAL_TRANSLATION_BLOCKS[1], id: document.id, title: document.title, sections: document.sections },
  ];
  await writePageTranslation(pageId, locale, { content: blocks(englishContact, englishDocument) }, { content: blocks(builtContact, legalDocumentFromForm(englishDocument, form)) });
  return { id: pageId, label: englishDocument.title };
}

/// A page's translation: its title and the text of its blocks.
async function applyStaticPageTranslation(pageId: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  const page = await db.staticPage.findUnique({ where: { id: pageId }, select: { slug: true, title: true, content: true } });
  if (!page) return { error: "This page no longer exists." };
  if (LEGAL_PAGE_SLUGS.includes(page.slug)) return applyLegalTranslation(pageId, page.slug, locale, form);
  const built = buildStaticPageContent(page.slug, form);
  if ("error" in built) return { error: built.error };
  const saved: Record<string, unknown>[] = Array.isArray(page.content) ? (page.content as Record<string, unknown>[]) : [];
  // Without the English form, the comparison is with the page as it is saved.
  const englishFormBlocks = englishForm ? buildStaticPageContent(page.slug, englishForm) : { content: saved };
  if ("error" in englishFormBlocks) return { error: englishFormBlocks.error };
  const title = String(form.get("title") || "").trim();
  if (!title) return { error: "Page title is required." };
  const englishTitle = englishForm ? String(englishForm.get("title") || "").trim() : page.title;
  // A translation is filed by the position of the page's *saved* blocks. The
  // editor cannot show every kind of saved block (History and Contact have no
  // body box), and a translation filed by what the editor shows would land one
  // block too early (src/lib/translations/align-blocks.ts).
  await writePageTranslation(
    pageId,
    locale,
    { title: englishTitle, content: alignToSaved(saved, englishFormBlocks.content) },
    { title, content: alignToSaved(saved, built.content) },
  );
  return { id: pageId, label: title };
}

/// A development's translation: its own text, and its page's labels and buttons.
async function applyProjectTranslation(projectId: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  const project = await db.project.findUnique({ where: { id: projectId }, select: { name: true, tagline: true, description: true, location: true } });
  if (!project) return { error: "This development no longer exists." };
  if (!projectTextFromForm(form).name) return { error: "Development name is required." };
  const savedChrome = parseProjectChrome((await db.siteSetting.findUnique({ where: { key: projectChromeKey(projectId) } }).catch(() => null))?.value);
  await writeProjectTranslation(projectId, locale, englishForm ? projectTextFromForm(englishForm) : project, projectTextFromForm(form));
  await writeSettingTranslation(projectChromeKey(projectId), locale, englishForm ? projectChromeFromForm(englishForm, savedChrome) : savedChrome, projectChromeFromForm(form, savedChrome));
  return { id: projectId, label: projectTextFromForm(form).name };
}

/// A development section's translation: its title and its text.
async function applyProjectModuleTranslation(moduleId: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  const section = await db.projectModule.findUnique({ where: { id: moduleId }, select: { projectId: true, title: true, content: true } });
  if (!section) return { error: "This section no longer exists." };
  const text = (source: FormData) => ({ title: normalizeLineBreaks(source.get("title") as string | null), content: moduleContentFromForm(source) });
  await writeModuleTranslation(moduleId, locale, englishForm ? text(englishForm) : { title: section.title, content: section.content }, text(form));
  return { id: moduleId, projectId: section.projectId, label: text(form).title || section.title };
}

async function applyHomeTranslation(_id: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  const saved = (await db.siteSetting.findUnique({ where: { key: "home" } }).catch(() => null))?.value ?? null;
  await writeSettingTranslation("home", locale, englishForm ? homeSettingsFromForm(englishForm) : saved, homeSettingsFromForm(form));
  return { id: "home", label: "Homepage" };
}

async function applyGlobalTranslation(_id: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  const saved = mergeGlobalSettings((await db.siteSetting.findUnique({ where: { key: "global" } }).catch(() => null))?.value);
  await writeSettingTranslation("global", locale, englishForm ? globalSettingsFromForm(englishForm) : saved, globalSettingsFromForm(form));
  return { id: "global", label: "Site settings" };
}

async function applyNewsListingTranslation(_id: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  const built = newsListingFromForm(form);
  if ("error" in built) return { error: built.error };
  let english: unknown;
  if (englishForm) {
    const fromForm = newsListingFromForm(englishForm);
    if ("error" in fromForm) return { error: fromForm.error };
    english = fromForm.value;
  } else {
    english = (await db.siteSetting.findUnique({ where: { key: "news_listing" } }).catch(() => null))?.value ?? null;
  }
  await writeSettingTranslation("news_listing", locale, english, built.value);
  return { id: "news_listing", label: "News page" };
}

/// The write path of a translation, by entity — the same one for the tab's
/// save and for a version restore.
async function applyTranslation(entityType: string, entityId: string, locale: Locale, form: FormData, englishForm: FormData | null): Promise<ApplyResult> {
  switch (entityType) {
    case "ARTICLE": return applyArticleTranslation(entityId, locale, form, englishForm);
    case "STATIC_PAGE": return applyStaticPageTranslation(entityId, locale, form, englishForm);
    case "PROJECT": return applyProjectTranslation(entityId, locale, form, englishForm);
    case "PROJECT_MODULE": return applyProjectModuleTranslation(entityId, locale, form, englishForm);
    case "HOME_SETTINGS": return applyHomeTranslation(entityId, locale, form, englishForm);
    case "GLOBAL_SETTINGS": return applyGlobalTranslation(entityId, locale, form, englishForm);
    case "NEWS_LISTING": return applyNewsListingTranslation(entityId, locale, form, englishForm);
    case "SXS_PAGE": return applySxsTranslation(entityId, locale, form, englishForm);
    default: return { error: "This content cannot be translated." };
  }
}

/// The "Search appearance" boxes of a translation tab: the translation's own
/// search title and description, stored beside the English ones. Whatever is
/// left blank shows the English search text.
async function saveSeoTranslationFor(entityType: string, entityId: string, form: FormData, locale: Locale): Promise<{ error?: string }> {
  const built = seoOverrideFromForm(form);
  if (!built) return {};
  let key: string | null = null;
  let automatic: { title: string; description: string } | null = null;
  if (entityType === "ARTICLE") {
    const article = await db.article.findUnique({ where: { id: entityId }, select: { title: true, summary: true } });
    if (article) { key = seoKey("article", entityId); automatic = { title: withBrand(article.title), description: article.summary || article.title }; }
  } else if (entityType === "PROJECT") {
    const project = await db.project.findUnique({ where: { id: entityId }, select: { name: true, location: true, tagline: true, description: true } });
    if (project) { key = seoKey("project", entityId); automatic = { title: developmentTitle(project.name, project.location), description: developmentDescription(project) }; }
  } else if (entityType === "HOME_SETTINGS") {
    key = seoKey("page", "home");
    automatic = { title: pageSeo.home.title, description: pageSeo.home.description };
  } else if (entityType === "STATIC_PAGE") {
    const slug = (await db.staticPage.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug;
    const defaults = slug ? fixedPageSeoDefaults(slug) : null;
    if (defaults) { key = seoKey("page", slug as string); automatic = { title: defaults.title, description: defaults.description }; }
  }
  if (!key || !automatic) return {};
  try {
    await writeSettingTranslation(key, locale, applySeoOverride(automatic, await loadSeoOverride(key)), { title: built.title ?? "", description: built.description ?? "" });
    return {};
  } catch {
    return { error: "The translation was saved, but its search title and description could not be stored. Please save again." };
  }
}

/// Where a translation save sends the editor back to: the same tab.
function translationReturnPath(value: FormDataEntryValue | null, fallback: string, locale: Locale) {
  const asked = String(value || "");
  const base = asked.startsWith("/admin/") && !asked.includes("//") && !asked.includes("lang=") ? asked : fallback;
  return `${base}${base.includes("?") ? "&" : "?"}lang=${locale}`;
}

/// What every translation save does once the text is stored.
async function finishTranslation(input: {
  entityType: ContentVersionEntity | "NEWS_LISTING";
  result: ApplyResult;
  locale: Locale;
  session: Parameters<typeof logActivity>[0]["session"];
  what: string;
  returnTo: string;
  formData: FormData;
  versioned: boolean;
  revalidate: () => void;
}): Promise<{ error?: string }> {
  input.revalidate();
  if (input.versioned) {
    await recordVersion({
      entityType: input.entityType as ContentVersionEntity,
      entityId: input.result.id ?? "",
      path: input.returnTo,
      label: input.result.label || input.what,
      snapshot: snapshotFormData(input.formData),
      authorEmail: input.session?.email ?? null,
      locale: input.locale,
    });
  }
  await logActivity({ action: "content.save", session: input.session, entityType: input.entityType, entityId: input.result.id, summary: `Saved the ${languageNames[input.locale]} translation of ${input.what}“${input.result.label}”` });
  redirect(`${input.returnTo}&saved=1`);
}

export async function saveArticleTranslation(_prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  const { session, user } = await requirePermission("content.write");
  const { locale, form, english } = splitTranslationForm(formData);
  if (locale === DEFAULT_LOCALE) return { error: "Choose Arabic or Japanese to save a translation." };
  const id = String(form.get("id") || "");
  const current = id ? await db.article.findUnique({ where: { id }, select: { status: true } }) : null;
  if (!mayEditContent(user.role, current?.status)) return { error: "Only an Editor can change an article once it is published or archived." };
  const result = await applyArticleTranslation(id, locale, form, english);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this translation." };
  const seo = await saveSeoTranslationFor("ARTICLE", result.id, form, locale);
  if (seo.error) return seo;
  await finishTranslation({
    entityType: "ARTICLE", result, locale, session, what: "article ", formData, versioned: true,
    returnTo: `/admin/articles/${result.id}?lang=${locale}`,
    revalidate: revalidatePublicContent,
  });
  return {};
}

export async function saveStaticPageTranslation(_prev: StaticPageFormState, formData: FormData): Promise<StaticPageFormState> {
  const { session } = await requirePermission("content.editLive");
  const { locale, form, english } = splitTranslationForm(formData);
  if (locale === DEFAULT_LOCALE) return { error: "Choose Arabic or Japanese to save a translation." };
  const result = await applyStaticPageTranslation(String(form.get("id") || ""), locale, form, english);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this translation." };
  const seo = await saveSeoTranslationFor("STATIC_PAGE", result.id, form, locale);
  if (seo.error) return seo;
  await finishTranslation({
    entityType: "STATIC_PAGE", result, locale, session, what: "page ", formData, versioned: true,
    returnTo: translationReturnPath(form.get("returnTo"), `/admin/pages/${result.id}`, locale),
    revalidate: revalidatePublicContent,
  });
  return {};
}

export async function saveProjectTranslation(_prev: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, user } = await requirePermission("content.write");
  const { locale, form, english } = splitTranslationForm(formData);
  if (locale === DEFAULT_LOCALE) return { error: "Choose Arabic or Japanese to save a translation." };
  const id = String(form.get("id") || "");
  const current = id ? await db.project.findUnique({ where: { id }, select: { status: true } }) : null;
  if (!mayEditContent(user.role, current?.status)) return { error: "Only an Editor can change a development once it is published or archived." };
  const result = await applyProjectTranslation(id, locale, form, english);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this translation." };
  const seo = await saveSeoTranslationFor("PROJECT", result.id, form, locale);
  if (seo.error) return seo;
  await finishTranslation({
    entityType: "PROJECT", result, locale, session, what: "development ", formData, versioned: true,
    returnTo: `/admin/projects/${result.id}?lang=${locale}`,
    revalidate: revalidatePublicContent,
  });
  return {};
}

export async function saveProjectModuleTranslation(_prev: ProjectModuleFormState, formData: FormData): Promise<ProjectModuleFormState> {
  const { session, user } = await requirePermission("content.write");
  const { locale, form, english } = splitTranslationForm(formData);
  if (locale === DEFAULT_LOCALE) return { error: "Choose Arabic or Japanese to save a translation." };
  const id = String(form.get("id") || "");
  const projectId = String(form.get("projectId") || "");
  if (!mayEditContent(user.role, await owningProjectStatus(projectId, id))) return { error: "Only an Editor can change a development once it is published or archived." };
  const result = await applyProjectModuleTranslation(id, locale, form, english);
  if (result.error || !result.id) return { error: result.error ?? "Unable to save this translation." };
  await finishTranslation({
    entityType: "PROJECT_MODULE", result, locale, session, what: "section ", formData, versioned: true,
    returnTo: `/admin/projects/${result.projectId ?? projectId}?lang=${locale}`,
    revalidate: revalidatePublicContent,
  });
  return {};
}

export async function saveHomeTranslation(_prev: SiteSettingsFormState, formData: FormData): Promise<SiteSettingsFormState> {
  const { session } = await requirePermission("content.editLive");
  const { locale, form, english } = splitTranslationForm(formData);
  if (locale === DEFAULT_LOCALE) return { error: "Choose Arabic or Japanese to save a translation." };
  const result = await applyHomeTranslation("home", locale, form, english);
  if (result.error) return { error: result.error };
  const seo = await saveSeoTranslationFor("HOME_SETTINGS", "home", form, locale);
  if (seo.error) return seo;
  await finishTranslation({
    entityType: "HOME_SETTINGS", result, locale, session, what: "", formData, versioned: true,
    returnTo: `/admin/pages/home?lang=${locale}`,
    revalidate: revalidatePublicContent,
  });
  return {};
}

export async function saveGlobalTranslation(_prev: SiteSettingsFormState, formData: FormData): Promise<SiteSettingsFormState> {
  const { session } = await requirePermission("settings.manage");
  const { locale, form, english } = splitTranslationForm(formData);
  if (locale === DEFAULT_LOCALE) return { error: "Choose Arabic or Japanese to save a translation." };
  const result = await applyGlobalTranslation("global", locale, form, english);
  if (result.error) return { error: result.error };
  await finishTranslation({
    entityType: "GLOBAL_SETTINGS", result, locale, session, what: "", formData, versioned: true,
    returnTo: `/admin/settings?lang=${locale}`,
    revalidate: revalidatePublicContent,
  });
  return {};
}

export async function saveNewsListingTranslation(_prev: SiteSettingsFormState, formData: FormData): Promise<SiteSettingsFormState> {
  const { session } = await requirePermission("content.editLive");
  const { locale, form, english } = splitTranslationForm(formData);
  if (locale === DEFAULT_LOCALE) return { error: "Choose Arabic or Japanese to save a translation." };
  const result = await applyNewsListingTranslation("news_listing", locale, form, english);
  if (result.error) return { error: result.error };
  await finishTranslation({
    entityType: "NEWS_LISTING", result, locale, session, what: "", formData, versioned: false,
    returnTo: `/admin/pages/news?lang=${locale}`,
    revalidate: revalidatePublicContent,
  });
  return {};
}

/// Site settings → Languages: which languages can be reached at their
/// addresses (/ar/…, /ja/…). One row, key "locales"; the language switcher's
/// own switch in that row is left as it is.
export async function saveLanguageSwitches(formData: FormData) {
  const { session } = await requirePermission("settings.manage");
  const current = (await db.siteSetting.findUnique({ where: { key: localesSettingKey } }).catch(() => null))?.value;
  const value = {
    ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}),
    ar: formData.get("ar") === "on",
    ja: formData.get("ja") === "on",
  };
  await db.siteSetting.upsert({ where: { key: localesSettingKey }, create: { key: localesSettingKey, value }, update: { value } });
  const on = (["ar", "ja"] as const).filter((locale) => value[locale] === true).map((locale) => languageNames[locale]);
  await logActivity({ action: "settings.save", session, entityType: "LOCALES", entityId: localesSettingKey, summary: on.length ? `Languages that can be reached: ${on.join(", ")}` : "Only English can be reached" });
  redirect("/admin/settings?saved=1#languages");
}

// ── Version restore ──────────────────────────────────────────────────────────
// Replays a stored editor payload through the regular save path, so validation,
// revalidation and activity logging behave exactly like a manual save. The
// restore itself is recorded as a new version, which makes it undoable.

export async function restoreVersion(formData: FormData) {
  const { session, user } = await requirePermission("content.editLive");
  const versionId = String(formData.get("versionId") || "");
  const version = await db.contentVersion.findUnique({ where: { id: versionId } });
  if (!version) redirect("/admin");
  // GLOBAL_SETTINGS snapshots carry site-wide settings — restoring them is
  // admin-only, exactly like the settings screen that produced them.
  if (version.entityType === "GLOBAL_SETTINGS" && user.role !== "ADMIN") {
    redirect(`${version.path || "/admin"}?denied=1`);
  }

  const payload = snapshotToFormData(version.snapshot);
  // A version saved on an Arabic or Japanese tab is a translation. Restoring it
  // writes the translation's own row again — never the English record.
  const language = version.locale === "ar" || version.locale === "ja" ? version.locale : null;
  let result: ApplyResult;
  if (language) {
    const { form, english } = splitTranslationForm(payload);
    result = await applyTranslation(version.entityType, version.entityId, language, form, english);
  } else {
    switch (version.entityType) {
      case "ARTICLE": result = await applyArticle(version.entityId, payload); break;
      case "STATIC_PAGE": result = await applyStaticPage(version.entityId, payload); break;
      case "PROJECT": result = await applyProject(version.entityId, payload); break;
      case "PROJECT_MODULE": result = await applyProjectModule(version.entityId, payload); break;
      case "HOME_SETTINGS": result = await applyHomeSettings(payload); break;
      case "GLOBAL_SETTINGS": result = await applyGlobalSettings(payload); break;
      case "CALCULATOR": result = await applyCalculator(payload); break;
      case "SXS_PAGE": result = await applySxsSettings(payload); break;
      default: redirect(version.path || "/admin");
    }
  }

  const returnPath = version.entityType === "PROJECT_MODULE"
    ? version.path
    : editorPathFor(version.entityType, result.id ?? version.entityId);
  // A translation's editor is its own language tab.
  const back = language && !returnPath.includes("lang=") ? `${returnPath}${returnPath.includes("?") ? "&" : "?"}lang=${language}` : returnPath;
  const withQuery = (suffix: string) => `${back}${back.includes("?") ? "&" : "?"}${suffix}`;
  if (result.error) redirect(withQuery(`error=${encodeURIComponent(result.error)}`));

  const entityId = result.id ?? version.entityId;
  if (language) {
    await saveSeoTranslationFor(version.entityType, entityId, splitTranslationForm(payload).form, language);
  } else {
    await saveSeoFor(version.entityType, entityId, payload);
  }
  await recordVersion({
    entityType: version.entityType as ContentVersionEntity,
    entityId,
    path: back,
    label: `${version.label} — restored from v${version.versionNumber}`,
    snapshot: snapshotFormData(payload),
    authorEmail: session.email,
    locale: language,
  });
  await logActivity({ action: "content.restore", session, entityType: version.entityType, entityId, summary: `Restored “${version.label}” to version ${version.versionNumber}${language ? ` (${languageNames[language]})` : ""}` });

  if (version.entityType === "ARTICLE" || version.entityType === "STATIC_PAGE") revalidatePath("/");
  if (version.entityType === "CALCULATOR") revalidatePath("/api/calculator/kpd");
  revalidatePath(back);
  revalidatePublicContent();
  redirect(withQuery("restored=1"));
}

/// Only ever send an editor back to the development screens.
function projectsReturnPath(value: FormDataEntryValue | null, fallback = "/admin/projects") {
  const path = String(value || "");
  return path.startsWith("/admin/projects") && !path.includes("//") ? path : fallback;
}

/// Quick status change from the Developments list or editor. Archiving (and
/// returning to Draft) removes the page from the public site immediately.
export async function setProjectStatus(formData: FormData) {
  const { session } = await requirePermission("content.publish");
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

/// Shows or hides one development on the homepage cards without unpublishing it.
export async function setProjectHomepage(formData: FormData) {
  await requirePermission("content.publish");
  const id = String(formData.get("id") || "");
  const project = id ? await db.project.findUnique({ where: { id }, select: { slug: true } }) : null;
  if (!project) redirect("/admin/projects");
  const key = projectChromeKey(id);
  const previous = parseProjectChrome((await db.siteSetting.findUnique({ where: { key } }).catch(() => null))?.value);
  const chrome = parseProjectChrome({ ...previous, showOnHomepage: formData.get("showOnHomepage") === "on" });
  await db.siteSetting.upsert({ where: { key }, update: { value: chrome }, create: { key, value: chrome } });
  revalidatePath("/");
  revalidatePath(`/developments/${project.slug}`);
  revalidatePath("/admin/projects");
  revalidatePublicContent();
  redirect("/admin/projects");
}

/// Copies a development (and all its sections) as a new draft.
export async function duplicateProject(formData: FormData) {
  const { session } = await requirePermission("content.write");
  const id = String(formData.get("id") || "");
  const source = id ? await db.project.findUnique({ where: { id }, include: { modules: { select: sharedModuleFields } } }) : null;
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
  await requirePermission("content.publish");
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
  const { user } = await requirePermission("content.write");
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!mayEditContent(user.role, await owningProjectStatus(projectId, id))) redirect("/admin?denied=1");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const [rows, chromeRow] = await Promise.all([
    db.projectModule.findMany({ where: { projectId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } }),
    db.siteSetting.findUnique({ where: { key: projectChromeKey(projectId) } }).catch(() => null),
  ]);
  const chrome = parseProjectChrome(chromeRow?.value);
  const slots = developmentSlots(rows, chrome.calculatorIndex).map((slot) => (slot === "calculator" ? "calculator" : slot.id));
  const order = reorderIds(slots, id, direction);
  const moduleOrder = order.filter((slotId) => slotId !== "calculator");
  const calculatorIndex = Math.max(0, order.indexOf("calculator"));
  await db.$transaction([
    ...moduleOrder.map((moduleId, index) => db.projectModule.update({ where: { id: moduleId }, data: { sortOrder: (index + 1) * 10 } })),
    db.siteSetting.upsert({
      where: { key: projectChromeKey(projectId) },
      update: { value: { ...chrome, calculatorIndex } },
      create: { key: projectChromeKey(projectId), value: { calculatorIndex } },
    }),
  ]);
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
  const { session } = await requirePermission("content.publish");
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
  const { session } = await requirePermission("content.write");
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
