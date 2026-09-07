import Link from "next/link";
import { db } from "@/lib/db";
import { deleteArticle } from "../actions";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await db.article.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <>
      <div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>News &amp; Blog</h1>
        <Link className="cms-btn" href="/admin/articles/new">
          New article
        </Link>
      </div>

      <table className="cms-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Kind</th>
            <th>Status</th>
            <th>Slug</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id}>
              <td>
                <Link href={`/admin/articles/${a.id}`}>{a.title}</Link>
              </td>
              <td>{a.kind}</td>
              <td>
                <span className={`cms-badge cms-badge--${a.status}`}>{a.status}</span>
              </td>
              <td>{a.slug}</td>
              <td>{a.updatedAt.toLocaleDateString("en-GB")}</td>
              <td>
                <form action={deleteArticle}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="cms-btn cms-btn--danger" type="submit">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {articles.length === 0 && (
            <tr>
              <td colSpan={6}>No articles yet — run the seed script or write one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
