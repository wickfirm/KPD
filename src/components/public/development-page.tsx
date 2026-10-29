import type { ReactNode } from "react";
import type { ProjectShell } from "@/lib/legacy-project";
import type { ProjectChrome } from "@/lib/project-chrome";
import { textStyleProps } from "@/lib/text-style";
import { DevelopmentModule } from "./development-template";
import { BrochureRequest } from "./brochure-request";
import { developmentSlots } from "@/lib/project-chrome";
import { mortgageCalculatorHtml, mortgageCalculatorSectionProps } from "@/lib/mortgage-calculator-html";

export type DevelopmentProject = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  heroImage: string | null;
  heroVideo?: string | null;
  status: string;
  profile: string;
  modules: { id: string; slug: string; title: string; kind: string; content: unknown }[];
  chrome?: ProjectChrome;
};

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The delivered closing band. It sits immediately after the calculator.
function PrivateViewing({ chrome }: { chrome?: ProjectChrome }) {
  if (chrome?.enquireVisible === false) return null;
  const heading = chrome?.enquireHeading || "Arrange a private\nviewing.";
  const text = chrome?.enquireText || "Floor plans, pricing, and availability are shared through a single appointment-led conversation.";
  const image = chrome?.enquireImage || "/legacy/assets/images/experience-center/hq/15.jpg";
  const secondaryUrl = chrome?.enquireSecondaryUrl || "/contact";
  return (
    <section className="projects-spec-contact single-project-enquire" aria-label={chrome?.enquireEyebrow || "Arrange a private viewing"}>
      <img src={image} alt="Private viewing and advisory workspace" />
      <div className="projects-spec-contact-copy motion-reveal">
        <span>{chrome?.enquireEyebrow || "Enquire"}</span>
        <h2>{multiline(heading)}</h2>
        <p>{text}</p>
        <div className="projects-spec-contact-actions">
          {chrome?.enquirePrimaryUrl ? <a href={chrome.enquirePrimaryUrl}>{chrome?.enquirePrimaryLabel || "Book a viewing"}</a> : <button type="button" data-booking-open>{chrome?.enquirePrimaryLabel || "Book a viewing"}</button>}
          <a href={secondaryUrl}>{chrome?.enquireSecondaryLabel || "Register interest"}</a>
        </div>
      </div>
    </section>
  );
}

/// The development page <main>: hero and overview render from the project row,
/// then each CMS module renders through DevelopmentModule. Content fields have
/// no delivered fallback: deleting them in the CMS deletes them from the page.
export function DevelopmentMain({ project, shell }: { project: DevelopmentProject; shell: ProjectShell }) {
  return (
    <main className="single-project-main" id="top">
      <section className="single-project-hero pdf-hero" aria-label={`${project.name} introduction`}>
        {project.heroVideo ? <video src={project.heroVideo} poster={project.heroImage ?? undefined} autoPlay muted loop playsInline preload="metadata" aria-label={`${project.name} presentation`} /> : project.heroImage ? <img src={project.heroImage} alt={project.name} /> : null}
        <div className="page-hero-content"><h1 style={textStyleProps(project.chrome?.nameStyle)}>{project.name}</h1></div>
      </section>

      <section className="single-project-intro kpd-section" id="overview">
        <div className="single-project-intro-grid single-project-intro-grid--pdf">
          {project.heroImage ? <figure className="single-project-sketch single-project-intro-media"><img src={project.heroImage} alt={`${project.name} exterior`} /></figure> : null}
          <div className="single-project-intro-copy">
            <h1 style={textStyleProps(project.chrome?.taglineStyle)}>{multiline(project.tagline ?? "")}</h1>
            <p style={textStyleProps(project.chrome?.descriptionStyle)}>{project.description ?? ""}</p>
            {project.chrome?.ctaVisible === false && project.chrome?.brochureVisible === false ? null : <div className="single-project-actions">
              {project.chrome?.ctaVisible === false ? null : <a className="btn-pill" href={project.chrome?.ctaUrl || "#amenities"}>{project.chrome?.ctaLabel || "Explore"}</a>}
              {project.chrome?.brochureVisible === false ? null : <BrochureRequest projectName={project.name} projectSlug={project.slug} label={project.chrome?.brochureLabel || "Download brochure"} />}
            </div>}
          </div>
        </div>
      </section>

      {developmentSlots(project.modules, project.chrome?.calculatorIndex).map((slot) => (
        slot === "calculator"
          ? <div key="calculator">
            <section {...mortgageCalculatorSectionProps} dangerouslySetInnerHTML={{ __html: mortgageCalculatorHtml }} />
            <PrivateViewing chrome={project.chrome} />
          </div>
          : <DevelopmentModule
            key={slot.id}
            module={{ slug: slot.slug, title: slot.title, kind: slot.kind, content: slot.content }}
            projectName={project.name}
            shell={{ meydanFigure: shell.meydanFigure, calmFigure: shell.calmFigure, locationShell: shell.locationShell }}
          />
      ))}

    </main>
  );
}
