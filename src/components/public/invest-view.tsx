import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { mortgageCalculatorHtmlWith, mortgageCalculatorSectionProps } from "@/lib/mortgage-calculator-html";
import { ensureInvestSections, investLabel, mergeInvestContent, type IconCard, type InvestSectionId, type PanelSection } from "@/lib/invest-defaults";
import { textStyleProps, type TextStyle } from "@/lib/text-style";
import { emphasisNodes } from "@/lib/emphasis";
import { sectionFilter } from "@/lib/section-visibility";
import { loadHiddenSections } from "@/lib/section-visibility-store";
import { getLocale } from "@/lib/locale";
import { localeHref, type Locale, arrowGlyph } from "@/lib/locales";
import { t, type MessageKey } from "@/lib/i18n";

export type InvestHero = { type?: string; eyebrow?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string; headingStyle?: TextStyle; textStyle?: TextStyle };

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// Anchor, sub-navigation label and small kicker for each section. The kicker
/// is only used where the section has no eyebrow of its own in the editor.
const sectionMeta: Record<InvestSectionId, { anchor: string; nav: MessageKey; cap: MessageKey }> = {
  benefits: { anchor: "why", nav: "invest.navBenefits", cap: "invest.capBenefits" },
  market: { anchor: "yield", nav: "invest.navMarket", cap: "invest.capMarket" },
  calculator: { anchor: "calculator", nav: "invest.navCalculator", cap: "invest.capCalculator" },
  payment: { anchor: "plans", nav: "invest.navPayment", cap: "invest.capPayment" },
  residency: { anchor: "visa", nav: "invest.navResidency", cap: "invest.capResidency" },
  pathway: { anchor: "pathway", nav: "invest.navPathway", cap: "invest.capPathway" },
  trust: { anchor: "trust", nav: "invest.navTrust", cap: "invest.capTrust" },
  liquidity: { anchor: "exit", nav: "invest.navLiquidity", cap: "invest.capLiquidity" },
  featured: { anchor: "developments", nav: "invest.navFeatured", cap: "invest.capFeatured" },
  faq: { anchor: "faq", nav: "invest.navFaq", cap: "invest.capFaq" },
};

const order = (value: number) => ({ order: value }) as CSSProperties;
const two = (index: number) => String(index + 1).padStart(2, "0");
/// "Eligibility review" + text → "Eligibility review." as the bold lead-in of a tick line.
/// `stop` is the sentence end in the page's language.
const leadIn = (title: string, stop: string) => (/[.!?:。！？]$/.test(title) ? title : `${title}${stop}`);

/// A button that opens the booking form, or follows a link when one is set.
/// An internal link follows the page's language.
function Cta({ url, className, children, locale }: { url?: string; className: string; children: ReactNode; locale: Locale }) {
  if (!url) return <button className={className} type="button" data-booking-open>{children}</button>;
  const href = localeHref(url, locale);
  if (href.startsWith("/") && !href.startsWith("//")) return <Link className={className} href={href}>{children}</Link>;
  return <a className={className} href={href}>{children}</a>;
}

function SecTop({ cap, heading, text, headingStyle, textStyle, id, dark }: { cap: string; heading: string; text?: string; headingStyle?: TextStyle; textStyle?: TextStyle; id: string; dark?: boolean }) {
  return <div className="g21-sec-top">
    <div>{cap ? <span className="g21-cap">{cap}</span> : null}{heading ? <h2 id={id} style={textStyleProps(headingStyle)}>{emphasisNodes(heading)}</h2> : null}</div>
    {text ? <p className={dark ? "g21-sec-note g21-night-note" : "g21-sec-note g21-muted"} style={textStyleProps(textStyle)}>{multiline(text)}</p> : null}
  </div>;
}

