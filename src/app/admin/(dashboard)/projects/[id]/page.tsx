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

  return <>
    <div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}>
      <h1 style={{ margin: 0 }}>Edit development</h1>
      <div className="cms-actions"><Link className="cms-btn cms-btn--ghost" href="/admin/projects">Back</Link>{project.status === "PUBLISHED" ? <Link className="cms-btn" href={`/developments/${project.slug}`} target="_blank">View public page</Link> : null}</div>
    </div>
    <div className="cms-card"><ProjectForm defaults={project} /></div>
    <div className="cms-actions" style={{ justifyContent: "space-between", marginTop: 32, marginBottom: 16 }}><h2 style={{ margin: 0 }}>Reusable page modules</h2><span style={{ color: "#5b6675", fontSize: 13 }}>Modules render in display-order sequence on the public template.</span></div>
    {project.modules.map((module) => <div className="cms-card" key={module.id}>
      <div className="cms-actions" style={{ justifyContent: "space-between" }}><strong>{module.sortOrder}. {module.title} <span className="cms-badge">{module.kind}</span></strong><form action={deleteProjectModule}><input type="hidden" name="id" value={module.id} /><input type="hidden" name="projectId" value={project.id} /><button className="cms-btn cms-btn--danger" type="submit">Delete</button></form></div>
      <ModuleForm projectId={project.id} defaults={{ ...module, content: JSON.stringify(module.content, null, 2) }} />
    </div>)}
    <div className="cms-card"><h3>Add module</h3><ModuleForm projectId={project.id} /></div>
  </>;
}
