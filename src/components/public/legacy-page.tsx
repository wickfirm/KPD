import type { CSSProperties, ReactNode } from "react";
import { legacyDefaults, type LegacyContent, type LegacyMilestone } from "@/lib/legacy-defaults";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The <main> content of the Legacy page as real React — a 1:1 port of the
/// delivered markup (public/legacy/legacy.html). Any number of milestones is
/// supported; years alternate left/right exactly like the delivered design.
export function LegacyMain({ content }: { content: LegacyContent }) {
  const heading = content.heading ?? legacyDefaults.heading;
  const text = content.text ?? legacyDefaults.text;
  const image = content.image ?? legacyDefaults.image;
  const milestones = content.timeline?.length ? content.timeline : legacyDefaults.timeline;
  return (
    <main className="legacy-main page-reference-main" id="top">
      <section className="page-reference-hero" aria-label="Legacy">
        <img src={image} alt="Tokyo alleyway and Japanese hospitality context" />
        <div className="page-reference-hero-copy motion-reveal">
          <span>Legacy</span>
          <h1>{multiline(heading)}</h1>
          <p>{multiline(text)}</p>
        </div>
      </section>
      <section className="legacy-timeline-section kpd-section" id="legacy-timeline" aria-label="Legacy milestones">
        <div className="legacy-timeline">
          {milestones.map((milestone, index) => {
            const side = index % 2 ? "right" : "left";
            const active = index === 0;
            return (
              <div key={index} className={`legacy-timeline-row is-${side}${active ? " is-expanded" : ""}`} style={active ? ({ "--legacy-media-height": "420px" } as CSSProperties) : undefined}>
                <details className={`legacy-timeline-item timeline-item is-${side}${active ? " is-expanded" : ""}`} open={active}>
                  <summary>
                    <span className="legacy-year">{milestone.year ?? ""}</span>
                    <span className="legacy-summary-copy">
                      <strong>{milestone.title ?? ""}</strong>
                      <span>{milestone.summary ? multiline(milestone.summary) : ""}</span>
                    </span>
                  </summary>
                  {milestone.body ? <div className="legacy-timeline-body"><p>{multiline(milestone.body)}</p></div> : null}
                </details>
                <figure className="legacy-timeline-media">
                  <img src={milestone.image ?? ""} alt={`Legacy milestone ${milestone.year ?? ""}`} />
                </figure>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
