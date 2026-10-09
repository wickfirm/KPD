import Link from "next/link";
import { db } from "@/lib/db";
import { SavedBanner } from "@/components/admin/flash";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { duplicateProject, moveProject, setProjectStatus } from "../actions";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { PUBLISHED: "Published", DRAFT: "Draft", ARCHIVED: "Archived" };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = first(params.q).trim().toLowerCase();
  const statusFilter = first(params.status);
  const all = await db.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, tagline: true, location: true, status: true, heroImage: true, updatedAt: true, _count: { select: { modules: true } } },
  });
  const projects = all.filter((project) =>
    (!statusFilter || project.status === statusFilter) &&
    (!query || [project.name, project.slug, project.location ?? "", project.tagline ?? ""].some((value) => value.toLowerCase().includes(query))));
  const filtered = Boolean(query || statusFilter);
  const count = (status: string) => all.filter((project) => project.status === status).length;
  const chip = (status: string, label: string, total: number) => (
    <Link key={status || "all"} className={`cms-chip${statusFilter === status ? " is-active" : ""}`} href={`/admin/projects${status || query ? `?${[query ? `q=${encodeURIComponent(query)}` : "", status ? `status=${status}` : ""].filter(Boolean).join("&")}` : ""}`}>{label} <span>{total}</span></Link>
  );

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Properties</span>
          <h1>Developments</h1>
          <p>Each development has its own public page. Publish, preview, reorder or archive them here; open one to edit its content.</p>
        </div>
        <Link className="cms-btn" href="/admin/projects/new">New development</Link>
      </div>

      <SavedBanner params={params} />

      <div className="cms-toolbar">
        <form className="cms-search" action="/admin/projects" role="search">
          <input type="search" name="q" defaultValue={first(params.q)} placeholder="Search developments" aria-label="Search developments" />
          {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
          <button className="cms-btn cms-btn--ghost" type="submit">Search</button>
        </form>
        <div className="cms-filter-row" aria-label="Filter by status">
          {chip("", "All", all.length)}
          {chip("PUBLISHED", "Published", count("PUBLISHED"))}
          {chip("DRAFT", "Drafts", count("DRAFT"))}
          {chip("ARCHIVED", "Archived", count("ARCHIVED"))}
        </div>
      </div>

      <div className="cms-dev-grid">
        {projects.map((project, index) => {
          const position = all.findIndex((entry) => entry.id === project.id);
          const returnTo = "/admin/projects";
          return (
            <article className={`cms-dev-card cms-dev-card--${project.status}`} key={project.id}>
              <Link className="cms-dev-card__media" href={`/admin/projects/${project.id}`} aria-label={`Edit ${project.name}`}>
                {project.heroImage ? <img src={project.heroImage} alt="" loading="lazy" /> : <span className="cms-dev-card__placeholder">No hero image yet</span>}
                <span className={`cms-badge cms-badge--${project.status}`}>{statusLabels[project.status] ?? project.status}</span>
              </Link>
              <div className="cms-dev-card__body">
                <span className="cms-eyebrow">{project.location || "Development"}</span>
                <h2><Link href={`/admin/projects/${project.id}`}>{project.name}</Link></h2>
                {project.tagline ? <p className="cms-dev-card__tagline">{project.tagline}</p> : null}
                <p className="cms-muted">{project._count.modules} sections · /developments/{project.slug} · edited {project.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div className="cms-dev-card__actions">
                <Link className="cms-btn cms-btn--small" href={`/admin/projects/${project.id}`}>Edit</Link>
                <Link className="cms-btn cms-btn--ghost cms-btn--small" href={`/admin/preview/developments/${project.slug}`} target="_blank">Preview</Link>
                {project.status === "PUBLISHED" ? <Link className="cms-btn cms-btn--outline cms-btn--small" href={`/developments/${project.slug}`} target="_blank">View live ↗</Link> : null}
                <details className="cms-menu">
                  <summary className="cms-btn cms-btn--ghost cms-btn--small" aria-label={`More actions for ${project.name}`}>More</summary>
                  <div className="cms-menu__panel">
                    {project.status !== "PUBLISHED" ? <form action={setProjectStatus}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value="PUBLISHED" /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit">Publish</button></form> : null}
                    {project.status === "PUBLISHED" ? <form action={setProjectStatus}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value="DRAFT" /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit">Unpublish (back to draft)</button></form> : null}
                    {project.status !== "ARCHIVED" ? <form action={setProjectStatus}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value="ARCHIVED" /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit">Archive</button></form> : <form action={setProjectStatus}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value="DRAFT" /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit">Restore as draft</button></form>}
                    <form action={duplicateProject}><input type="hidden" name="id" value={project.id} /><ConfirmButton message={`Copy “${project.name}” and all its sections as a new draft?`}>Duplicate</ConfirmButton></form>
                    {!filtered ? <>
                      <form action={moveProject}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="direction" value="up" /><button type="submit" disabled={position === 0}>Move earlier</button></form>
                      <form action={moveProject}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="direction" value="down" /><button type="submit" disabled={position === all.length - 1}>Move later</button></form>
                    </> : null}
                  </div>
                </details>
              </div>
              <span className="cms-dev-card__order" title="Position in the order used on the site">{index + 1}</span>
            </article>
          );
        })}
      </div>

      {projects.length === 0 ? (
        <div className="cms-card cms-empty">
          {all.length === 0 ? <>
            <span className="cms-eyebrow">Get started</span>
            <h2>Create your first development</h2>
            <p>Start with the standard sections (overview, location, tour, amenities, floor plans, payment plan) and fill them in.</p>
            <Link className="cms-btn" href="/admin/projects/new">New development</Link>
          </> : <>
            <h2>No developments match</h2>
            <p>Try a different search or <Link href="/admin/projects">clear the filters</Link>.</p>
          </>}
        </div>
      ) : null}
    </>
  );
}
