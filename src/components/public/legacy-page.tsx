import type { ReactNode } from "react";
import Link from "next/link";
import { legacyGalleryDefaults, type LegacyContent, type LegacyGalleryLight } from "@/lib/legacy-defaults";
import { textStyleProps } from "@/lib/text-style";
import { sectionFilter } from "@/lib/section-visibility";
import { emphasisNodes } from "@/lib/emphasis";
import { LegacyTimelineRail } from "./legacy-timeline-rail";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

function pick(content: LegacyContent, key: keyof LegacyGalleryLight): string {
  const value = content[key];
  return value === undefined ? legacyGalleryDefaults[key] : value;
}

function ButtonLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith("/") && !href.startsWith("//")) return <Link className={className} href={href}>{children}</Link>;
  const external = /^https?:/i.test(href);
  return <a className={className} href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>{children}</a>;
}

/// The <main> content of the History (Legacy) page: the client-approved
/// Option 2.1 "Gallery light" layout over the same CMS timeline. Classes are
/// g21-prefixed and every rule is scoped under main.g21 (redesign-pages.css),
/// so the delivered timeline script and styles no longer touch this page.
export function LegacyMain({ content, hidden }: { content: LegacyContent; hidden?: readonly string[] }) {
  /// Sections the editor switched off under "Sections on this page".
  const shown = sectionFilter(hidden);
  const heading = content.heading ?? "";
  const lede = content.text?.trim() ? content.text : pick(content, "lede");
  const image = content.image ?? "";
  const milestones = (content.timeline ?? []).filter((item) => item.year || item.title || item.summary || item.body || item.image);
  const anchors = milestones.map((item, index) => {
    const year = (item.year ?? "").trim() || String(index + 1);
    const first = milestones.findIndex((other) => ((other.year ?? "").trim() || "") === (item.year ?? "").trim());
    return first === index ? `y${year.replace(/[^\w-]/g, "")}` : `y${year.replace(/[^\w-]/g, "")}-${index}`;
  });
  const years = milestones.map((item, index) => ({ year: (item.year ?? "").trim(), anchor: anchors[index] }))
    .filter((entry, index, all) => entry.year && all.findIndex((other) => other.year === entry.year) === index);
  const firstYear = years[0];
  const mapUrl = content.ctaUrl ?? "https://map.kasumigaseki.ae/";
  const mapLabel = pick(content, "mapLabel");
  const startLabel = pick(content, "startLabel");
  const learnVisible = content.ctaVisible !== false && Boolean(content.ctaUrl);
  const learnLabel = content.ctaLabel || "Learn more";
  const nameKicker = pick(content, "nameKicker");
  const nameHeading = pick(content, "nameHeading");
  const nameText = pick(content, "nameText").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const bandHeading = pick(content, "bandHeading");
  const bandKicker = pick(content, "bandKicker");
  const bandText = pick(content, "bandText");
  const bandImage = pick(content, "bandImage");
  const bandLinkLabel = pick(content, "bandLinkLabel");
  const bandLinkUrl = pick(content, "bandLinkUrl") || "/about";

  return (
    <main className="legacy-main g21" id="top">
      {shown("hero") ? <section className="g21-hero" aria-labelledby="g21-history-title">
        <div className="g21-wrap">
          <nav className="g21-crumbs g21-cap" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/about">About</Link><span aria-hidden="true">/</span><span aria-current="page">{content.eyebrow || "History"}</span></nav>
          <div className="g21-title">
            <h1 id="g21-history-title" style={textStyleProps(content.headingStyle)}>{emphasisNodes(heading)}</h1>
            <div>
              {lede ? <p className="g21-lede" style={textStyleProps(content.textStyle)}>{multiline(lede)}</p> : null}
              <div className="g21-ctas">
                {firstYear && startLabel ? <a className="g21-btn" href={`#${firstYear.anchor}`}>{startLabel.replaceAll("{year}", firstYear.year)} <span className="g21-ar g21-ar--down" aria-hidden="true">↓</span></a> : null}
                {mapLabel && mapUrl ? <ButtonLink className="g21-btn g21-btn--line" href={mapUrl}>{mapLabel} <span className="g21-ar" aria-hidden="true">↗</span></ButtonLink> : null}
              </div>
            </div>
          </div>
          {image ? <figure className="g21-hero-img"><img src={image} alt="Tokyo alleyway and Japanese hospitality context" style={{ objectPosition: "50% 45%" }} /></figure> : null}
        </div>
      </section> : null}

      {shown("name") && (nameHeading || nameText.length) ? <section className="g21-pad g21-band" aria-labelledby="g21-name-title">
        <div className="g21-wrap g21-name">
          {nameKicker ? <p className="g21-cap">{nameKicker}</p> : null}
          {nameHeading ? <h2 id="g21-name-title">{emphasisNodes(nameHeading)}</h2> : null}
          {nameText.length ? <div className="g21-name-cols">{nameText.map((paragraph, index) => <p key={index}>{multiline(paragraph)}</p>)}</div> : null}
        </div>
      </section> : null}

      {shown("timeline") && milestones.length ? <>
        {years.length > 1 ? <nav className="g21-subnav" aria-label="Years"><div className="g21-wrap g21-subnav-in">
          {years.map((entry) => <a key={entry.anchor} href={`#${entry.anchor}`}>{entry.year}</a>)}
        </div></nav> : null}
        <section className="g21-pad g21-tl-sec" id="legacy-timeline" aria-labelledby="g21-tl-title">
          <div className="g21-wrap g21-tl">
            <LegacyTimelineRail firstYear={(milestones[0].year ?? "").trim()} />
            <div>
              <h2 className="g21-sr" id="g21-tl-title">Timeline</h2>
              <ol className="g21-ms-list">
                {milestones.map((milestone, index) => <li key={index} id={anchors[index]} data-year={(milestone.year ?? "").trim()} className={index === milestones.length - 1 ? "is-now" : undefined}>
                  <figure className="g21-ms-img">{milestone.image ? <img src={milestone.image} alt={milestone.title || `Milestone ${milestone.year ?? ""}`} loading="lazy" /> : null}</figure>
                  <div>
                    {milestone.year ? <span className="g21-yr">{milestone.year}</span> : null}
                    {milestone.title ? <h3>{milestone.title}</h3> : null}
                    {milestone.summary ? <p>{multiline(milestone.summary)}</p> : null}
                    {milestone.body ? <p className="g21-muted">{multiline(milestone.body)}</p> : null}
                  </div>
                </li>)}
              </ol>
            </div>
          </div>
        </section>
      </> : null}

      {shown("band") && bandHeading ? <section className="g21-visit" aria-labelledby="g21-history-band-title">
        {bandImage ? <img src={bandImage} alt="" loading="lazy" /> : null}
        <div className="g21-wrap g21-visit-in">
          {bandKicker ? <p className="g21-cap">{bandKicker}</p> : null}
          <h2 id="g21-history-band-title">{emphasisNodes(bandHeading)}</h2>
          {bandText ? <p>{multiline(bandText)}</p> : null}
          {learnVisible || bandLinkLabel ? <div className="g21-ctas">
            {learnVisible ? <ButtonLink className="g21-btn g21-btn--white" href={content.ctaUrl as string}>{learnLabel} <span className="g21-ar" aria-hidden="true">↗</span></ButtonLink> : null}
            {bandLinkLabel ? <ButtonLink className="g21-btn g21-btn--ghost" href={bandLinkUrl}>{bandLinkLabel}</ButtonLink> : null}
          </div> : null}
        </div>
      </section> : null}
    </main>
  );
}
