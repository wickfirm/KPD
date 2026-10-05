import type { ReactNode } from "react";
import { aboutDefaults, type AboutContent } from "@/lib/about-defaults";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The <main> content of the About page as real React â€” a 1:1 port of the
/// delivered markup (public/legacy/about-us.html). The duplicated CEO section
/// from the delivered file is intentionally omitted (client-confirmed), and
/// any number of management cards is supported.
export function AboutMain({ content }: { content: AboutContent }) {
  const heading = content.heading || aboutDefaults.heading;
  const heroText = content.heroText || aboutDefaults.heroText;
  const heroImage = content.heroImage || aboutDefaults.heroImage;
  const story = content.story?.filter(Boolean).length ? content.story.filter(Boolean) : aboutDefaults.story;
  const mission = content.mission || aboutDefaults.mission;
  const vision = content.vision || aboutDefaults.vision;
  const chairmanText = content.chairmanText || aboutDefaults.chairmanText;
  const chairmanName = content.chairmanName || aboutDefaults.chairmanName;
  const chairmanRole = content.chairmanRole || aboutDefaults.chairmanRole;
  const chairmanImage = content.chairmanImage || aboutDefaults.chairmanImage;
  const management = content.management?.length ? content.management : aboutDefaults.management;
  return (
    <main className="about-main page-reference-main" id="top">
      <section className="page-reference-hero" aria-label="About Kasumigaseki Properties Development">
        <img src={heroImage} alt="Real estate advisory model presentation" />
        <div className="page-reference-hero-copy motion-reveal">
          <span>About</span>
          <h1>{multiline(heading)}</h1>
          <p>{multiline(heroText)}</p>
        </div>
      </section>
      <section className="about-story" id="about">
        <div className="about-story-grid">
          <div className="about-story-copy">
            <h2 className="about-story-title">{multiline(heading)}</h2>
            {story.map((paragraph, index) => <p key={index}>{multiline(paragraph)}</p>)}
          </div>
          <div className="about-story-media">
            <img src="/legacy/assets/images/about/pdf/about-pdf-1-2.jpg" alt="KPD office workspace" />
          </div>
        </div>
      </section>
      <section className="about-mission-vision" id="mission">
        <article className="about-mission-card"><h2>Our Mission</h2><p>{multiline(mission)}</p></article>
        <article className="about-mission-card"><h2>Our Vision</h2><p>{multiline(vision)}</p></article>
      </section>
      <section className="about-chairman" id="chairman">
        <div className="about-chairman-media"><img src={chairmanImage} alt="Chairman portrait" /></div>
        <div className="about-chairman-copy">
          <p>{multiline(chairmanText)}</p>
          <div className="about-chairman-signature"><strong>{chairmanName}</strong><span>{chairmanRole}</span></div>
        </div>
      </section>
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
