import type { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { InvestEnhancements } from "@/components/public/invest-enhancements";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { mergeInvestContent, type IconCard } from "@/lib/invest-defaults";

type Block = { type?: string; heading?: string; text?: string; image?: string };

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

export const metadata = { title: "Invest in Dubai", description: "Invest in Dubai with Kasumigaseki Properties Development through a disciplined residential platform shaped by long-horizon value, location logic, and clear advisory pathways." };
export const revalidate = 300;

const delay = (value: string) => ({ "--motion-delay": value } as React.CSSProperties);
const icon = (name: string, extra = "") => <i className={`fi ${name} invest-icon${extra ? ` ${extra}` : ""}`} aria-hidden="true"></i>;

/// The page renders the delivered design (public/legacy/invest-in-dubai.html);
/// every section's copy, lists and images come from the investor-guide editor
/// (staticPage "invest-in-dubai": "hero" + "invest" blocks) with the delivered
/// content as the fallback (src/lib/invest-defaults.ts).
export default async function InvestPage() {
  let hero: Block | undefined;
  let saved: unknown;
  try {
    const page = await db.staticPage.findUnique({ where: { slug: "invest-in-dubai" } });
    if (Array.isArray(page?.content)) {
      const blocks = page.content as (Block & Record<string, unknown>)[];
      hero = blocks.find((block) => block.type === "hero");
      saved = blocks.find((block) => block.type === "invest");
    }
  } catch {}
  const c = mergeInvestContent(saved);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
  const card = (item: IconCard, index: number, step: number, first = 140) => (
    <article className="motion-reveal" style={delay(`${first + index * step}ms`)} key={`${item.title}-${index}`}>{icon(item.icon)}<h3>{item.title}</h3><p>{item.text}</p></article>
  );
  return <>
    <DeliveredBodyClass bodyClass="home-development-page invest-dubai-page" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/css/flag-icons.min.css" />
    <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/4.0.0/uicons-thin-rounded/css/uicons-thin-rounded.css" />
    <SiteShellHeader /><main className="invest-main page-reference-main" id="top">
      <section className="page-reference-hero invest-hero" aria-label="Invest in Dubai">
        <img src={hero?.image || "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg"} alt="Dubai skyline with Burj Khalifa" />
        <div className="page-reference-hero-copy motion-reveal"><span>Invest in Dubai</span><h1>{hero?.heading ? multiline(hero.heading) : <>Long-horizon<br />value in Dubai</>}</h1><p>{hero?.text || "A focused investment pathway for buyers seeking regulated ownership, composed residential assets, and advisory clarity across Dubai's next chapter."}</p></div>
        <div className="invest-hero-metrics motion-reveal" style={delay("120ms")} aria-label="Investment highlights">{c.metrics.map((metric, index) => <div key={`${metric.label}-${index}`}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>
      </section>

      <section className="invest-benefits kpd-section kpd-section--compact" aria-label="Investor benefits">
        <div className="single-project-section-head invest-section-head motion-reveal"><h2>{c.benefits.heading}</h2><div className="single-project-section-copy"><p>{c.benefits.text}</p></div></div>
        <div className="invest-benefit-carousel motion-reveal" data-invest-carousel>
          <div className="invest-benefit-track">
            {c.benefits.items.map((item, index) => <article className="invest-benefit-card" key={`${item.title}-${index}`}>{icon(item.icon)}<h3>{item.title}</h3><p>{item.text}</p></article>)}
          </div>
          <div className="invest-carousel-progress" aria-hidden="true"><span data-invest-carousel-progress></span></div>
        </div>
      </section>

      <section className="invest-market kpd-section kpd-section--compact" aria-label="Dubai comparison lens">
        <div className="invest-editorial-grid invest-editorial-grid--top"><h2 className="motion-reveal">{c.market.heading}</h2><div className="invest-copy motion-reveal" style={delay("80ms")}><p>{c.market.text}</p></div></div>
        <div className="invest-yield-board motion-reveal">
          <div className="invest-yield-head"><span>City / Market</span><span>Rental Gross Yield</span><span>Capital Appreciation</span></div>
          {c.market.rows.map((row, index) => (
            <div className="invest-yield-row" key={`${row.city}-${index}`} style={{ "--yield": row.yieldBar, "--gain": row.gainBar } as React.CSSProperties} data-trend={row.trend}>
              <strong><span className="market-flag"><span className={`fi fi-${row.code.toLowerCase()}`} aria-hidden="true"></span><em>{row.code.toUpperCase()}</em></span>{` ${row.city}`}</strong>
              <div className="invest-yield-meter"><span></span><em>{row.yieldLabel}</em></div>
              <b><i className={`fi fi-tr-arrow-trend-${row.trend}`} aria-hidden="true"></i>{row.gainLabel}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="invest-payment-plan kpd-section" aria-label="Flexible payment plans" hidden>
        <div className="single-project-section-head invest-section-head motion-reveal"><h2>Flexible Payment Plans.</h2><div className="single-project-section-copy"><p>Investment structure should be clear before commitment. KPD reviews booking, construction, handover, and post-handover obligations as one complete cash-flow path.</p></div></div>
        <div className="invest-payment-layout">
          <figure className="invest-payment-media motion-reveal"><img src="/legacy/assets/images/library/luxury-downtown-of-dubai-2026-03-19-09-24-48-utc.jpg" alt="Luxury downtown Dubai skyline" /></figure>
          <div className="invest-payment-cards">
            <article className="invest-payment-card motion-reveal" style={delay("60ms")}><i className="fi fi-tr-wallet-money invest-icon" aria-hidden="true"></i><h3>Reservation</h3><p>Confirm the selected residence, initial booking amount, registration path, and payment-plan version before moving forward.</p></article>
            <article className="invest-payment-card motion-reveal" style={delay("120ms")}><i className="fi fi-tr-calendar-clock invest-icon" aria-hidden="true"></i><h3>Construction milestones</h3><p>Review scheduled payments against construction progress, target handover, and total capital allocation.</p></article>
            <article className="invest-payment-card motion-reveal" style={delay("180ms")}><i className="fi fi-tr-key invest-icon" aria-hidden="true"></i><h3>Handover balance</h3><p>Understand completion obligations, handover documentation, and the ownership transition before final payment.</p></article>
            <article className="invest-payment-card motion-reveal" style={delay("240ms")}><i className="fi fi-tr-file-invoice-dollar invest-icon" aria-hidden="true"></i><h3>Post-handover planning</h3><p>Where available, post-handover terms are reviewed alongside leasing, resale, and holding-period objectives.</p></article>
          </div>
        </div>
      </section>

      <section className="kpd-section ownership-planner-section" aria-label="Ownership Cost Planner"><div data-kpd-planner="" /></section>

      <section className="invest-residency kpd-section" aria-label="Residency through property investment">
        <div className="invest-residency-panel motion-reveal">
          {icon("fi-tr-passport", "invest-residency-icon")}
          <span className="kpd-eyebrow">{c.residency.eyebrow}</span>
          <h2>{c.residency.heading}</h2>
          <p>{c.residency.text}</p>
          <button className="btn-pill" type="button" data-booking-open>{c.residency.button}</button>
        </div>
        <div className="invest-residency-support">
          <figure className="invest-residency-media motion-reveal" style={delay("90ms")}><img src={c.residency.image} alt="Panoramic Dubai skyline" /></figure>
          <div className="invest-residency-cards" aria-label="Residency advisory points">
            {c.residency.cards.map((item, index) => card(item, index, 60))}
          </div>
        </div>
      </section>

      <section className="invest-pathway kpd-section" id="investment-pathway" aria-label="Investment pathway">
        <div className="single-project-section-head invest-section-head motion-reveal">
          <h2>{c.pathway.heading}</h2>
          <div className="single-project-section-copy"><p>{c.pathway.text}</p><button className="btn-pill" type="button" data-booking-open>{c.pathway.button}</button></div>
        </div>
        <div className="invest-process-carousel motion-reveal" data-invest-scroll-carousel>
          <div className="invest-process-cards" data-invest-scroll-track>
            {c.pathway.steps.map((step, index) => <article key={`${step.title}-${index}`}>{icon(step.icon)}<h3>{step.title}</h3><p>{step.text}</p></article>)}
          </div>
          <div className="invest-scroll-actions" aria-label="Investment pathway controls">
            <button type="button" data-invest-scroll-prev aria-label="Previous pathway cards"></button>
            <button type="button" data-invest-scroll-next aria-label="Next pathway cards"></button>
          </div>
        </div>
      </section>

      <section className="invest-trust invest-residency kpd-section" aria-label="Developer trust and delivery">
        <div className="invest-residency-panel invest-trust-copy motion-reveal">
          {icon("fi-tr-building-shield")}
          <span className="kpd-eyebrow">{c.trust.eyebrow}</span>
          <h2>{c.trust.heading}</h2>
          <p>{c.trust.text}</p>
          <button className="btn-pill" type="button" data-booking-open>{c.trust.button}</button>
        </div>
        <div className="invest-residency-support invest-trust-support">
          <figure className="invest-residency-media invest-trust-media motion-reveal" style={delay("90ms")}><img src={c.trust.image} alt="Modern financial district towers" /></figure>
          <div className="invest-residency-cards invest-trust-cards" aria-label="Developer trust proof points">
            {c.trust.cards.map((item, index) => card(item, index, 60))}
          </div>
        </div>
      </section>

      <section className="invest-liquidity kpd-section" aria-label="Market liquidity and exit">
        <div className="single-project-section-head invest-section-head motion-reveal"><h2>{c.liquidity.heading}</h2><div className="single-project-section-copy"><p>{c.liquidity.text}</p></div></div>
        <div className="invest-liquidity-grid">
          <article className="invest-liquidity-feature motion-reveal">{icon(c.liquidity.feature.icon)}<h3>{c.liquidity.feature.title}</h3><p>{c.liquidity.feature.text}</p></article>
          {c.liquidity.cards.map((item, index) => card(item, index, 70, 70))}
        </div>
      </section>

      <section className="invest-featured kpd-section" aria-label="Featured developments">
        <div className="single-project-section-head invest-section-head motion-reveal"><h2>{c.featured.heading}</h2><div className="single-project-section-copy"><p>{c.featured.text}</p></div></div>
        <div className="pdf-development-cards invest-development-cards">
          {c.featured.cards.map((item, index) => <Link className="pdf-dev-card motion-reveal" style={index ? delay(`${index * 80}ms`) : undefined} href={item.href || "/"} key={`${item.href}-${index}`}><img src={item.image} alt={`${item.title} exterior`} /><div className="pdf-dev-card-body"><h3>{item.title}</h3><p>{item.copy}</p><span>Explore</span></div></Link>)}
        </div>
      </section>

      <section className="invest-faq-section kpd-section kpd-section--compact" aria-label="Investor questions">
        <div className="invest-faq-shell">
          <aside className="invest-faq-aside motion-reveal">
            {icon("fi-tr-question")}
            <span className="kpd-eyebrow">{c.faq.eyebrow}</span>
            <h2>{c.faq.heading}</h2>
            <p>{c.faq.text}</p>
          </aside>
          <div className="faq-list invest-faq-list">
            {c.faq.items.map((item, index) => <details className="invest-faq-item motion-reveal" key={`${item.question}-${index}`} open={index === 0}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="projects-spec-contact invest-contact" aria-label="Begin an investment inquiry">
        <img src={c.contact.image} alt="Private advisory workspace at the KPD Experience Center" />
        <div className="projects-spec-contact-copy motion-reveal">
          <span>{c.contact.eyebrow}</span>
          <h2>{multiline(c.contact.heading)}</h2>
          <p>{c.contact.text}</p>
          <div className="projects-spec-contact-actions">
            <button type="button" data-booking-open>{c.contact.primaryLabel}</button>
            <Link href="/contact">{c.contact.secondaryLabel}</Link>
          </div>
        </div>
      </section>
    </main><SiteShellFooter />
    <InvestEnhancements />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page invest-dubai-page" sources={["/legacy/assets/js/ownership-cost-planner.js?v=20260929"]} />
  </>;
}
