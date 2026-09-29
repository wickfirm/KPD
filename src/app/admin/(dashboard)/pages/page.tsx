import Link from "next/link";
import { db } from "@/lib/db";
import { editablePages } from "@/lib/editable-pages";

export const dynamic = "force-dynamic";

/// Pages lists the fixed set of editable pages (see src/lib/editable-pages.ts)
/// plus any additional rows that already exist, so nothing is hidden. Free-form
/// page creation is intentionally not offered: new page templates require a
/// developer.
export default async function PagesPage() {
  const [pages, homeSetting] = await Promise.all([
    db.staticPage.findMany({ orderBy: { updatedAt: "desc" } }),
    db.siteSetting.findUnique({ where: { key: "home" } }),
  ]);
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const registered = new Set(editablePages.map((page) => page.key));
  const extras = pages.filter((page) => !registered.has(page.slug));
  return <>
    <div className="cms-page-heading"><div><span className="cms-eyebrow">Editorial library</span><h1>Pages</h1><p>The key pages of the website, each with a guided editor. New page templates are added by the development team on request.</p></div></div>

    <div className="cms-collection">
      {editablePages.map((entry) => {
        const page = entry.editor === "home" ? null : bySlug.get(entry.key);
        const updatedAt = entry.editor === "home" ? homeSetting?.updatedAt : page?.updatedAt;
        const status = entry.editor === "home" ? (homeSetting ? "PUBLISHED" : "DRAFT") : page?.status ?? "DRAFT";
        return <article className="cms-collection-card cms-collection-card--compact" key={entry.key}>
          <div className="cms-collection-card__main"><div><span className="cms-eyebrow">{entry.publicHref}</span><h2>{entry.title}</h2><p>{entry.description}</p>{updatedAt ? <p className="cms-muted">Last updated {updatedAt.toLocaleDateString("en-GB")}</p> : null}</div><span className={`cms-badge cms-badge--${status}`}>{status}</span></div>
          <div className="cms-collection-card__actions"><Link className="cms-btn" href={entry.href}>Open editor</Link><Link className="cms-btn cms-btn--ghost" href={entry.publicHref} target="_blank">View page</Link></div>
        </article>;
      })}
    </div>

    {extras.length ? <>
      <h2 className="cms-form-heading" style={{ marginTop: 34 }}>Additional pages</h2>
      <div className="cms-collection">
        {extras.map((page) => <article className="cms-collection-card cms-collection-card--compact" key={page.id}>
          <div className="cms-collection-card__main"><div><span className="cms-eyebrow">/{page.slug}</span><h2>{page.title}</h2><p>Last updated {page.updatedAt.toLocaleDateString("en-GB")}</p></div><span className={`cms-badge cms-badge--${page.status}`}>{page.status}</span></div>
          <div className="cms-collection-card__actions"><Link className="cms-btn cms-btn--ghost" href={`/admin/pages/${page.id}`}>Open editor</Link></div>
        </article>)}
      </div>
    </> : null}
  </>;
}
