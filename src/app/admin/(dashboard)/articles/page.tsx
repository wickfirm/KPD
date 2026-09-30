import Link from "next/link";
import { db } from "@/lib/db";
import { deleteArticle } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await db.article.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Content</span>
          <h1>News &amp; Blog</h1>
          <p>Articles appear on the public News page newest-first. Drafts stay private until you publish them.</p>
        </div>
        <Link className="cms-btn" href="/admin/articles/new">Write a new article</Link>
      </div>

      {articles.length === 0 ? (
        <div className="cms-card cms-empty">
          <h2>No articles yet</h2>
          <p>Your news page is waiting for its first story. Start with a short update — you can always edit it later.</p>
          <Link className="cms-btn" href="/admin/articles/new">Write the first article</Link>
        </div>
      ) : (
        <table className="cms-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Kind</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/articles/${a.id}`}>{a.title}</Link>
                  <small className="cms-table-sub">/{a.slug}</small>
                </td>
                <td>{a.kind}</td>
                <td>
                  <span className={`cms-badge cms-badge--${a.status}`}>{a.status}</span>
                </td>
                <td>{a.updatedAt.toLocaleDateString("en-GB")}</td>
                <td>
                  <form action={deleteArticle}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmButton className="cms-btn cms-btn--danger cms-btn--small" message={`Delete “${a.title}” permanently? Its version history goes too.`}>
                      Delete
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
