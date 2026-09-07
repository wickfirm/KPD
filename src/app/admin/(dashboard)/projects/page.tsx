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
        <span style={{ fontSize: 13, color: "#5b6675" }}>
          Project CRUD UI lands in Phase 2 (template build-out)
        </span>
      </div>

      <table className="cms-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Profile</th>
            <th>Status</th>
            <th>Modules</th>
            <th>Location</th>
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
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={5}>
                No developments yet. Seed Seven X Seven, Emerald Villa and Dubai Hills
                Mansion via <code>npm run db:seed</code>, or add them in Phase 2.{" "}
                <Link href="/admin">Back to dashboard</Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
