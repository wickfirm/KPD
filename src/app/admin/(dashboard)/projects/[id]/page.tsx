import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteProjectModule } from "../../actions";
import ProjectForm from "../project-form";
import ModuleForm from "./module-form";

export const dynamic = "force-dynamic";

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { modules: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!project) notFound();

  return <div className="cms-editor">
    <div className="cms-page-heading">
      <div><span className="cms-eyebrow">Development editor</span><h1>{project.name}</h1><p>Manage the page content, media, and section order from one place.</p></div>
      <div className="cms-actions"><Link className="cms-btn cms-btn--ghost" href="/admin/projects">Back</Link>{project.status === "PUBLISHED" ? <Link className="cms-btn" href={`/developments/${project.slug}`} target="_blank">View public page</Link> : null}</div>
    </div>
    <div className="cms-card cms-card--settings"><div className="cms-card-intro"><span className="cms-eyebrow">Page settings</span><h2>Development details</h2><p>These details power the listing card and first view of the page.</p></div><ProjectForm defaults={project} /></div>
    <div className="cms-section-heading"><div><span className="cms-eyebrow">Page builder</span><h2>Content sections</h2><p>These sections appear on the public development page in the order below.</p></div><span className="cms-section-count">{project.modules.length} sections</span></div>
    {project.modules.map((module, index) => <details className="cms-module-disclosure" key={module.id} open={index === 0}>
      <summary className="cms-module-card__header"><div className="cms-module-title"><span className="cms-module-order">{module.sortOrder}</span><div><h3>{module.title}</h3><span className="cms-badge">{module.kind.replace("_", " ")}</span></div></div><span className="cms-edit-affordance">Edit <span aria-hidden="true">⌄</span></span></summary>
      <div className="cms-module-body"><div className="cms-module-toolbar"><p>Update this section, then save when you&apos;re ready.</p><form action={deleteProjectModule}><input type="hidden" name="id" value={module.id} /><input type="hidden" name="projectId" value={project.id} /><button className="cms-text-button cms-text-button--danger" type="submit">Delete section</button></form></div><ModuleForm projectId={project.id} defaults={{ ...module, content: module.content as { text?: string; images?: string[]; items?: { label?: string; value?: string; image?: string; url?: string }[]; url?: string; mapUrl?: string; presentation?: string } }} /></div>
    </details>)}
    <div className="cms-card cms-add-section"><span className="cms-eyebrow">Extend the page</span><h2>Add a new content section</h2><p>Choose a section type, then add its copy and media.</p><ModuleForm projectId={project.id} /></div>
  </div>;
}
