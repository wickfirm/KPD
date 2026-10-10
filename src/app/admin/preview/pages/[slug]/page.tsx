import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LegalPageView, legalPages } from "@/components/public/legal-page-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of a legal page (Terms, Privacy, Cookie) showing the
/// text last saved in the CMS, whether or not the page is Published. Until it
/// is published, visitors still see the delivered original. The other pages
/// (Homepage, About, Legacy, Contact, Invest) go live as soon as they are
/// saved, so they use "View page" instead.
export default async function PagePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  if (!legalPages[slug]) notFound();
  const page = await db.staticPage.findUnique({ where: { slug } });
  if (!page) notFound();
  const live = page.status === "PUBLISHED";
  return <div className="home-development-page kpd-page">
    <LegalPageView slug={slug} page={page} previewNote={`Admin preview · ${live ? "Published - visitors see this" : "Not published - visitors still see the original text"} · last saved version`} />
  </div>;
}
