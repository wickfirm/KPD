import ArticleForm from "../article-form";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
  return (
    <>
      <h1>New article</h1>
      <div className="cms-card">
        <ArticleForm />
      </div>
    </>
  );
}
