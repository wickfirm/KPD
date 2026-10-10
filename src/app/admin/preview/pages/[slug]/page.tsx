import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LegalPageView, legalPages } from "@/components/public/legal-page-view";
import { isFreshPageDraft, pageDraftKey } from "@/lib/page-preview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of a legal page (Terms, Privacy, Cookie). By default it
/// shows the text last saved in the CMS, whether or not the page is Published;
/// with ?draft=1 it shows the page as it currently looks in the editor, saved
/// or not. Until a page is published, visitors still see the delivered
/// original. The other pages (Homepage, About, Legacy, Contact, Invest) go live
/// as soon as they are saved, so they use "View page" instead.
export default async function PagePreviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!legalPages[slug]) notFound();

  if (query.draft) {
    const row = await db.siteSetting.findUnique({ where: { key: pageDraftKey(slug) } }).catch(() => null);
    if (row && isFreshPageDraft(row.value)) {
      return <div className="home-development-page kpd-page">
        <LegalPageView slug={slug} page={row.value} previewNote="UNSAVED draft — not saved, not public · visitors cannot see this URL" />
      </div>;
    }
  }

  const page = await db.staticPage.findUnique({ where: { slug } });
  if (!page) notFound();
  const live = page.status === "PUBLISHED";
  return <div className="home-development-page kpd-page">
    <LegalPageView slug={slug} page={page} previewNote={`Admin preview · ${live ? "Published - visitors see this" : "Not published - visitors still see the original text"} · last saved version`} />
  </div>;
}
