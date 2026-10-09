import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteProjectModule, importLegacyProjectTemplate, moveProjectModule, restoreVersion, setProjectStatus } from "../../actions";
import { moduleKindLabels } from "@/lib/project-starter";
import { SectionNav } from "@/components/admin/section-nav";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { legacyProjectTemplates } from "@/lib/legacy-project-templates";
import { MAX_CONTENT_VERSIONS } from "@/lib/versions";
import ProjectForm from "../project-form";
import ModuleForm from "./module-form";
import { SavedBanner } from "@/components/admin/flash";
import VersionHistory from "@/components/admin/version-history";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";

export default async function ProjectEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, flash] = await Promise.all([params, searchParams]);
  const project = await db.project.findUnique({
    where: { id },
    include: { modules: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!project) notFound();
  const clientTemplate = legacyProjectTemplates[project.slug];
  const hasClientSections = clientTemplate?.modules.every((template) => project.modules.some((module) => module.slug === template.slug));

  // Section-level history, fetched once and grouped per module.
  const moduleIds = project.modules.map((module) => module.id);
  const moduleVersions = moduleIds.length
    ? await db.contentVersion.findMany({
        where: { entityType: "PROJECT_MODULE", entityId: { in: moduleIds } },
        orderBy: { versionNumber: "desc" },
      })
    : [];
  const versionsByModule = new Map<string, typeof moduleVersions>();
  for (const version of moduleVersions) {
    const list = versionsByModule.get(version.entityId) ?? [];
    if (list.length < MAX_CONTENT_VERSIONS) list.push(version);
    versionsByModule.set(version.entityId, list);
  }

  return <div className="cms-editor">
    <div className="cms-page-heading">
      <div><span className="cms-eyebrow">Development editor · {project.location || "Development"}</span><h1>{project.name} <span className={`cms-badge cms-badge--${project.status}`}>{project.status === "PUBLISHED" ? "Published" : project.status === "ARCHIVED" ? "Archived" : "Draft"}</span></h1><p>Edit the details and sections of this page. Each section saves on its own; use the list on the right to jump between them.</p></div>
      <div className="cms-actions">
        <Link className="cms-btn cms-btn--ghost" href="/admin/projects">Back</Link>
        <Link className="cms-btn cms-btn--ghost" href={`/admin/preview/developments/${project.slug}`} target="_blank">Preview page</Link>
        {project.status === "PUBLISHED" ? <Link className="cms-btn cms-btn--outline" href={`/developments/${project.slug}`} target="_blank">View live ↗</Link> : null}
        {project.status !== "PUBLISHED" ? <form action={setProjectStatus}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value="PUBLISHED" /><input type="hidden" name="returnTo" value={`/admin/projects/${project.id}`} /><button className="cms-btn" type="submit">Publish</button></form> : <form action={setProjectStatus}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value="DRAFT" /><input type="hidden" name="returnTo" value={`/admin/projects/${project.id}`} /><button className="cms-btn cms-btn--ghost" type="submit">Unpublish</button></form>}
        {project.status !== "ARCHIVED" ? <form action={setProjectStatus}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value="ARCHIVED" /><input type="hidden" name="returnTo" value={`/admin/projects/${project.id}`} /><button className="cms-btn cms-btn--ghost" type="submit">Archive</button></form> : null}
      </div>
    </div>
    <SavedBanner params={flash} />
    <UnsavedGuard />
    <div className="cms-editor-layout">
    <div className="cms-editor-layout__main">
    {clientTemplate && !hasClientSections ? <div className="cms-card cms-card--settings"><div className="cms-card-intro"><span className="cms-eyebrow">Client page setup</span><h2>Make this page editable</h2><p>Load the delivered project sections once. You will then edit copy, galleries, plans, and images with clear CMS cards below.</p></div><form action={importLegacyProjectTemplate}><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="slug" value={project.slug} /><button className="cms-btn" type="submit">Load delivered page content</button></form></div> : null}
    <div className="cms-card cms-card--settings" id="details" data-unsaved-label="Development details"><div className="cms-card-intro"><span className="cms-eyebrow">Page settings</span><h2>Development details</h2><p>The name, introduction and hero image shown on the page and in listings. Save them with the button below; each content section further down saves on its own.</p></div><ProjectForm defaults={project} /></div>
    <div className="cms-section-heading"><div><span className="cms-eyebrow">Page builder</span><h2>Content sections</h2><p>These sections appear on the page in the order below. Open a section, make your changes, then use that section&apos;s own Save button. Use Move up / Move down to change the order.</p></div><span className="cms-section-count">{project.modules.length} sections</span></div>
    {project.modules.map((module, index) => {
      const versions = versionsByModule.get(module.id) ?? [];
      return <details className="cms-module-disclosure" id={`section-${module.id}`} key={module.id} open={index === 0}>
        <summary className="cms-module-card__header"><div className="cms-module-title"><span className="cms-module-order">{index + 1}</span><div><h3>{module.title}</h3><span className="cms-badge">{moduleKindLabels[module.kind]}</span></div></div><span className="cms-edit-affordance">Edit <span aria-hidden="true">⌄</span></span></summary>
        <div className="cms-module-body"><div className="cms-module-toolbar"><p>Update this section, then save when you&apos;re ready.</p><div className="cms-module-toolbar__actions"><form action={moveProjectModule}><input type="hidden" name="id" value={module.id} /><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="direction" value="up" /><button className="cms-btn cms-btn--ghost cms-btn--small" type="submit" disabled={index === 0}>Move up</button></form><form action={moveProjectModule}><input type="hidden" name="id" value={module.id} /><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="direction" value="down" /><button className="cms-btn cms-btn--ghost cms-btn--small" type="submit" disabled={index === project.modules.length - 1}>Move down</button></form></div><form action={deleteProjectModule}><input type="hidden" name="id" value={module.id} /><input type="hidden" name="projectId" value={project.id} /><ConfirmButton className="cms-text-button cms-text-button--danger" message={`Delete the section “${module.title}”? You can bring it back later by restoring an older version in its history.`}>Delete section</ConfirmButton></form><ModuleForm projectId={project.id} defaults={{ ...module, content: module.content as { text?: string; images?: string[]; items?: { label?: string; value?: string; image?: string; url?: string }[]; url?: string; mapUrl?: string; presentation?: string } }} /></div>
          {versions.length > 1 ? <details className="cms-module-history">
            <summary>Version history ({versions.length})</summary>
            <ul>
              {versions.map((version, versionIndex) => (
                <li key={version.id}>
                  <span><strong>v{version.versionNumber}{versionIndex === 0 ? " — current" : ""}</strong> · {version.createdAt.toLocaleString("en-GB")}{version.authorEmail ? ` · ${version.authorEmail}` : ""}</span>
                  {versionIndex !== 0 ? (
                    <form action={restoreVersion}>
                      <input type="hidden" name="versionId" value={version.id} />
                      <ConfirmButton className="cms-text-button" message={`Restore “${module.title}” to version ${version.versionNumber}?`}>Restore</ConfirmButton>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </details> : null}
        </div>
      </details>;
    })}
    <div className="cms-card cms-add-section" id="add-section" data-unsaved-label="New section"><span className="cms-eyebrow">Extend the page</span><h2>Add a new section</h2><p>Choose a section type, then add its copy and media. It is added at the end; move it afterwards.</p><ModuleForm projectId={project.id} /></div>
    <VersionHistory entityType="PROJECT" entityId={project.id} entityLabel={project.name} />
    </div>
    <SectionNav items={[{ id: "details", label: "Development details" }, ...project.modules.map((module) => ({ id: `section-${module.id}`, label: module.title, hint: moduleKindLabels[module.kind] })), { id: "add-section", label: "Add a section" }]} />
    </div>
  </div>;
}
