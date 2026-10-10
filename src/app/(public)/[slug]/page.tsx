import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LegalPageView, legalPages } from "@/components/public/legal-page-view";

export const revalidate = 300;

/// The managed slugs are a fixed set — prerendered at deploy time; content is
/// still fetched per render and revalidated after 300s.
export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: legalPages[slug]?.title ?? "Legal" };
}

/// Managed legal pages render the delivered legal-page structure verbatim
/// (see LegalPageView). Until a page is PUBLISHED the delivered static file is
/// served by redirecting to /legacy/<file>.
export default async function ManagedLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = legalPages[slug];
  if (!meta) notFound();
  let page: { title: string; content: unknown; status: string } | null = null;
  try { page = await db.staticPage.findUnique({ where: { slug } }); } catch {}
  if (!page || page.status !== "PUBLISHED") redirect(`/legacy/${meta.file}`);
  return <LegalPageView slug={slug} page={page} />;
}
