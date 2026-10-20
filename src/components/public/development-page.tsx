import type { ReactNode } from "react";
import type { ProjectShell } from "@/lib/legacy-project";
import { DevelopmentModule } from "./development-template";
import { htmlLf } from "@/lib/html-lf";

export type DevelopmentProject = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  heroImage: string | null;
  status: string;
  profile: string;
  modules: { id: string; slug: string; title: string; kind: string; content: unknown }[];
};

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The development page <main>: hero and overview render from the project row,
/// then each CMS module renders through DevelopmentModule. Content fields have
/// no delivered fallback: deleting them in the CMS deletes them from the page.
export function DevelopmentMain({ project, shell, plannerHtml }: { project: DevelopmentProject; shell: ProjectShell; plannerHtml: string }) {
  return (
    <main className="single-project-main" id="top">
      <section className="single-project-hero pdf-hero" aria-label={`${project.name} introduction`}>
        {project.heroImage ? <img src={project.heroImage} alt={project.name} /> : null}
        <div className="page-hero-content"><h1>{project.name}</h1></div>
      </section>

      <section className="single-project-intro kpd-section" id="overview">
        <div className="single-project-intro-grid single-project-intro-grid--pdf">
          {project.heroImage ? <figure className="single-project-sketch single-project-intro-media"><img src={project.heroImage} alt={`${project.name} exterior`} /></figure> : null}
          <div className="single-project-intro-copy">
            <h1>{multiline(project.tagline ?? "")}</h1>
            <p>{project.description ?? ""}</p>
            <div className="single-project-actions">
              <a className="btn-pill" href="#amenities">Explore</a>
            </div>
          </div>
        </div>
      </section>

      {project.modules.map((module) => (
        <DevelopmentModule
          key={module.id}
          module={{ slug: module.slug, title: module.title, kind: module.kind, content: module.content }}
          projectName={project.name}
          shell={{ meydanFigure: shell.meydanFigure, calmFigure: shell.calmFigure, locationShell: shell.locationShell }}
        />
      ))}

      {plannerHtml ? <section className="kpd-section ownership-planner-section ownership-planner-section--project" aria-label="Ownership Cost Planner">
        <div data-kpd-planner data-planner-compact="true" data-planner-project={project.slug} data-planner-prerendered="true" dangerouslySetInnerHTML={{ __html: htmlLf(plannerHtml) }} />
      </section> : null}

    </main>
  );
}