function Ticks({ items, stop }: { items: IconCard[]; stop: string }) {
  if (!items.length) return null;
  return <ul className="g21-ticks">{items.map((item, index) => <li key={`${item.title}-${index}`}>{item.title ? <b>{leadIn(item.title, stop)}</b> : null} {item.text}</li>)}</ul>;
}

/// Residency and trust share one shape: image beside copy, tick list, button.
function Split({ panel, id, reverse, cap, buttonClass, alt, locale }: { panel: PanelSection; id: string; reverse?: boolean; cap: string; buttonClass: string; alt: string; locale: Locale }) {
  const stop = t(locale, "punctuation.sentenceEnd");
  const copy = <div className="g21-split-copy">
    <span className="g21-cap">{panel.eyebrow || cap}</span>
    {panel.heading ? <h2 id={id} style={textStyleProps(panel.headingStyle)}>{emphasisNodes(panel.heading)}</h2> : null}
    {panel.text ? <p className="g21-muted" style={textStyleProps(panel.textStyle)}>{multiline(panel.text)}</p> : null}
    <Ticks items={panel.cards} stop={stop} />
    {panel.ctaVisible === false || !panel.button ? null : <Cta url={panel.ctaUrl} className={buttonClass} locale={locale}>{panel.button} <span className="g21-ar" aria-hidden="true">{arrowGlyph(locale, "→")}</span></Cta>}
  </div>;
  const image = panel.image ? <figure className={`g21-ph${reverse ? " g21-ph--tall" : ""}`}><img src={panel.image} alt={alt} loading="lazy" /></figure> : null;
  return <div className={`g21-split${reverse ? " g21-split--rev" : ""}${image ? "" : " g21-split--solo"}`}>{reverse ? <>{copy}{image}</> : <>{image}{copy}</>}</div>;
}

