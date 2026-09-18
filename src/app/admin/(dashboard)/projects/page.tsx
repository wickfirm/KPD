import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: [{ sortOrder: "asc" }],
    include: { modules: true },
  });

  return (
    <>
      <div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Developments</h1>
        <Link className="cms-btn" href="/admin/projects/new">New development</Link>
      </div>

      <div className="cms-collection">{projects.map((p) => <article className="cms-collection-card" key={p.id}><div className="cms-collection-card__main"><div><span className="cms-eyebrow">{p.location ?? "Development"}</span><h2>{p.name}</h2><p>{p.modules.length} editable sections · {p.profile === "FULL" ? "Public profile" : "Restricted profile"}</p></div><span className={`cms-badge cms-badge--${p.status}`}>{p.status}</span></div><div className="cms-collection-card__actions"><Link className="cms-btn cms-btn--ghost" href={`/admin/projects/${p.id}`}>Edit development</Link>{p.status === "PUBLISHED" ? <Link className="cms-btn cms-btn--outline" href={`/developments/${p.slug}`} target="_blank">Preview ↗</Link> : null}</div></article>)}{projects.length === 0 ? <div className="cms-card"><p>No developments yet. Create the first development template above.</p></div> : null}</div>
    </>
  );
}
