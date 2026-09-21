import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLegacyProject } from "@/lib/legacy-project";

export const dynamic = "force-dynamic";

export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await db.project.findFirst({
    where: { slug, status: "PUBLISHED", profile: "FULL" },
    include: { modules: { where: { profile: "FULL" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!project) notFound();
  const html = getLegacyProject(project);
  if (!html) notFound();
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
