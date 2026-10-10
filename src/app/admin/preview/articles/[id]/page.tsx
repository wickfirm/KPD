import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ArticleView } from "@/components/public/article-view";
import { articleDraftKey, isFreshArticleDraft } from "@/lib/article-preview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of an article in any state (Draft, Published or
/// Archived) rendered through the same view as the public page. By default it
/// shows the last saved version; with ?draft=1 it shows the article as it
/// currently looks in the editor, saved or not ("new" = an article that has not
/// been saved yet). /admin is guarded by the session middleware; requireUser()
/// re-verifies the account.
export default async function ArticlePreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { session } = await requireUser();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const saved = isNew ? null : await db.article.findUnique({ where: { id } });
  if (!isNew && !saved) notFound();

  if (query.draft) {
    const row = await db.siteSetting.findUnique({ where: { key: articleDraftKey(isNew ? "" : id, session.email) } }).catch(() => null);
    if (row && isFreshArticleDraft(row.value)) {
      const draft = row.value;
      return <div className="home-development-page news-design-page article-page">
        <ArticleView
          article={{ ...draft, publishedAt: saved?.publishedAt ?? new Date() }}
          previewNote={`UNSAVED draft — not saved, not public · ${isNew ? "new article" : "last saved status: " + saved!.status.toLowerCase()} · visitors cannot see this URL`}
        />
      </div>;
    }
  }
  if (!saved) notFound();
  const state = saved.status === "PUBLISHED" ? "Published" : saved.status === "ARCHIVED" ? "Archived" : "Draft";
  return <div className="home-development-page news-design-page article-page">
    <ArticleView article={saved} previewNote={`Admin preview · ${state} · last saved version · visitors cannot see this URL`} />
  </div>;
}
