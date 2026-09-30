import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ArticleForm from "../article-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, flash] = await Promise.all([params, searchParams]);
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">{article.kind === "BLOG" ? "Blog post" : "News article"} · /{article.slug}</span>
          <h1>{article.title || "Edit article"}</h1>
          <p>Update the words and pictures, then save. Use “Draft” while you work — visitors only see “Published” articles.</p>
        </div>
        <span className={`cms-badge cms-badge--${article.status}`}>{article.status}</span>
      </div>
      <SavedBanner params={flash} />
      <div className="cms-card">
        <ArticleForm
          defaults={{
            id: article.id,
            kind: article.kind,
            slug: article.slug,
            title: article.title,
            summary: article.summary,
            body: JSON.stringify(article.body),
            coverImage: article.coverImage,
            coverImageAlt: article.coverImageAlt,
            status: article.status,
          }}
        />
      </div>
      <VersionHistory entityType="ARTICLE" entityId={article.id} entityLabel={article.title} />
    </>
  );
}
