import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ArticleView } from "@/components/public/article-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of an article in any state (Draft, Published or
/// Archived) rendered through the same view as the public page. Shows the
/// last saved version. /admin is guarded by the session middleware;
/// requireUser() re-verifies the account.
export default async function ArticlePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();
  const state = article.status === "PUBLISHED" ? "Published" : article.status === "ARCHIVED" ? "Archived" : "Draft";
  return <div className="home-development-page news-design-page article-page">
    <ArticleView article={article} previewNote={`Admin preview · ${state} · last saved version · visitors cannot see this URL`} />
  </div>;
}
