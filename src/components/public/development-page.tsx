import type { ReactNode } from "react";
import Link from "next/link";
import type { ProjectShell } from "@/lib/legacy-project";
import { renderPlannerHtml } from "@/lib/ownership-cost-planner";
import { DevelopmentModule } from "./development-template";
import { RawFigure } from "./raw-figure";
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

const developmentCopy = {
  "seven-x-seven": { overviewCta: "Explore", closingHeading: "Find your balance.", closingText: "Floor plans, pricing and availability are shared in one private conversation." },
  "emerald-villa": { overviewCta: "Explore Villa 174", closingHeading: "See it in private.", closingText: "Floor plans, pricing and availability are shared in one appointment-led conversation." },
  "dubai-hills-mansion": { overviewCta: "Explore", closingHeading: "See the scale in person.", closingText: "Plans, pricing and availability can be reviewed against the scale of the residence in a dedicated appointment." },
} as const;

/// The development page <main>: hero and overview render from the project row,
/// each CMS module renders through DevelopmentModule, and the planner plus the
/// enquire band close the page exactly as delivered.
export function DevelopmentMain({ project, shell, plannerHtml }: { project: DevelopmentProject; shell: ProjectShell; plannerHtml: string }) {
  const copy = developmentCopy[project.slug as keyof typeof developmentCopy];
  return (
    <main className="single-project-main" id="top">
      <section className="single-project-hero pdf-hero" aria-label={shell.heroVideo ? `${project.name} video introduction` : `${project.name} introduction`}>
        {shell.heroVideo
          ? <video src={shell.heroVideo} poster={project.heroImage ?? shell.heroPoster} autoPlay muted playsInline preload="metadata" aria-label={`${project.name} project film`} />
          : <img src={project.heroImage ?? shell.heroPoster} alt={project.name} />}
        <div className="page-hero-content"><h1>{project.name}</h1></div>
        {shell.heroVideo ? <button className="single-project-play" type="button" aria-label="Play project film" /> : null}
      </section>

      <section className="single-project-intro kpd-section" id="overview">
        <div className="single-project-intro-grid single-project-intro-grid--pdf">
          {shell.overviewFigure ? <RawFigure html={shell.overviewFigure} /> : null}
          <div className="single-project-intro-copy">
            <h1>{multiline(project.tagline || shell.overviewHeading)}</h1>
            <p>{project.description || shell.overviewText}</p>
            <div className="single-project-actions">
              <a className="btn-pill" href="#amenities">{copy?.overviewCta ?? "Explore"}</a>
              <a className="btn-pill" href={`mailto:info@kpd.ae?subject=${encodeURIComponent(`${project.name} Brochure Request`)}`}>Download brochure</a>
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

      <section className="projects-spec-contact single-project-enquire" aria-label={shell.enquire.label}>
        <img src={shell.enquire.image} alt={shell.enquire.alt} />
        <div className="projects-spec-contact-copy motion-reveal">
          <span>Enquire</span>
          <h2>{multiline(copy?.closingHeading ?? shell.enquire.heading)}</h2>
          <p>{copy?.closingText ?? shell.enquire.text}</p>
          <div className="projects-spec-contact-actions">
            <button type="button" data-booking-open>Book a viewing</button>
            <Link href="/contact">Register interest</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
