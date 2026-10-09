import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { DevelopmentView } from "@/components/public/development-view";

export const revalidate = 300;

/// One query per request, shared by generateMetadata and the page via cache().
const getPublishedProject = cache(async (slug: string) => {
  return db.project.findFirst({
    where: { slug, status: "PUBLISHED", profile: "FULL" },
    include: { modules: { where: { profile: "FULL" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
});

/// Published developments are prerendered at deploy time; a database outage at
/// build falls back to on-demand rendering.
export async function generateStaticParams() {
  try {
    const rows = await db.project.findMany({
      where: { status: "PUBLISHED", profile: "FULL" },
      select: { slug: true },
    });
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug).catch(() => null);
  if (!project) return { title: "Development not found" };
  return {
    title: project.name,
    description: project.tagline || project.description || undefined,
    openGraph: { images: project.heroImage ? [{ url: project.heroImage }] : undefined },
  };
}

/// Unified delivered shell + React content rendered from the project row and
/// its CMS modules (shared with the admin draft preview).
export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();
  return <DevelopmentView project={project} />;
}
