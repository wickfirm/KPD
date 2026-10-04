import type { Project, ProjectModule } from "@prisma/client";
import Link from "next/link";
import type { ProjectShell } from "@/lib/legacy-project";
import { DevelopmentModule } from "./development-template";

export type DevelopmentProject = Project & { modules: ProjectModule[] };

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string) {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The development page <main>: hero and overview render from the project row,
/// each CMS module renders through DevelopmentModule, and the planner plus the
/// enquire band close the page exactly as delivered.
export function DevelopmentMain({ project, shell }: { project: DevelopmentProject; shell: ProjectShell }) {
  return (
    <main className="single-project-main" id="top">
      <section className="single-project-hero pdf-hero" aria-label={`${project.name} video introduction`}>
        <video src={shell.heroVideo} poster={project.heroImage ?? shell.heroPoster} autoPlay muted playsInline preload="metadata" aria-label={`${project.name} project film`} />
        <div className="page-hero-content"><h1>{project.name}</h1></div>
        <button className="single-project-play" type="button" aria-label="Play project film" />
      </section>

      <section className="single-project-intro kpd-section" id="overview">
        <div className="single-project-intro-grid single-project-intro-grid--pdf">
          {shell.overviewFigure ? <div dangerouslySetInnerHTML={{ __html: shell.overviewFigure }} /> : null}
          <div className="single-project-intro-copy">
            <h1>{multiline(project.tagline || shell.overviewHeading)}</h1>
            <p>{project.description || shell.overviewText}</p>
            <div className="single-project-actions">
              <a className="btn-pill" href="#amenities">Explore</a>
              <a className="btn-pill" href={`mailto:info@kpd.ae?subject=${encodeURIComponent(`${project.name} Brochure Request`)}`}>Brochure</a>
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

      <section className="kpd-section ownership-planner-section ownership-planner-section--project" aria-label="Ownership Cost Planner">
        <div data-kpd-planner data-planner-compact="true" data-planner-project={project.slug} />
      </section>

      <section className="projects-spec-contact single-project-enquire" aria-label="Arrange a private viewing">
        <img src="/legacy/assets/images/experience-center/hq/15.jpg" alt="Private viewing and advisory workspace" />
        <div className="projects-spec-contact-copy motion-reveal">
          <span>Enquire</span>
          <h2>Arrange a private<br />viewing.</h2>
          <p>Floor plans, pricing, and availability are shared through a single appointment-led conversation.</p>
          <div className="projects-spec-contact-actions">
            <button type="button" data-booking-open>Book a viewing</button>
            <Link href="/contact">Register interest</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
