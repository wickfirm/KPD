import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LegalPageView, legalPages } from "@/components/public/legal-page-view";
import { AboutView, ContactView, LegacyView } from "@/components/public/page-views";
import { isFreshPageDraft, pageDraftKey } from "@/lib/page-preview";
import { loadContactDetails, loadStaticBlocks, type StaticBlock } from "@/lib/static-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

const livePages = ["about", "legacy", "contact"];

/// Admin-only preview of a managed page. By default it shows the text last
/// saved in the CMS; with ?draft=1 it shows the page as it currently looks in
/// the editor, saved or not.
/// - Legal pages (Terms, Privacy, Cookie): shown whether or not they are
///   Published; until published, visitors still see the delivered original.
/// - About, Legacy, Contact: these go live the moment they are saved, so the
///   saved version is what visitors see now.
export default async function PagePreviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const isLegal = Boolean(legalPages[slug]);
  if (!isLegal && !livePages.includes(slug)) notFound();

  let draft: { title: string; content: unknown[] } | null = null;
  if (query.draft) {
    const row = await db.siteSetting.findUnique({ where: { key: pageDraftKey(slug) } }).catch(() => null);
    if (row && isFreshPageDraft(row.value)) draft = row.value;
  }

  if (isLegal) {
    if (draft) {
      return <div className="home-development-page kpd-page">
        <LegalPageView slug={slug} page={draft} previewNote="UNSAVED draft — not saved, not public · visitors cannot see this URL" />
      </div>;
    }
    const page = await db.staticPage.findUnique({ where: { slug } });
    if (!page) notFound();
    const live = page.status === "PUBLISHED";
    return <div className="home-development-page kpd-page">
      <LegalPageView slug={slug} page={page} previewNote={`Admin preview · ${live ? "Published - visitors see this" : "Not published - visitors still see the original text"} · last saved version`} />
    </div>;
  }

  const blocks = draft ? draft.content as StaticBlock[] : await loadStaticBlocks(slug);
  const note = draft ? "UNSAVED draft — not saved, not public · visitors cannot see this URL" : "Admin preview · saved version (this is what visitors see) · visitors cannot see this URL";
  if (slug === "about") return <AboutView blocks={blocks} previewNote={note} />;
  if (slug === "legacy") return <LegacyView blocks={blocks} previewNote={note} />;
  return <ContactView blocks={blocks} contact={await loadContactDetails()} previewNote={note} />;
}
