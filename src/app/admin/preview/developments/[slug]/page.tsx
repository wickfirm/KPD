import "../../../../(public)/public.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DevelopmentView } from "@/components/public/development-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of a development in any state (Draft, Published or
/// Archived) rendered through the same view as the public page. /admin is
/// guarded by the session middleware; requireUser() re-verifies the account.
export default async function DevelopmentPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: { modules: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!project) notFound();
  const state = project.status === "PUBLISHED" ? "Published" : project.status === "ARCHIVED" ? "Archived" : "Draft";
  return <div className="home-development-page single-project-page">
    <DevelopmentView project={project} previewNote={`Admin preview · ${state} · ${project.name} · visitors cannot see this URL`} />
  </div>;
}
