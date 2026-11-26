import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { DevelopmentProject, CalculatorCopy } from "./development-page";
import { BrochureRequest } from "./brochure-request";
import { DevelopmentAccordion } from "./development-accordion";
import { developmentSlots, projectPageLabelDefaults } from "@/lib/project-chrome";
import { sectionEyebrow } from "@/lib/development-section-labels";
import { moduleSectionId } from "@/lib/module-section-id";
import { mortgageCalculatorHtmlWith, mortgageCalculatorSectionProps } from "@/lib/mortgage-calculator-html";
import { defaultKeyFacts, driveMinutes, mapsLink, parseKeyFacts } from "@/lib/development-gallery-light";
import { textStyleProps, type TextStyle } from "@/lib/text-style";
import { emphasisNodes } from "@/lib/emphasis";
import { sectionFilter } from "@/lib/section-visibility";
import { arrowGlyph, isRtl, localeHref, type Locale } from "@/lib/locales";
import { t, type MessageKey } from "@/lib/i18n";

type ModuleItem = { label?: string; value?: string; text?: string; image?: string; url?: string };
type ModuleContent = { eyebrow?: string; text?: string; images?: string[]; items?: ModuleItem[]; url?: string; ctaLabel?: string; ctaVisible?: boolean; mapUrl?: string; presentation?: string; titleStyle?: TextStyle; textStyle?: TextStyle };
type Module = DevelopmentProject["modules"][number];

const read = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as ModuleContent;

