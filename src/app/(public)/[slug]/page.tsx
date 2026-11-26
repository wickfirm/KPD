import { notFound } from "next/navigation";
import { legalSeo, pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LegalPageView, legalPages } from "@/components/public/legal-page-view";
import { applyTermsCopyOnce } from "@/lib/terms-restore";
import { getLocale } from "@/lib/locale";
import { loadLocalizedFixedPageSeo } from "@/lib/translations/store";
import { pageLanguages } from "@/lib/hreflang";

export const revalidate = 300;

/// The managed slugs are a fixed set — prerendered at deploy time; content is
/// still fetched per render and revalidated after 300s.
export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const seo = legalSeo[slug as keyof typeof legalSeo];
  if (!seo) return { title: "Legal" };
  const [fixed, locale, translated] = await Promise.all([loadLocalizedFixedPageSeo(slug), getLocale(), pageLanguages({ page: slug })]);
  return pageMetadata(fixed, locale, translated);
}

/// Managed legal pages render only CMS content; unpublished pages are not
/// exposed through a delivered static-copy fallback.
export default async function ManagedLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = legalPages[slug];
  if (!meta) notFound();
  if (slug === "terms") await applyTermsCopyOnce();
  let page: { title: string; content: unknown; status: string } | null = null;
  try { page = await db.staticPage.findUnique({ where: { slug } }); } catch {}
  if (!page || page.status !== "PUBLISHED") notFound();
  return <LegalPageView slug={slug} page={page} />;
}
