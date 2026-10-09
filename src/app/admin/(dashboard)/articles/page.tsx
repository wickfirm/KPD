import Link from "next/link";
import { db } from "@/lib/db";
import { deleteArticle, duplicateArticle, setArticleStatus } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { SavedBanner } from "@/components/admin/flash";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { PUBLISHED: "Published", DRAFT: "Draft", ARCHIVED: "Archived" };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = first(params.q).trim().toLowerCase();
  const statusFilter = first(params.status);
  const kindFilter = first(params.kind);
  const all = await db.article.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, slug: true, kind: true, title: true, summary: true, coverImage: true, status: true, updatedAt: true, publishedAt: true },
  });
  const articles = all.filter((article) =>
    (!statusFilter || article.status === statusFilter) &&
    (!kindFilter || article.kind === kindFilter) &&
    (!query || [article.title, article.slug, article.summary].some((value) => value.toLowerCase().includes(query))));
  const href = (kind: string, status: string) => {
    const parts = [query ? `q=${encodeURIComponent(query)}` : "", kind ? `kind=${kind}` : "", status ? `status=${status}` : ""].filter(Boolean);
    return `/admin/articles${parts.length ? `?${parts.join("&")}` : ""}`;
  };
  const kindCount = (kind: string) => all.filter((article) => article.kind === kind).length;
  const statusCount = (status: string) => all.filter((article) => article.status === status).length;

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

      <SavedBanner params={params} />

      {all.length === 0 ? (
        <div className="cms-card cms-empty">
          <span className="cms-eyebrow">Get started</span>
          <h2>No articles yet</h2>
          <p>Create the first news or blog post. Drafts stay private until published.</p>
          <Link className="cms-btn" href="/admin/articles/new">Write the first article</Link>
        </div>
      ) : (
        <>
          <div className="cms-toolbar">
            <form className="cms-search" action="/admin/articles" role="search">
              <input type="search" name="q" defaultValue={first(params.q)} placeholder="Search articles" aria-label="Search articles" />
              {kindFilter ? <input type="hidden" name="kind" value={kindFilter} /> : null}
              {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
              <button className="cms-btn cms-btn--ghost" type="submit">Search</button>
            </form>
            <div className="cms-filter-row" aria-label="Filter articles">
              <Link className={`cms-chip${!kindFilter ? " is-active" : ""}`} href={href("", statusFilter)}>All <span>{all.length}</span></Link>
              <Link className={`cms-chip${kindFilter === "NEWS" ? " is-active" : ""}`} href={href("NEWS", statusFilter)}>News <span>{kindCount("NEWS")}</span></Link>
              <Link className={`cms-chip${kindFilter === "BLOG" ? " is-active" : ""}`} href={href("BLOG", statusFilter)}>Blog <span>{kindCount("BLOG")}</span></Link>
              <span className="cms-filter-row__divider" aria-hidden="true" />
              {["", "PUBLISHED", "DRAFT", "ARCHIVED"].map((status) => <Link key={status || "any"} className={`cms-chip${statusFilter === status ? " is-active" : ""}`} href={href(kindFilter, status)}>{status ? statusLabels[status] : "Any status"}{status ? <span>{statusCount(status)}</span> : null}</Link>)}
            </div>
          </div>

          <div className="cms-row-list">
            {articles.map((article) => (
              <article className="cms-row-card" key={article.id}>
                <Link className="cms-row-card__thumb" href={`/admin/articles/${article.id}`} aria-label={`Edit ${article.title}`}>
                  {article.coverImage ? <img src={article.coverImage} alt="" loading="lazy" /> : <span>No cover</span>}
                </Link>
                <div className="cms-row-card__main">
                  <div className="cms-row-card__meta"><span className="cms-badge cms-badge--type">{article.kind === "BLOG" ? "Blog" : "News"}</span><span className={`cms-badge cms-badge--${article.status}`}>{statusLabels[article.status] ?? article.status}</span></div>
                  <h2><Link href={`/admin/articles/${article.id}`}>{article.title}</Link></h2>
                  <p className="cms-row-card__summary">{article.summary}</p>
                  <p className="cms-muted">/{article.slug} · {article.publishedAt ? `published ${article.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "not published"} · edited {article.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="cms-row-card__actions">
                  <Link className="cms-btn cms-btn--small" href={`/admin/articles/${article.id}`}>Edit</Link>
                  {article.status === "PUBLISHED" ? <Link className="cms-btn cms-btn--outline cms-btn--small" href={`/news/${article.slug}`} target="_blank">View live ↗</Link> : null}
                  <details className="cms-menu">
                    <summary className="cms-btn cms-btn--ghost cms-btn--small" aria-label={`More actions for ${article.title}`}>More</summary>
                    <div className="cms-menu__panel">
                      {article.status !== "PUBLISHED" ? <form action={setArticleStatus}><input type="hidden" name="id" value={article.id} /><input type="hidden" name="status" value="PUBLISHED" /><button type="submit">Publish</button></form> : <form action={setArticleStatus}><input type="hidden" name="id" value={article.id} /><input type="hidden" name="status" value="DRAFT" /><button type="submit">Unpublish (back to draft)</button></form>}
                      {article.status !== "ARCHIVED" ? <form action={setArticleStatus}><input type="hidden" name="id" value={article.id} /><input type="hidden" name="status" value="ARCHIVED" /><button type="submit">Archive</button></form> : <form action={setArticleStatus}><input type="hidden" name="id" value={article.id} /><input type="hidden" name="status" value="DRAFT" /><button type="submit">Restore as draft</button></form>}
                      <form action={duplicateArticle}><input type="hidden" name="id" value={article.id} /><button type="submit">Duplicate</button></form>
                      <form action={deleteArticle}><input type="hidden" name="id" value={article.id} /><ConfirmButton className="cms-menu__danger" message={`Delete “${article.title}” permanently? Its version history goes too.`}>Delete permanently</ConfirmButton></form>
                    </div>
                  </details>
                </div>
              </article>
            ))}
            {articles.length === 0 ? <div className="cms-card cms-empty"><h2>No articles match</h2><p>Try a different search or <Link href="/admin/articles">clear the filters</Link>.</p></div> : null}
          </div>
        </>
      )}
    </>
  );
}