/// Newlines in editor content render as <br>.
function multiline(value: string): ReactNode[] {
  return value.replace(/\r\n/g, "\n").split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// Each section's label in the page bar, by module slug. A null label keeps
/// the section out of the page bar (as in the mock). The small kicker above
/// each section comes from development-section-labels.ts (CMS-editable).
const navFor: Record<string, MessageKey | null> = { "meydan-horizon": null, tour: null, location: "dev.location", amenities: "dev.amenities", brochure: "dev.materials", "floor-plans": "dev.floorPlans", "payment-plan": "dev.payment" };

/// A button that opens the booking form, or follows a link when one is set.
/// An internal link follows the page's language.
function Cta({ url, className, children, external, locale }: { url?: string; className: string; children: ReactNode; external?: boolean; locale: Locale }) {
  if (!url) return <button className={className} type="button" data-booking-open>{children}</button>;
  const href = localeHref(url, locale);
  if (href.startsWith("/") && !href.startsWith("//")) return <Link className={className} href={href}>{children}</Link>;
  return <a className={className} href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>{children}</a>;
}

const arrow = (locale: Locale, glyph = "→") => <span className="g21-ar" aria-hidden="true">{arrowGlyph(locale, glyph)}</span>;
const isExternal = (url?: string) => Boolean(url && /^https?:/i.test(url));

type Kind = "split" | "location" | "tour" | "gallery" | "plans" | "payment";
function kindOf(module: Module, data: ModuleContent): Kind {
  if (module.kind === "GALLERY") return "gallery";
  if (module.kind === "FLOOR_PLAN") return "plans";
  if (module.kind === "LOCATION" || module.kind === "SPECIFICATIONS") return "location";
  if (module.kind === "VIDEO" || module.kind === "BROCHURE") return "tour";
  if (module.slug === "payment-plan" && data.presentation !== "calm") return "payment";
  return "split";
}

/// The development page <main> in the client-approved Option 2.1 "Gallery
/// light" layout. Same data as DevelopmentMain: the project row, its chrome
/// and its CMS modules in their saved order (with the shared calculator in
/// its slot); each module renders by kind.
export function DevelopmentMainG21({ project, calculator, hidden, locale }: { project: DevelopmentProject; calculator?: CalculatorCopy; hidden?: readonly string[]; locale: Locale }) {
  /// Sections the editor switched off under "Sections on this page".
  const shown = sectionFilter(hidden);
  const chrome = project.chrome ?? {};
  const facts = parseKeyFacts(chrome.keyFacts ?? defaultKeyFacts(project.slug));
  const slots = developmentSlots(project.modules, chrome.calculatorIndex).filter((slot) => (slot === "calculator" ? shown("calculator") : shown(`module:${slot.id}`)));
  const primaryLabel = chrome.enquirePrimaryLabel || t(locale, "dev.bookViewing");
  const bookLabel = chrome.bookLabel || primaryLabel;
  const bookUrl = chrome.bookUrl || chrome.enquirePrimaryUrl;
  /// Page labels: undefined keeps the approved wording, "" hides the label.
  const pageLabel = (key: keyof typeof projectPageLabelDefaults) => chrome.labels?.[key] ?? projectPageLabelDefaults[key];

  /// Background bands: split sections and the calculator sit on stone,
  /// everything else is white (split images alternate sides). A white section that
  /// follows another white one drops its top padding, as in the mock.
  let splitIndex = 0;
  const plan = slots.map((slot) => {
    if (slot === "calculator") return { slot, band: true, kind: "calculator" as const, rev: false };
    const data = read(slot.content);
    const kind = kindOf(slot, data);
    const rev = kind === "split" ? splitIndex % 2 === 0 : false;
    const band = kind === "split";
    if (kind === "split") splitIndex += 1;
    return { slot, band, kind, rev };
  });

  const sections = plan.map((entry, index) => {
    const previousWhite = index === 0 ? true : !plan[index - 1].band;
    const tone = entry.band ? " g21-band" : previousWhite ? " g21-pad--flush" : "";
    if (entry.slot === "calculator") return <section key="calculator" {...mortgageCalculatorSectionProps} className={`${mortgageCalculatorSectionProps.className} g21-calc g21-pad g21-band`} id="calculator">
      <div className="g21-wrap">{pageLabel("calculator") ? <span className="g21-cap g21-calc-cap">{pageLabel("calculator")}</span> : null}<div dangerouslySetInnerHTML={{ __html: mortgageCalculatorHtmlWith(calculator) }} /></div>
    </section>;

    const module = entry.slot;
    const data = read(module.content);
    const id = moduleSectionId(module.slug);
    const titleId = `g21-${id}-title`;
    const cap = sectionEyebrow(module.slug, data.eyebrow);
    const titleStyle = textStyleProps(data.titleStyle);
    const textStyle = textStyleProps(data.textStyle);
    const images = data.images ?? [];
    const items = data.items ?? [];
    const title = module.title ? <h2 id={titleId} style={titleStyle}>{multiline(module.title)}</h2> : null;
    const text = data.text ? <p className="g21-muted" style={textStyle}>{multiline(data.text)}</p> : null;
    const sectionProps = { id, "aria-labelledby": module.title ? titleId : undefined, "aria-label": module.title ? undefined : cap || t(locale, "dev.section") };

    if (entry.kind === "location") {
      const places = items.map((item) => ({ name: item.label || item.text || "", time: item.value || "", minutes: driveMinutes(item.value || "") })).filter((place) => place.name);
      const timed = places.every((place) => Number.isFinite(place.minutes));
      const sorted = timed ? [...places].sort((a, b) => a.minutes - b.minutes) : places;
      const max = timed && sorted.length ? Math.max(5, Math.ceil(sorted[sorted.length - 1].minutes / 5) * 5) : 0;
      const step = max > 30 ? 10 : 5;
      const ticks = max ? Array.from({ length: Math.floor(max / step) + 1 }, (_, tick) => tick * step) : [];
      return <section key={module.id} className={`g21-pad${tone}`} {...sectionProps}>
        <div className="g21-wrap">
          <div className="g21-sec-top">
            <div>{cap ? <span className="g21-cap">{cap}</span> : null}{title}{data.text ? <p className="g21-muted g21-sec-sub" style={textStyle}>{multiline(data.text)}</p> : null}</div>
            {data.mapUrl ? <a className="g21-btn g21-btn--line" href={mapsLink(data.mapUrl)} target="_blank" rel="noopener">{t(locale, "dev.openInGoogleMaps")} {arrow(locale, "↗")}</a> : null}
          </div>
          {timed && ticks.length ? <div className="g21-scale" aria-hidden="true">{ticks.map((tick, tickIndex) => <span key={tickIndex} style={isRtl(locale) ? { right: `${(tick / max) * 100}%` } : { left: `${(tick / max) * 100}%` }}>{tick === 0 ? "0" : t(locale, "dev.minutes", { number: tick })}</span>)}</div> : null}
          {sorted.length ? <ol className="g21-drive">{sorted.map((place, placeIndex) => <li key={`${place.name}-${placeIndex}`}>
            <span>{place.name}</span>
            {timed ? <span className="g21-bar" aria-hidden="true"><span style={{ width: `${(place.minutes / max) * 100}%` }} /></span> : <span />}
            <em>{place.time}</em>
          </li>)}</ol> : null}
          {sorted.length && pageLabel("driveNote") ? <p className="g21-cap g21-drive-note">{pageLabel("driveNote").replaceAll("{name}", project.name)}</p> : null}
        </div>
      </section>;
    }

    if (entry.kind === "tour") {
      const showCta = data.ctaVisible !== false;
      const label = data.ctaLabel || (module.kind === "VIDEO" && data.url ? t(locale, "dev.startTour") : module.kind === "BROCHURE" && data.url ? t(locale, "dev.download") : t(locale, "dev.explore"));
      return <section key={module.id} className={`g21-pad${tone}`} {...sectionProps}>
        <div className="g21-wrap">
          <div className="g21-tour">
            {images[0] ? <img src={images[0]} alt={t(locale, "dev.figureAlt", { name: project.name, title: module.title })} loading="lazy" /> : null}
            <div className="g21-tour-card">
              {cap ? <p className="g21-cap">{cap}</p> : null}{title}{data.text ? <p style={textStyle}>{multiline(data.text)}</p> : null}
              {showCta ? <Cta className="g21-btn" url={data.url || "#amenities"} external={isExternal(data.url)} locale={locale}>{label} {arrow(locale, isExternal(data.url) ? "↗" : "→")}</Cta> : null}
            </div>
          </div>
        </div>
      </section>;
    }

    if (entry.kind === "gallery") {
      const panels = images.map((image, imageIndex) => ({ image, label: items[imageIndex]?.label || module.title }));
      return <section key={module.id} className={`g21-pad${tone}`} {...sectionProps}>
        <div className="g21-wrap">
          <div className="g21-ec-head"><div>{cap ? <span className="g21-cap">{cap}</span> : null}{title}</div>{text}</div>
          {panels.length ? <DevelopmentAccordion panels={panels} /> : null}
        </div>
      </section>;
    }

    if (entry.kind === "plans") {
      const cards: ModuleItem[] = [...items, ...images.map((image, imageIndex) => ({ image, label: t(locale, "dev.plan", { number: items.length + imageIndex + 1 }) }))];
      const ctaLabel = data.ctaLabel || t(locale, "brochure.downloadFloorPlans");
      return <section key={module.id} className={`g21-pad${tone}`} {...sectionProps}>
        <div className="g21-wrap">
          <div className="g21-ec-head">
            <div>{cap ? <span className="g21-cap">{cap}</span> : null}{title}</div>
            <div className="g21-plans-note">{text}{data.ctaVisible !== false ? <div className="g21-ctas"><Cta className="g21-btn g21-btn--line" url={data.url} external={isExternal(data.url)} locale={locale}>{ctaLabel} {arrow(locale)}</Cta></div> : null}</div>
          </div>
          {cards.length ? <div className="g21-plans">{cards.map((card, cardIndex) => {
            const label = card.label ?? t(locale, "dev.plan", { number: cardIndex + 1 });
            return <article className="g21-plan" key={`${card.label}-${cardIndex}`}>
            {card.image ? <img src={card.image} alt={t(locale, "dev.floorPlanAlt", { name: project.name, label })} loading="lazy" /> : null}
            <p className="g21-cap">{label}</p>
            {card.value ? <p className="g21-plan-size">{card.value}</p> : null}
            <Cta className="g21-txt-link" url={card.url} external={isExternal(card.url)} locale={locale}>{card.url ? t(locale, "dev.download") : t(locale, "brochure.requestPlan")} <span aria-hidden="true">{arrowGlyph(locale, "→")}</span></Cta>
          </article>; })}</div> : null}
        </div>
      </section>;
    }

    if (entry.kind === "payment") {
      return <section key={module.id} className={`g21-pad${tone}`} {...sectionProps}>
        <div className="g21-wrap g21-pay">
          <div className="g21-pay-copy">
            {cap ? <span className="g21-cap">{cap}</span> : null}{title}{text}
            {data.ctaVisible !== false ? <Cta className="g21-btn g21-btn--line" url={data.url} external={isExternal(data.url)} locale={locale}>{data.ctaLabel || t(locale, "dev.downloadPaymentPlan")} {arrow(locale)}</Cta> : null}
          </div>
          {items.length ? <div className={`g21-milestones${items.length === 2 ? " g21-milestones--two" : ""}`} style={{ "--g21-ms": items.length } as CSSProperties}>
            {items.map((item, itemIndex) => <div className="g21-ms" key={`${item.label}-${itemIndex}`}><b>{item.value}</b>{item.label ? <span className="g21-cap">{item.label}</span> : null}{item.text ? <p>{item.text}</p> : null}</div>)}
          </div> : null}
        </div>
      </section>;
    }

    // Default and "calm" sections: copy beside an image, with any figures as a row of large numbers.
    const showCta = data.ctaVisible !== false && (Boolean(data.url) || data.presentation === "calm");
    const copy = <div className="g21-split-copy">
      {cap ? <span className="g21-cap">{cap}</span> : null}{title}{data.text ? <p style={textStyle}>{multiline(data.text)}</p> : null}
      {items.length ? <div className="g21-trio">{items.map((item, itemIndex) => <div key={`${item.label}-${itemIndex}`}><b>{item.value}</b><span className="g21-cap">{item.label ?? item.text}</span></div>)}</div> : null}
      {showCta ? <Cta className="g21-btn" url={data.url} external={isExternal(data.url)} locale={locale}>{data.ctaLabel || (data.presentation === "calm" ? t(locale, "dev.brochure") : t(locale, "dev.explore"))} {arrow(locale)}</Cta> : null}
    </div>;
    const figure = images[0] ? <figure className={`g21-ph${entry.rev ? " g21-ph--tall" : ""}`}><img src={images[0]} alt={t(locale, "dev.figureAlt", { name: project.name, title: module.title })} loading="lazy" /></figure> : null;
    return <section key={module.id} className={`g21-pad${tone}`} {...sectionProps}>
      <div className={`g21-wrap g21-split${entry.rev ? " g21-split--rev" : ""}${figure ? "" : " g21-split--solo"}`}>{entry.rev ? <>{copy}{figure}</> : <>{figure}{copy}</>}</div>
    </section>;
  });

  const nav = [...(shown("overview") ? [{ href: "#overview", label: t(locale, "dev.overview") }] : []), ...slots.flatMap((slot) => {
    if (slot === "calculator") return [{ href: "#calculator", label: t(locale, "dev.calculator") }];
    const key = slot.slug in navFor ? navFor[slot.slug] : null;
    const label = key ? t(locale, key) : slot.slug in navFor ? null : slot.title;
    return label ? [{ href: `#${moduleSectionId(slot.slug)}`, label }] : [];
  })];

  const enquireHeading = (chrome.enquireHeading || t(locale, "dev.enquireHeading")).replace(/\r\n/g, "\n");

  return (
    <main className="single-project-main g21" id="top">
      {shown("hero") ? <section className="g21-hero" aria-labelledby="g21-dev-title">
        <div className="g21-wrap">
          <nav className="g21-crumbs g21-cap" aria-label={t(locale, "breadcrumb.label")}><Link href={localeHref("/", locale)}>{t(locale, "nav.home")}</Link><span aria-hidden="true">/</span><span>{t(locale, "nav.developments")}</span><span aria-hidden="true">/</span><span aria-current="page">{project.name}</span></nav>
          <div className="g21-title">
            <h1 id="g21-dev-title" style={textStyleProps(chrome.nameStyle)}>{emphasisNodes(project.name)}</h1>
            <div>
              <div className="g21-ctas">
                <Cta className="g21-btn" url={bookUrl} external={isExternal(bookUrl)} locale={locale}>{bookLabel} {arrow(locale)}</Cta>
                {chrome.brochureVisible === false ? null : <BrochureRequest className="g21-btn g21-btn--line" projectName={project.name} projectSlug={project.slug} label={chrome.brochureLabel || t(locale, "brochure.download")} />}
              </div>
            </div>
          </div>
          {project.heroVideo || project.heroImage ? <figure className="g21-hero-img">
            {project.heroVideo ? <video src={project.heroVideo} poster={project.heroImage ?? undefined} autoPlay muted loop playsInline preload="metadata" aria-label={t(locale, "dev.presentationAlt", { name: project.name })} /> : <img src={project.heroImage as string} alt={project.name} fetchPriority="high" />}
          </figure> : null}
          {facts.length ? <dl className="g21-keyfacts" style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}>{facts.map((fact, index) => <div key={`${fact.label}-${index}`}><dt className="g21-cap">{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}
        </div>
      </section> : null}

      <nav className="g21-subnav" aria-label={t(locale, "nav.onThisPage")}>
        <div className="g21-wrap g21-subnav-in">
          {nav.map((entry) => <a key={entry.href} href={entry.href}>{entry.label}</a>)}
          {pageLabel("subnavCta") ? <button className="g21-btn g21-sub-cta" type="button" data-booking-open>{pageLabel("subnavCta")}</button> : null}
        </div>
      </nav>

      {shown("overview") ? <section className="g21-pad" id="overview" aria-labelledby={project.tagline ? "g21-overview-title" : undefined} aria-label={project.tagline ? undefined : t(locale, "dev.overview")}>
        <div className="g21-wrap g21-overview">
          <div className="g21-overview-logo">{chrome.overviewLogo ? <img src={chrome.overviewLogo} alt={project.name} /> : null}</div>
          <div className="g21-overview-copy">
            {project.tagline ? <h2 id="g21-overview-title" style={textStyleProps(chrome.taglineStyle)}>{multiline(project.tagline)}</h2> : null}
            {project.description ? <p style={textStyleProps(chrome.descriptionStyle)}>{multiline(project.description)}</p> : null}
            {chrome.ctaVisible === false ? null : <div className="g21-ctas"><Cta className="g21-btn g21-btn--line" url={chrome.ctaUrl || "#amenities"} locale={locale}>{chrome.ctaLabel || t(locale, "dev.explore")} {arrow(locale)}</Cta></div>}
          </div>
        </div>
      </section> : null}

      <div className="g21-stack">{sections}</div>

      {chrome.enquireVisible === false ? null : <section className="g21-visit" aria-labelledby="g21-dev-band-title">
        <img src={chrome.enquireImage || "/legacy/assets/images/experience-center/hq/15.jpg"} alt="" loading="lazy" />
        <div className="g21-wrap g21-visit-in">
          <p className="g21-cap">{chrome.enquireEyebrow || t(locale, "dev.enquireEyebrow")}</p>
          <h2 id="g21-dev-band-title">{emphasisNodes(enquireHeading)}</h2>
          <p>{chrome.enquireText || t(locale, "dev.enquireText")}</p>
          <div className="g21-ctas">
            <Cta className="g21-btn g21-btn--white" url={chrome.enquirePrimaryUrl} locale={locale}>{primaryLabel} {arrow(locale)}</Cta>
            <Cta className="g21-btn g21-btn--ghost" url={chrome.enquireSecondaryUrl || "/contact"} locale={locale}>{chrome.enquireSecondaryLabel || t(locale, "dev.registerInterest")}</Cta>
          </div>
        </div>
      </section>}
    </main>
  );
}
