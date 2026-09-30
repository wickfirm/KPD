import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { findEditablePage } from "@/lib/editable-pages";
import { deleteStaticPage } from "../../actions";
import StaticPageForm from "../page-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";

type ContentBlock = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string };

/// One editor for both kinds of targets:
/// - a registry key (e.g. /admin/pages/legacy, /admin/pages/contact) which
///   finds or creates its StaticPage row on first open, and
/// - a raw page id (/admin/pages/<id>) for additional rows.
export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, flash] = await Promise.all([params, searchParams]);
  const entry = findEditablePage(id);

  let page = await db.staticPage.findUnique({ where: entry ? { slug: entry.key } : { id } });
  if (!page && entry) {
    // The registry entry is edited for the first time — create its row.
    page = await db.staticPage.create({ data: { slug: entry.key, title: entry.title, status: "DRAFT", content: [] } });
  }
  if (!page) notFound();

  const title = entry ? `Edit ${entry.title}` : "Edit page";
  const publicHref = entry?.publicHref ?? `/${page.slug}`;
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">{publicHref}</span>
          <h1>{title}</h1>
          <p>{entry ? "This page is part of the fixed site structure — the editor covers its introduction and body copy." : "Update the copy, then save. Drafts stay private."}</p>
        </div>
        <div className="cms-actions">
          <Link className="cms-btn cms-btn--ghost" href="/admin/pages">Back</Link>
          <Link className="cms-btn cms-btn--ghost" href={publicHref} target="_blank">View page</Link>
          {!entry ? (
            <form action={deleteStaticPage}>
              <input type="hidden" name="id" value={page.id} />
              <ConfirmButton className="cms-btn cms-btn--danger" message={`Delete the page “${page.title}” permanently?`}>Delete</ConfirmButton>
            </form>
          ) : null}
        </div>
      </div>
      <SavedBanner params={flash} />
      <div className="cms-card">
        <StaticPageForm defaults={{ ...page, content: page.content as ContentBlock[] }} lockedSlug={Boolean(entry)} />
      </div>
      <VersionHistory entityType="STATIC_PAGE" entityId={page.id} entityLabel={page.title} />
    </>
  );
}
