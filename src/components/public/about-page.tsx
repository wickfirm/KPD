import type { ReactNode } from "react";
import { aboutDefaults, type AboutContent } from "@/lib/about-defaults";
import { textStyleProps } from "@/lib/text-style";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The <main> content of the About page as real React — a port of the
/// delivered markup (public/legacy/about-us.html), including the CEO message.
/// Any number of management cards is supported.
export function AboutMain({ content }: { content: AboutContent }) {
  const heading = content.heading ?? "";
  const sectionHeading = content.sectionHeading ?? "";
  const heroText = content.heroText ?? "";
  const heroImage = content.heroImage ?? "";
  const story = content.story?.filter(Boolean) ?? [];
  const mission = content.mission ?? "";
  const vision = content.vision ?? "";
  const chairmanText = content.chairmanText ?? "";
  const chairmanName = content.chairmanName ?? "";
  const chairmanRole = content.chairmanRole ?? "";
  const chairmanImage = content.chairmanImage ?? "";
  const ceoText = content.ceoText ?? aboutDefaults.ceoText;
  const ceoName = content.ceoName ?? aboutDefaults.ceoName;
  const ceoRole = content.ceoRole ?? aboutDefaults.ceoRole;
  const ceoImage = content.ceoImage ?? aboutDefaults.ceoImage;
  const management = content.management ?? [];
  return (
    <main className="about-main page-reference-main" id="top">
      <section className="page-reference-hero" aria-label="About Kasumigaseki Properties Development">
        {heroImage ? <img src={heroImage} alt="Real estate advisory model presentation" /> : null}
        <div className="page-reference-hero-copy motion-reveal">
          <span>About</span>
          <h1 style={textStyleProps(content.headingStyle)}>{multiline(heading)}</h1>
          <p style={textStyleProps(content.heroTextStyle)}>{multiline(heroText)}</p>
        </div>
      </section>
      <section className="about-story" id="about">
        <div className="about-story-grid">
          <div className="about-story-copy">
            <h2 className="about-story-title">{multiline(sectionHeading)}</h2>
            {story.map((paragraph, index) => <p key={index}>{multiline(paragraph)}</p>)}
          </div>
          <div className="about-story-media">
            {heroImage ? <img src={heroImage} alt="KPD office workspace" /> : null}
          </div>
        </div>
      </section>
      <section className="about-mission-vision" id="mission">
        <article className="about-mission-card"><h2>Our Mission</h2><p>{multiline(mission)}</p></article>
        <article className="about-mission-card"><h2>Our Vision</h2><p>{multiline(vision)}</p></article>
      </section>
      <section className="about-chairman" id="chairman">
        <div className="about-chairman-media">{chairmanImage ? <img src={chairmanImage} alt="Chairman portrait" /> : null}</div>
        <div className="about-chairman-copy">
          <p>{multiline(chairmanText)}</p>
          <div className="about-chairman-signature"><strong>{chairmanName}</strong><span>{chairmanRole}</span></div>
        </div>
      </section>
      {ceoText || ceoName || ceoRole || ceoImage ? <section className="about-ceo" id="ceo">
        <div className="about-ceo-copy">
          {ceoText ? <p>{multiline(ceoText)}</p> : null}
          <div className="about-chairman-signature">{ceoName ? <strong>{ceoName}</strong> : null}{ceoRole ? <span>{ceoRole}</span> : null}</div>
        </div>
        <div className="about-ceo-media">{ceoImage ? <img src={ceoImage} alt={ceoName ? `${ceoName} portrait` : "Chief Executive Officer portrait"} /> : null}</div>
      </section> : null}
      <section className="about-management" id="management">
        <h2>Executive Management</h2>
        <div className="about-management-grid">
          {management.map((person, index) => (
            <article key={index} className="about-management-card" role="button" tabIndex={0} aria-label={`Open biography for ${person.name || `Executive ${index + 1}`}`} data-management-name={person.name ?? ""} data-management-role={person.role ?? ""} data-management-bio={person.bio ?? ""}>
              <figure>
                <div className="about-management-image"><img src={person.image ?? ""} alt="Executive management portrait" /></div>
                <figcaption><strong>{person.name ?? ""}</strong><span>{person.role ?? ""}</span></figcaption>
              </figure>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
