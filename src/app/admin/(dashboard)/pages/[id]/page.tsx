import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { findEditablePage } from "@/lib/editable-pages";
import { deleteStaticPage } from "../../actions";
import StaticPageForm from "../page-form";

export const dynamic = "force-dynamic";

type ContentBlock = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string };

/// One editor for both kinds of targets:
/// - a registry key (e.g. /admin/pages/legacy, /admin/pages/contact) which
///   finds or creates its StaticPage row on first open, and
/// - a raw page id (/admin/pages/<id>) for additional rows.
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = findEditablePage(id);

  let page = await db.staticPage.findUnique({ where: entry ? { slug: entry.key } : { id } });
  if (!page && entry) {
    // The registry entry is edited for the first time — create its row.
    page = await db.staticPage.create({ data: { slug: entry.key, title: entry.title, status: "DRAFT", content: [] } });
  }
  if (!page) notFound();

  const title = entry ? `Edit ${entry.title}` : "Edit page";
  const publicHref = entry?.publicHref ?? `/${page.slug}`;
  return <>
    <div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}>
      <div><span className="cms-eyebrow">{publicHref}</span><h1 style={{ margin: "7px 0 0" }}>{title}</h1></div>
      <div className="cms-actions">
        <Link className="cms-btn cms-btn--ghost" href="/admin/pages">Back</Link>
        <Link className="cms-btn cms-btn--ghost" href={publicHref} target="_blank">View page</Link>
        {!entry ? <form action={deleteStaticPage}><input type="hidden" name="id" value={page.id} /><button type="submit" className="cms-btn cms-btn--danger">Delete</button></form> : null}
      </div>
    </div>
    <div className="cms-card">
      {entry ? <p className="cms-muted">This page is part of the fixed site structure: the editor below covers its introduction. The surrounding template is maintained by the development team.</p> : null}
      <StaticPageForm defaults={{ ...page, content: page.content as ContentBlock[] }} lockedSlug={Boolean(entry)} />
    </div>
  </>;
}
