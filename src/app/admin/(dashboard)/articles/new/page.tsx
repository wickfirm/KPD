import ArticleForm from "../article-form";
import { EditorShell } from "@/components/admin/editor-shell";

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
      <EditorShell>
        <div className="cms-card">
          <ArticleForm />
        </div>
      </EditorShell>
    </>
  );
}