/// The Investor Guide in the client-approved Option 2.1 "Gallery light" layout.
/// Every section still reads the investor-guide editor (mergeInvestContent),
/// keeps its editor-defined order, and the client's mortgage calculator markup
/// and script are untouched. Shared by the public route and the admin
/// unsaved-changes preview so both render identically.
export async function InvestView({ hero, saved, previewNote }: { hero?: InvestHero; saved?: unknown; previewNote?: string }) {
  const locale = await getLocale();
  const c = ensureInvestSections(mergeInvestContent(saved));
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
  /// Sections the editor switched off under "Sections on this page".
  const shown = sectionFilter(await loadHiddenSections("invest-in-dubai"));
  const visible = c.sectionOrder.filter((id) => (id === "payment" ? c.paymentVisible !== false : true) && shown(id));
  /// Alternate white and stone bands down the page in whatever order the editor
  /// set; the exit section is always the dark band.
  const tone = (id: InvestSectionId) => (id === "liquidity" ? " g21-night" : visible.indexOf(id) % 2 === 1 ? " g21-band" : "");
  const place = (id: InvestSectionId) => order(visible.indexOf(id));
  const eyebrow = hero?.eyebrow ?? t(locale, "invest.eyebrow");
  const heading = hero?.heading?.trim() || t(locale, "nav.investorGuide");
  const lede = hero?.text?.trim() ?? "";
  const metrics = c.metrics.filter((metric) => metric.value || metric.label);

  const sections: Record<InvestSectionId, ReactNode> = {
    benefits: <section className={`g21-pad${tone("benefits")}`} id="why" aria-labelledby="g21-why-title" style={place("benefits")} key="benefits">
      <div className="g21-wrap">
        <SecTop id="g21-why-title" cap={investLabel(c.labels, "benefits")} heading={c.benefits.heading} text={c.benefits.text} headingStyle={c.benefits.headingStyle} textStyle={c.benefits.textStyle} />
        {c.benefits.items.length ? <ol className="g21-grid8">{c.benefits.items.map((item, index) => <li key={`${item.title}-${index}`}><span className="g21-cap">{two(index)}</span><h3>{item.title}</h3><p>{item.text}</p></li>)}</ol> : null}
      </div>
    </section>,

    market: <section className={`g21-pad${tone("market")}`} id="yield" aria-labelledby="g21-yield-title" style={place("market")} key="market">
      <div className="g21-wrap">
        <SecTop id="g21-yield-title" cap={investLabel(c.labels, "market")} heading={c.market.heading} text={c.market.text} headingStyle={c.market.headingStyle} textStyle={c.market.textStyle} />
        {c.market.rows.length ? <div className="g21-ytable" role="table" aria-label={t(locale, "invest.yieldTable")}>
          <div className="g21-yr-row g21-yr-head" role="row"><span role="columnheader">{investLabel(c.labels, "yieldCity")}</span><span role="columnheader">{investLabel(c.labels, "yieldGross")}</span><span role="columnheader">{investLabel(c.labels, "yieldGain")}</span></div>
          {c.market.rows.map((row, index) => <div className={`g21-yr-row${index === 0 ? " is-hi" : ""}`} role="row" key={`${row.city}-${index}`}>
            <span role="cell">{row.code ? <i>{row.code.toUpperCase()}</i> : null}{row.city}</span>
            <span role="cell">{row.yieldLabel}</span>
            <span role="cell" className={row.trend === "down" ? "is-down" : undefined}>{row.gainLabel}</span>
          </div>)}
        </div> : null}
        {c.market.source ? <p className="g21-fine-src">{c.market.source}</p> : null}
      </div>
    </section>,

    /* The client's mortgage calculator (src/lib/mortgage-calculator-html.ts), driven by his mortgage-calculator.js; only the wrapper gains the g21 classes. */
    calculator: <section {...mortgageCalculatorSectionProps} className={`${mortgageCalculatorSectionProps.className} g21-calc g21-pad${tone("calculator")}`} id="calculator" style={place("calculator")} key="calculator">
      <div className="g21-wrap"><span className="g21-cap g21-calc-cap">{investLabel(c.labels, "calculator")}</span><div dangerouslySetInnerHTML={{ __html: mortgageCalculatorHtmlWith(c.calculator) }} /></div>
    </section>,

    payment: <section className={`g21-pad${tone("payment")}`} id="plans" aria-labelledby="g21-plans-title" style={place("payment")} key="payment">
      <div className="g21-wrap">
        <div className={`g21-split${c.payment.image ? "" : " g21-split--solo"}`}>
          {c.payment.image ? <figure className="g21-ph"><img src={c.payment.image} alt={t(locale, "invest.altPayment")} loading="lazy" /></figure> : null}
          <div className="g21-split-copy"><span className="g21-cap">{investLabel(c.labels, "payment")}</span>{c.payment.heading ? <h2 id="g21-plans-title" style={textStyleProps(c.payment.headingStyle)}>{emphasisNodes(c.payment.heading)}</h2> : null}{c.payment.text ? <p className="g21-muted" style={textStyleProps(c.payment.textStyle)}>{multiline(c.payment.text)}</p> : null}</div>
        </div>
        {c.payment.cards.length ? <ol className="g21-steps">{c.payment.cards.map((item, index) => <li key={`${item.title}-${index}`}><span className="g21-cap">{two(index)}</span><h3>{item.title}</h3><p>{item.text}</p></li>)}</ol> : null}
      </div>
    </section>,

    residency: <section className={`g21-pad${tone("residency")}`} id="visa" aria-labelledby="g21-visa-title" style={place("residency")} key="residency">
      <div className="g21-wrap"><Split panel={c.residency} id="g21-visa-title" reverse cap={t(locale, sectionMeta.residency.cap)} buttonClass="g21-btn" alt={t(locale, "invest.altResidency")} locale={locale} /></div>
    </section>,

    pathway: <section className={`g21-pad${tone("pathway")}`} id="pathway" aria-labelledby="g21-path-title" style={place("pathway")} key="pathway">
      <div className="g21-wrap">
        <SecTop id="g21-path-title" cap={investLabel(c.labels, "pathway")} heading={c.pathway.heading} text={c.pathway.text} headingStyle={c.pathway.headingStyle} textStyle={c.pathway.textStyle} />
        {c.pathway.steps.length ? <ol className="g21-path">{c.pathway.steps.map((step, index) => <li key={`${step.title}-${index}`}><b>{index + 1}</b><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol> : null}
        {c.pathway.button ? <button className="g21-btn g21-path-cta" type="button" data-booking-open>{c.pathway.button} <span className="g21-ar" aria-hidden="true">{arrowGlyph(locale, "→")}</span></button> : null}
      </div>
    </section>,

    trust: <section className={`g21-pad${tone("trust")}`} id="trust" aria-labelledby="g21-trust-title" style={place("trust")} key="trust">
      <div className="g21-wrap"><Split panel={c.trust} id="g21-trust-title" cap={t(locale, sectionMeta.trust.cap)} buttonClass="g21-btn g21-btn--line" alt={t(locale, "invest.altTrust")} locale={locale} /></div>
    </section>,

    liquidity: <section className={`g21-pad${tone("liquidity")}`} id="exit" aria-labelledby="g21-exit-title" style={place("liquidity")} key="liquidity">
      <div className="g21-wrap">
        <SecTop id="g21-exit-title" cap={investLabel(c.labels, "liquidity")} heading={c.liquidity.heading} text={c.liquidity.text} headingStyle={c.liquidity.headingStyle} textStyle={c.liquidity.textStyle} dark />
        <div className="g21-exit">
          {c.liquidity.feature.title || c.liquidity.feature.text ? <article className="g21-exit-lead"><h3>{c.liquidity.feature.title}</h3><p>{c.liquidity.feature.text}</p></article> : null}
          {c.liquidity.cards.map((item, index) => <article key={`${item.title}-${index}`}><span className="g21-cap">{two(index)}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </div>
    </section>,

    featured: <section className={`g21-pad${tone("featured")}`} id="developments" aria-labelledby="g21-devs-title" style={place("featured")} key="featured">
      <div className="g21-wrap">
        <SecTop id="g21-devs-title" cap={investLabel(c.labels, "featured")} heading={c.featured.heading} text={c.featured.text} headingStyle={c.featured.headingStyle} textStyle={c.featured.textStyle} />
        <div className="g21-devs">
          {c.featured.cards.map((item, index) => <Link className="g21-dev" href={localeHref(item.href || "/", locale)} key={`${item.href}-${index}`}>
            <figure className="g21-ph">{item.image ? <img src={item.image} alt={t(locale, "invest.cardAlt", { title: item.title })} loading="lazy" /> : null}</figure>
            <h3>{item.title}</h3>
            {item.copy ? <p className="g21-muted">{item.copy}</p> : null}
            <span className="g21-txt-link">{investLabel(c.labels, "featuredCta")} <span aria-hidden="true">{arrowGlyph(locale, "→")}</span></span>
          </Link>)}
        </div>
      </div>
    </section>,

    faq: <section className={`g21-pad${tone("faq")}`} id="faq" aria-labelledby="g21-faq-title" style={place("faq")} key="faq">
      <div className="g21-wrap g21-faq">
        <div>
          <span className="g21-cap">{c.faq.eyebrow || t(locale, sectionMeta.faq.cap)}</span>
          {c.faq.heading ? <h2 id="g21-faq-title" style={textStyleProps(c.faq.headingStyle)}>{emphasisNodes(c.faq.heading)}</h2> : null}
          {c.faq.text ? <p className="g21-muted" style={textStyleProps(c.faq.textStyle)}>{multiline(c.faq.text)}</p> : null}
        </div>
        <div className="g21-qa">
          {c.faq.items.map((item, index) => <details key={`${item.question}-${index}`} open={index === 0}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </div>
      </div>
    </section>,
  };

  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page invest-dubai-page" />
    {visible.includes("faq") ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
    <SiteShellHeader /><main className="invest-main g21" id="top">
      {shown("hero") ? <section className="g21-hero" aria-labelledby="g21-invest-title">
        <div className="g21-wrap">
          <nav className="g21-crumbs g21-cap" aria-label={t(locale, "breadcrumb.label")}><Link href={localeHref("/", locale)}>{t(locale, "nav.home")}</Link>{eyebrow ? <><span aria-hidden="true">/</span><span>{eyebrow}</span></> : null}<span aria-hidden="true">/</span><span aria-current="page">{t(locale, "nav.investorGuide")}</span></nav>
          <div className="g21-title">
            <h1 id="g21-invest-title" style={textStyleProps(hero?.headingStyle)}>{emphasisNodes(heading)}</h1>
            <div>
              {lede ? <p className="g21-lede" style={textStyleProps(hero?.textStyle)}>{multiline(lede)}</p> : null}
              <div className="g21-ctas">
                <Cta url={hero?.ctaUrl?.trim() || undefined} className="g21-btn" locale={locale}>{hero?.ctaLabel?.trim() || t(locale, "invest.heroCta")} <span className="g21-ar" aria-hidden="true">{arrowGlyph(locale, "→")}</span></Cta>
                {visible.includes("calculator") ? <a className="g21-btn g21-btn--line" href="#calculator">{investLabel(c.labels, "calculatorButton")}</a> : null}
              </div>
            </div>
          </div>
          {hero?.image ? <figure className="g21-hero-img"><img src={hero.image} alt={t(locale, "invest.altHero")} style={{ objectPosition: "50% 55%" }} /></figure> : null}
          {metrics.length ? <dl className="g21-keyfacts" style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}>{metrics.map((metric, index) => <div key={`${metric.label}-${index}`}><dt className="g21-cap">{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl> : null}
        </div>
      </section> : null}

      {shown("subnav") ? <nav className="g21-subnav" aria-label={t(locale, "nav.onThisPage")}>
        <div className="g21-wrap g21-subnav-in">
          {visible.map((id) => <a key={id} href={`#${sectionMeta[id].anchor}`}>{t(locale, sectionMeta[id].nav)}</a>)}
          <button className="g21-btn g21-sub-cta" type="button" data-booking-open>{investLabel(c.labels, "subnavCta")}</button>
        </div>
      </nav> : null}

      <div className="g21-stack">{visible.map((id) => sections[id])}</div>

      {shown("contact") && c.contact.heading ? <section className="g21-visit" aria-labelledby="g21-invest-band-title">
        {c.contact.image ? <img src={c.contact.image} alt="" loading="lazy" /> : null}
        <div className="g21-wrap g21-visit-in">
          {c.contact.eyebrow ? <p className="g21-cap">{c.contact.eyebrow}</p> : null}
          <h2 id="g21-invest-band-title">{emphasisNodes(c.contact.heading)}</h2>
          {c.contact.text ? <p>{multiline(c.contact.text)}</p> : null}
          {c.contact.primaryLabel || c.contact.secondaryLabel ? <div className="g21-ctas">
            {c.contact.primaryLabel ? <button className="g21-btn g21-btn--white" type="button" data-booking-open>{c.contact.primaryLabel} <span className="g21-ar" aria-hidden="true">{arrowGlyph(locale, "→")}</span></button> : null}
            {c.contact.secondaryLabel ? <Link className="g21-btn g21-btn--ghost" href={localeHref("/contact", locale)}>{c.contact.secondaryLabel}</Link> : null}
          </div> : null}
        </div>
      </section> : null}
    </main><SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page invest-dubai-page" sources={["/legacy/assets/js/mortgage-calculator.js?v=20261005-2"]} />
  </>;
}
