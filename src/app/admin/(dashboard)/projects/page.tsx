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

      <table className="cms-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Profile</th>
            <th>Status</th>
            <th>Modules</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>
                <span className="cms-badge">{p.profile}</span>
              </td>
              <td>
                <span className={`cms-badge cms-badge--${p.status}`}>{p.status}</span>
              </td>
              <td>{p.modules.length}</td>
              <td>{p.location ?? "—"}</td>
              <td className="cms-actions">
                <Link className="cms-btn cms-btn--ghost" href={`/admin/projects/${p.id}`}>Edit</Link>
                {p.status === "PUBLISHED" ? <Link className="cms-btn cms-btn--ghost" href={`/developments/${p.slug}`} target="_blank">View</Link> : null}
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={6}>
                No developments yet. Create the first development template above. {" "}
                <Link href="/admin">Back to dashboard</Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
