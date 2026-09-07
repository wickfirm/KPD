import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ArticleForm from "../article-form";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <>
      <h1>Edit article</h1>
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
    </>
  );
}
