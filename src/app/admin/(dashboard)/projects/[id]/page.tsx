import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteProjectModule, importLegacyProjectTemplate, restoreVersion } from "../../actions";
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
      <div><span className="cms-eyebrow">Development editor · {project.location || "Development"}</span><h1>{project.name}</h1><p>Manage the page content, media, and section order from one place.</p></div>
      <div className="cms-actions"><Link className="cms-btn cms-btn--ghost" href="/admin/projects">Back</Link>{project.status === "PUBLISHED" ? <Link className="cms-btn" href={`/developments/${project.slug}`} target="_blank">View public page</Link> : null}</div>
    </div>
    <SavedBanner params={flash} />
    {clientTemplate && !hasClientSections ? <div className="cms-card cms-card--settings"><div className="cms-card-intro"><span className="cms-eyebrow">Client page setup</span><h2>Make this page editable</h2><p>Load the delivered project sections once. You will then edit copy, galleries, plans, and images with clear CMS cards below.</p></div><form action={importLegacyProjectTemplate}><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="slug" value={project.slug} /><button className="cms-btn" type="submit">Load delivered page content</button></form></div> : null}
    <div className="cms-card cms-card--settings"><div className="cms-card-intro"><span className="cms-eyebrow">Page settings</span><h2>Development details</h2><p>These details power the listing card and first view of the page. Save them with the button below — each content section further down saves on its own.</p></div><ProjectForm defaults={project} /></div>
    <div className="cms-section-heading"><div><span className="cms-eyebrow">Page builder</span><h2>Content sections</h2><p>These sections appear on the public development page in the order below. Open a section, make your changes, then use that section&apos;s own Save button — sections are saved one at a time.</p></div><span className="cms-section-count">{project.modules.length} sections</span></div>
    {project.modules.map((module, index) => {
      const versions = versionsByModule.get(module.id) ?? [];
      return <details className="cms-module-disclosure" key={module.id} open={index === 0}>
        <summary className="cms-module-card__header"><div className="cms-module-title"><span className="cms-module-order">{module.sortOrder}</span><div><h3>{module.title}</h3><span className="cms-badge">{module.kind.replace("_", " ")}</span></div></div><span className="cms-edit-affordance">Edit <span aria-hidden="true">⌄</span></span></summary>
        <div className="cms-module-body"><div className="cms-module-toolbar"><p>Update this section, then save when you&apos;re ready.</p><form action={deleteProjectModule}><input type="hidden" name="id" value={module.id} /><input type="hidden" name="projectId" value={project.id} /><ConfirmButton className="cms-text-button cms-text-button--danger" message={`Delete the section “${module.title}”? You can bring it back later by restoring an older version in its history.`}>Delete section</ConfirmButton></form><ModuleForm projectId={project.id} defaults={{ ...module, content: module.content as { text?: string; images?: string[]; items?: { label?: string; value?: string; image?: string; url?: string }[]; url?: string; mapUrl?: string; presentation?: string } }} /></div>
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
    <div className="cms-card cms-add-section"><span className="cms-eyebrow">Extend the page</span><h2>Add a new content section</h2><p>Choose a section type, then add its copy and media.</p><ModuleForm projectId={project.id} /></div>
    <VersionHistory entityType="PROJECT" entityId={project.id} entityLabel={project.name} />
  </div>;
}
