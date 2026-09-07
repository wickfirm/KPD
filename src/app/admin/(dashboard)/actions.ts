"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

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
