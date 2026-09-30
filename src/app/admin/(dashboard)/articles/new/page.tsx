import ArticleForm from "../article-form";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Content</span>
          <h1>Write an article</h1>
          <p>Give it a title and a one-line summary, paste your paragraphs, and save. Choose “Draft” to keep it private, or “Published” to put it on the site straight away.</p>
        </div>
      </div>
      <div className="cms-card">
        <ArticleForm />
      </div>
    </>
  );
}
