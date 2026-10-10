import Link from "next/link";
import { db } from "@/lib/db";
import { editablePages, type EditablePage } from "@/lib/editable-pages";

export const dynamic = "force-dynamic";

const legalKeys = new Set(["terms", "privacy-policy", "cookie-policy"]);

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

  /// What a visitor sees right now, in plain words.
  function state(entry: EditablePage) {
    const page = entry.editor === "home" ? null : bySlug.get(entry.key);
    const updatedAt = entry.editor === "home" ? homeSetting?.updatedAt : page?.updatedAt;
    if (legalKeys.has(entry.key)) {
      const live = page?.status === "PUBLISHED";
      return { updatedAt, badge: live ? "PUBLISHED" : "DRAFT", label: live ? "Live — your text" : "Original text", note: live ? "Visitors see the text you saved." : "Visitors see the original legal text. Set the page to Published to show your edits." };
    }
    const edited = entry.editor === "home" ? Boolean(homeSetting) : Array.isArray(page?.content) && page.content.length > 0;
    return { updatedAt, badge: "PUBLISHED", label: "Live", note: edited ? "Showing your saved content." : "Showing the original content until you save changes." };
  }

  const card = (entry: EditablePage) => {
    const info = state(entry);
    const page = bySlug.get(entry.key);
    return <article className="cms-dev-card" key={entry.key}>
      <div className="cms-dev-card__body">
        <div className="cms-row-card__meta"><span className="cms-eyebrow">{entry.publicHref}</span><span className={`cms-badge cms-badge--${info.badge}`}>{info.label}</span></div>
        <h2><Link href={entry.href}>{entry.title}</Link></h2>
        <p className="cms-dev-card__tagline">{entry.description}</p>
        <p className="cms-muted">{info.note}{info.updatedAt ? ` Last saved ${info.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.` : ""}</p>
      </div>
      <div className="cms-dev-card__actions">
        <Link className="cms-btn cms-btn--small" href={entry.href}>Edit</Link>
        {legalKeys.has(entry.key) && page ? <Link className="cms-btn cms-btn--outline cms-btn--small" href={`/admin/preview/pages/${entry.key}`} target="_blank">Preview saved text ↗</Link> : null}
        <Link className="cms-btn cms-btn--outline cms-btn--small" href={entry.publicHref} target="_blank">View page ↗</Link>
      </div>
    </article>;
  };

  const main = editablePages.filter((entry) => !legalKeys.has(entry.key));
  const legal = editablePages.filter((entry) => legalKeys.has(entry.key));

  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">Content</span>
        <h1>Pages</h1>
        <p>The key pages of the website, each with a guided editor. New page templates are added by the development team on request.</p>
      </div>
    </div>

    <h2 className="cms-form-heading">Website pages</h2>
    <div className="cms-dev-grid cms-dev-grid--text">{main.map(card)}</div>

    <h2 className="cms-form-heading">Legal pages</h2>
    <div className="cms-dev-grid cms-dev-grid--text">{legal.map(card)}</div>

    {extras.length ? <>
      <h2 className="cms-form-heading">Additional pages</h2>
      <div className="cms-dev-grid cms-dev-grid--text">
        {extras.map((page) => <article className="cms-dev-card" key={page.id}>
          <div className="cms-dev-card__body">
            <div className="cms-row-card__meta"><span className="cms-eyebrow">/{page.slug}</span><span className={`cms-badge cms-badge--${page.status}`}>{page.status === "PUBLISHED" ? "Published" : page.status === "ARCHIVED" ? "Archived" : "Draft"}</span></div>
            <h2><Link href={`/admin/pages/${page.id}`}>{page.title}</Link></h2>
            <p className="cms-muted">Last saved {page.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. This page has no public template yet.</p>
          </div>
          <div className="cms-dev-card__actions"><Link className="cms-btn cms-btn--small" href={`/admin/pages/${page.id}`}>Edit</Link></div>
        </article>)}
      </div>
    </> : null}
  </>;
}
