import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getLegacyProject } from "@/lib/legacy-project";
import { OwnershipCostPlannerScripts } from "@/components/public/ownership-cost-planner-scripts";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await db.project
    .findFirst({ where: { slug, status: "PUBLISHED", profile: "FULL" }, select: { name: true, tagline: true, description: true, heroImage: true } })
    .catch(() => null);
  if (!project) return { title: "Development not found" };
  return {
    title: project.name,
    description: project.tagline || project.description || undefined,
    openGraph: { images: project.heroImage ? [{ url: project.heroImage }] : undefined },
  };
}


export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await db.project.findFirst({
    where: { slug, status: "PUBLISHED", profile: "FULL" },
    include: { modules: { where: { profile: "FULL" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!project) notFound();
  const html = getLegacyProject(project);
  if (!html) notFound();
  return <><div dangerouslySetInnerHTML={{ __html: html }} /><OwnershipCostPlannerScripts /></>;
}
