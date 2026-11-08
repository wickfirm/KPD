import type { ReactNode } from "react";
import Link from "next/link";
import { aboutDefaults, type AboutContent, type AboutKeyFact } from "@/lib/about-defaults";
import { textStyleProps } from "@/lib/text-style";
import { emphasisNodes } from "@/lib/emphasis";
import { splitLead, valueCard } from "@/lib/about-layout";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// undefined → the Gallery-light default, "" → hidden, anything else → itself.
function field(value: string | undefined, fallback: string): string {
  return value === undefined ? fallback : value;
}

/// Internal links use next/link; anything else (mailto:, tel:, https:) is a plain anchor.
function ButtonLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith("/") && !href.startsWith("//")) return <Link className={className} href={href}>{children}</Link>;
  return <a className={className} href={href}>{children}</a>;
}

/// The <main> content of the About page: the client-approved Option 2.1
/// "Gallery light" layout over the same CMS content as before. Every class is
/// g21-prefixed and every rule is scoped under main.g21 (redesign-pages.css),
/// so delivered site.css rules for the old About markup no longer apply and
/// nothing else on the site changes.
export function AboutMain({ content }: { content: AboutContent }) {
  const heading = content.heading ?? "";
  const sectionHeading = content.sectionHeading ?? "";
  const heroText = content.heroText ?? "";
  const heroImage = content.heroImage ?? "";
  const story = content.story?.filter(Boolean) ?? [];
  const [storyLead = "", ...valueParagraphs] = story;
  const mission = splitLead(content.mission ?? "");
  const vision = splitLead(content.vision ?? "");
  const chairmanText = content.chairmanText ?? "";
  const chairmanName = content.chairmanName ?? "";
  const chairmanRole = content.chairmanRole ?? "";
  const chairmanImage = content.chairmanImage ?? "";
  const ceoText = content.ceoText ?? aboutDefaults.ceoText;
  const ceoName = content.ceoName ?? aboutDefaults.ceoName;
  const ceoRole = content.ceoRole ?? aboutDefaults.ceoRole;
  const ceoImage = content.ceoImage ?? aboutDefaults.ceoImage;
  const management = content.management ?? [];
  const eyebrow = content.eyebrow === "" ? "" : content.eyebrow ?? "About";

  const heroCtaLabel = field(content.heroCtaLabel, aboutDefaults.heroCtaLabel);
  const heroCtaUrl = field(content.heroCtaUrl, aboutDefaults.heroCtaUrl) || "/legacy";
  const heroSecondaryLabel = field(content.heroSecondaryLabel, aboutDefaults.heroSecondaryLabel);
  const heroSecondaryUrl = field(content.heroSecondaryUrl, aboutDefaults.heroSecondaryUrl);
  const keyFacts = (content.keyFacts ?? aboutDefaults.keyFacts).filter((fact: AboutKeyFact) => fact.label || fact.value);
  const philosophyKicker = field(content.philosophyKicker, aboutDefaults.philosophyKicker);
  const leadershipKicker = field(content.leadershipKicker, aboutDefaults.leadershipKicker);
  const leadershipHeading = field(content.leadershipHeading, aboutDefaults.leadershipHeading);
  const teamKicker = field(content.teamKicker, aboutDefaults.teamKicker);
  const teamHeading = field(content.teamHeading, aboutDefaults.teamHeading);
  const visitKicker = field(content.visitKicker, aboutDefaults.visitKicker);
  const visitHeading = field(content.visitHeading, aboutDefaults.visitHeading);
  const visitText = field(content.visitText, aboutDefaults.visitText);
  const visitImage = field(content.visitImage, aboutDefaults.visitImage);
  const visitCtaLabel = field(content.visitCtaLabel, aboutDefaults.visitCtaLabel);
  const visitLinkLabel = field(content.visitLinkLabel, aboutDefaults.visitLinkLabel);
  const visitLinkUrl = field(content.visitLinkUrl, aboutDefaults.visitLinkUrl) || "/contact";

  const leaders = [
    { text: chairmanText, name: chairmanName, role: chairmanRole, image: chairmanImage, style: textStyleProps(content.chairmanStyle) },
    { text: ceoText, name: ceoName, role: ceoRole, image: ceoImage, style: undefined },
  ].filter((leader) => leader.text || leader.name);

  return (
    <main className="about-main g21" id="top">
      <section className="g21-hero" aria-labelledby="g21-about-title">
        <div className="g21-wrap">
          {eyebrow ? <nav className="g21-crumbs g21-cap" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{eyebrow}</span></nav> : null}
          <div className="g21-title">
            <h1 id="g21-about-title" style={textStyleProps(content.headingStyle)}>{emphasisNodes(heading)}</h1>
            <div>
              {heroText ? <p className="g21-lede" style={textStyleProps(content.heroTextStyle)}>{multiline(heroText)}</p> : null}
              {heroCtaLabel || heroSecondaryLabel ? <div className="g21-ctas">
                {heroCtaLabel ? <ButtonLink className="g21-btn" href={heroCtaUrl}>{heroCtaLabel} <span className="g21-ar" aria-hidden="true">→</span></ButtonLink> : null}
                {heroSecondaryLabel ? (heroSecondaryUrl
                  ? <ButtonLink className="g21-btn g21-btn--line" href={heroSecondaryUrl}>{heroSecondaryLabel}</ButtonLink>
                  : <button className="g21-btn g21-btn--line" type="button" data-booking-open="">{heroSecondaryLabel}</button>) : null}
              </div> : null}
            </div>
          </div>
          {heroImage ? <figure className="g21-hero-img"><img src={heroImage} alt="KPD office workspace with a view over Dubai" /></figure> : null}
          {keyFacts.length ? <dl className="g21-keyfacts" style={{ gridTemplateColumns: `repeat(${Math.min(keyFacts.length, 4)}, minmax(0, 1fr))` }}>
            {keyFacts.map((fact, index) => <div key={index}><dt className="g21-cap">{fact.label}</dt><dd>{fact.value}</dd></div>)}
          </dl> : null}
        </div>
      </section>

      {sectionHeading || story.length ? <section className="g21-pad" id="about" aria-labelledby="g21-philosophy-title">
        <div className="g21-wrap">
          <div className="g21-sec-top">
            <div>
              {philosophyKicker ? <span className="g21-cap">{philosophyKicker}</span> : null}
              <h2 id="g21-philosophy-title" style={textStyleProps(content.sectionHeadingStyle)}>{emphasisNodes(sectionHeading)}</h2>
            </div>
            {storyLead ? <p className="g21-muted g21-sec-note" style={textStyleProps(content.storyStyle)}>{multiline(storyLead)}</p> : null}
          </div>
          {valueParagraphs.length ? <div className="g21-values">
            {valueParagraphs.map((paragraph, index) => {
              const card = valueCard(paragraph, index);
              return <article className="g21-val" key={index}>
                <span className="g21-cap">{card.cap}</span>
                {card.title ? <h3>{card.title}</h3> : null}
                <p style={textStyleProps(content.storyStyle)}>{multiline(card.text)}</p>
              </article>;
            })}
          </div> : null}
        </div>
      </section> : null}

      {mission.lead || vision.lead ? <section className="g21-pad g21-band" id="mission" aria-labelledby="g21-mv-title">
        <div className="g21-wrap">
          <h2 className="g21-sr" id="g21-mv-title">Mission and vision</h2>
          <div className="g21-mv">
            {mission.lead ? <article><span className="g21-cap">Our mission</span><p className="g21-big" style={textStyleProps(content.missionVisionStyle)}>{multiline(mission.lead)}</p>{mission.rest ? <p className="g21-muted">{multiline(mission.rest)}</p> : null}</article> : null}
            {vision.lead ? <article><span className="g21-cap">Our vision</span><p className="g21-big" style={textStyleProps(content.missionVisionStyle)}>{multiline(vision.lead)}</p>{vision.rest ? <p className="g21-muted">{multiline(vision.rest)}</p> : null}</article> : null}
          </div>
        </div>
      </section> : null}

      {leaders.length ? <section className="g21-pad" id="chairman" aria-labelledby={leadershipHeading ? "g21-leadership-title" : undefined} aria-label={leadershipHeading ? undefined : "Leadership"}>
        <div className="g21-wrap">
          {leadershipKicker || leadershipHeading ? <div className="g21-sec-top"><div>
            {leadershipKicker ? <span className="g21-cap">{leadershipKicker}</span> : null}
            {leadershipHeading ? <h2 id="g21-leadership-title">{emphasisNodes(leadershipHeading)}</h2> : null}
          </div></div> : null}
          <div className="g21-leaders">
            {leaders.map((leader, index) => <figure className="g21-leader" key={index} id={index === 1 ? "ceo" : undefined}>
              <div className="g21-leader-img">{leader.image ? <img src={leader.image} alt={leader.name ? `${leader.name}, ${leader.role}` : `${leader.role} portrait`} loading="lazy" /> : null}</div>
              {leader.text ? <blockquote><p style={leader.style}>{multiline(leader.text)}</p></blockquote> : null}
              <figcaption>{leader.name ? <b>{leader.name}</b> : null}{leader.role ? <span className="g21-cap">{leader.role}</span> : null}</figcaption>
            </figure>)}
          </div>
        </div>
      </section> : null}

      {management.length ? <section className="g21-pad g21-pad--flush" id="management" aria-labelledby="g21-team-title">
        <div className="g21-wrap">
          <div className="g21-sec-top"><div>
            {teamKicker ? <span className="g21-cap">{teamKicker}</span> : null}
            <h2 id="g21-team-title">{teamHeading ? emphasisNodes(teamHeading) : "Executive Management"}</h2>
          </div></div>
          <ul className="g21-team">
            {management.map((person, index) => <li key={index}>
              {person.image ? <img src={person.image} alt="" loading="lazy" /> : <span className="g21-team-blank" aria-hidden="true" />}
              <b>{person.name ?? ""}</b>
              <span>{person.role ?? ""}</span>
            </li>)}
          </ul>
        </div>
      </section> : null}

      {visitHeading ? <section className="g21-visit" aria-labelledby="g21-visit-title">
        {visitImage ? <img src={visitImage} alt="" loading="lazy" /> : null}
        <div className="g21-wrap g21-visit-in">
          {visitKicker ? <p className="g21-cap">{visitKicker}</p> : null}
          <h2 id="g21-visit-title">{emphasisNodes(visitHeading)}</h2>
          {visitText ? <p>{multiline(visitText)}</p> : null}
          {visitCtaLabel || visitLinkLabel ? <div className="g21-ctas">
            {visitCtaLabel ? <button className="g21-btn g21-btn--white" type="button" data-booking-open="">{visitCtaLabel} <span className="g21-ar" aria-hidden="true">→</span></button> : null}
            {visitLinkLabel ? <ButtonLink className="g21-btn g21-btn--ghost" href={visitLinkUrl}>{visitLinkLabel}</ButtonLink> : null}
          </div> : null}
        </div>
      </section> : null}
    </main>
  );
}
