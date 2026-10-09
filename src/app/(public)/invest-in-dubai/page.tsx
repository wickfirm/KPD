import Link from "next/link";
import { db } from "@/lib/db";
import { InvestEnhancements } from "@/components/public/invest-enhancements";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";

type Block = { type?: string; heading?: string; text?: string; image?: string };

/// Section copy restored verbatim from the approved legacy template
/// (public/legacy/invest-in-dubai.html) so the migrated route matches the
/// delivered design exactly.
const benefits: [string, string, string][] = [
  ["fi-tr-shield-check", "Government-backed market", "Clear title registration, regulated escrow, and defined transaction steps give international buyers a visible framework for decision-making."],
  ["fi-tr-chart-line-up", "Capital growth", "Prime Dubai districts continue to benefit from population growth, infrastructure investment, and sustained end-user demand."],
  ["fi-tr-user-shield", "World-class safety", "Governance, security, infrastructure, and daily quality of life support Dubai's appeal for families, entrepreneurs, and global residents."],
  ["fi-tr-home", "Rental yield depth", "Leasing demand is supported by business relocation, international mobility, tourism, schools, and a growing base of long-term residents."],
  ["fi-tr-contract", "Transparent process", "Buyers can evaluate fees, documents, ownership route, payment milestones, and handover obligations before committing."],
  ["fi-tr-wallet-money", "Flexible entry options", "Off-plan and ready homes create different routes for investors reviewing cash flow, handover timing, and portfolio balance."],
  ["fi-tr-world", "Global mobility", "Residency pathways, aviation connectivity, and a pro-business environment make Dubai a practical base as well as an investment market."],
  ["fi-tr-route", "Exit planning", "Resale, leasing readiness, and holding strategy can be planned from the beginning so the purchase is evaluated beyond acquisition day."],
];

/// [flagClass, code, city, yieldLabel, yieldBar, trend, gainLabel, gainBar]
const yields: [string, string, string, string, string, string, string, string][] = [
  ["fi-ae", "AE", "Dubai", "7.5%", "100%", "up", "+41.6%", "100%"],
  ["fi-us", "US", "San Francisco", "6.6%", "88%", "up", "+33.2%", "80%"],
  ["fi-sg", "SG", "Singapore", "3.0%", "40%", "up", "+18.4%", "44%"],
  ["fi-gb", "GB", "London", "3.3%", "44%", "down", "-2.7%", "6%"],
  ["fi-fr", "FR", "Paris", "2.9%", "39%", "down", "-8.5%", "20%"],
  ["fi-hk", "HK", "Hong Kong", "2.2%", "29%", "down", "-30.5%", "73%"],
];

const pathway: [string, string, string][] = [
  ["fi-tr-route", "Define the brief", "Budget, use case, timing, preferred address, and holding strategy are clarified first."],
  ["fi-tr-house-building", "Select the residence", "Available homes are reviewed against layout, view, location logic, payment terms, and daily livability."],
  ["fi-tr-contract", "Confirm documents", "Buyer details, reservation documents, payment schedule, and transaction requirements are prepared."],
  ["fi-tr-receipt", "Register the plan", "Payment milestones, ownership route, and handover obligations are tracked through one clear process."],
  ["fi-tr-key", "Plan handover", "Completion, inspection, leasing, furnishing, or end-use planning is discussed before possession."],
];

const faq: [string, string][] = [
  ["Can international buyers purchase property in Dubai?", "International buyers can purchase property in designated ownership areas, subject to the current transaction, registration, and documentation process for the selected asset."],
  ["Can property investment support residency planning?", "Qualifying property investment may be reviewed as part of current residency eligibility routes. Requirements can change, so final advice should be checked against official channels and appointed advisors."],
  ["How should I compare off-plan payment plans?", "Compare the booking amount, construction-linked milestones, handover balance, post-handover terms, total cost, expected completion timing, and the strength of the location and product brief."],
  ["What should I review before resale or leasing?", "Review comparable supply, expected handover timing, service charges, tenant demand, view, layout, payment history, and the clarity of the ownership documentation."],
  ["What happens after I select a residence?", "The KPD team can coordinate availability review, floor plan discussion, payment plan explanation, and the next documentation steps for the selected development."],
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export const metadata = { title: "Invest in Dubai", description: "Invest in Dubai with Kasumigaseki Properties Development through a disciplined residential platform shaped by long-horizon value, location logic, and clear advisory pathways." };
export const revalidate = 300;

const delay = (value: string) => ({ "--motion-delay": value } as React.CSSProperties);

export default async function InvestPage() {
  let hero: Block | undefined;
  try { const page = await db.staticPage.findUnique({ where: { slug: "invest-in-dubai" } }); if (Array.isArray(page?.content)) hero = (page.content as Block[]).find((block) => block.type === "hero"); } catch {}
  return <>
    <DeliveredBodyClass bodyClass="home-development-page invest-dubai-page" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/css/flag-icons.min.css" />
    <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/4.0.0/uicons-thin-rounded/css/uicons-thin-rounded.css" />
    <SiteShellHeader /><main className="invest-main page-reference-main" id="top">
      <section className="page-reference-hero invest-hero" aria-label="Invest in Dubai">
        <img src={hero?.image || "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg"} alt="Dubai skyline with Burj Khalifa" />
        <div className="page-reference-hero-copy motion-reveal"><span>Invest in Dubai</span><h1>{hero?.heading || <>Long-horizon<br />value in Dubai</>}</h1><p>{hero?.text || "A focused investment pathway for buyers seeking regulated ownership, composed residential assets, and advisory clarity across Dubai's next chapter."}</p></div>
        <div className="invest-hero-metrics motion-reveal" style={delay("120ms")} aria-label="Investment highlights"><div><strong>Global</strong><span>Capital access</span></div><div><strong>Dubai</strong><span>Freehold market</span></div><div><strong>KPD</strong><span>Disciplined delivery</span></div></div>
      </section>

      <section className="invest-benefits kpd-section kpd-section--compact" aria-label="Investor benefits">
        <div className="single-project-section-head invest-section-head motion-reveal"><h2>Why Dubai remains investable</h2><div className="single-project-section-copy"><p>Quick answers to the core motivations behind Dubai investment: regulated ownership, business mobility, rental demand, and a city that continues to attract global residents and capital.</p></div></div>
        <div className="invest-benefit-carousel motion-reveal" data-invest-carousel>
          <div className="invest-benefit-track">
            {benefits.map(([icon, title, text]) => <article className="invest-benefit-card" key={title}><i className={`fi ${icon} invest-icon`} aria-hidden="true"></i><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="invest-carousel-progress" aria-hidden="true"><span data-invest-carousel-progress></span></div>
        </div>
      </section>

      <section className="invest-market kpd-section kpd-section--compact" aria-label="Dubai comparison lens">
        <div className="invest-editorial-grid invest-editorial-grid--top"><h2 className="motion-reveal">Dubai vs Global Hubs: Rental Yield at a Glance</h2><div className="invest-copy motion-reveal" style={delay("80ms")}><p>A compact comparison of rental yield and capital appreciation signals across major global hubs, presented as a decision board for first-pass market review.</p></div></div>
        <div className="invest-yield-board motion-reveal">
          <div className="invest-yield-head"><span>City / Market</span><span>Rental Gross Yield</span><span>Capital Appreciation</span></div>
          {yields.map(([flag, code, city, yieldLabel, yieldBar, trend, gainLabel, gainBar]) => (
            <div className="invest-yield-row" key={city} style={{ "--yield": yieldBar, "--gain": gainBar } as React.CSSProperties} data-trend={trend}>
              <strong><span className="market-flag"><span className={`fi ${flag}`} aria-hidden="true"></span><em>{code}</em></span>{` ${city}`}</strong>
              <div className="invest-yield-meter"><span></span><em>{yieldLabel}</em></div>
              <b><i className={`fi fi-tr-arrow-trend-${trend}`} aria-hidden="true"></i>{gainLabel}</b>
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
          <i className="fi fi-tr-passport invest-icon invest-residency-icon" aria-hidden="true"></i>
          <span className="kpd-eyebrow">Golden Visa Through Property Investment</span>
          <h2>Residency planning, reviewed with the purchase.</h2>
          <p>For many buyers, Dubai real estate is part investment and part long-term personal infrastructure. KPD frames the conversation around ownership use, qualifying asset value, documentation route, and family planning before a commitment is made.</p>
          <button className="btn-pill" type="button" data-booking-open>Discuss eligibility</button>
        </div>
        <div className="invest-residency-support">
          <figure className="invest-residency-media motion-reveal" style={delay("90ms")}><img src="/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg" alt="Panoramic Dubai skyline" /></figure>
          <div className="invest-residency-cards" aria-label="Residency advisory points">
            <article className="motion-reveal" style={delay("140ms")}><i className="fi fi-tr-badge-check invest-icon" aria-hidden="true"></i><h3>Eligibility review</h3><p>Asset value, ownership route, and current residency conditions are reviewed with appointed advisors.</p></article>
            <article className="motion-reveal" style={delay("200ms")}><i className="fi fi-tr-folder-open invest-icon" aria-hidden="true"></i><h3>Document clarity</h3><p>Buyer information, transaction documents, and handover steps are organized as one advisory path.</p></article>
            <article className="motion-reveal" style={delay("260ms")}><i className="fi fi-tr-users-alt invest-icon" aria-hidden="true"></i><h3>Family planning</h3><p>End use, leasing, schooling, mobility, and longer-term living intentions are considered together.</p></article>
          </div>
        </div>
      </section>

      <section className="invest-pathway kpd-section" id="investment-pathway" aria-label="Investment pathway">
        <div className="single-project-section-head invest-section-head motion-reveal">
          <h2>Investment pathway</h2>
          <div className="single-project-section-copy"><p>The process is kept simple: understand the brief, select the asset, review payment terms, document eligibility routes, and plan the ownership phase before handover.</p><button className="btn-pill" type="button" data-booking-open>Begin inquiry</button></div>
        </div>
        <div className="invest-process-carousel motion-reveal" data-invest-scroll-carousel>
          <div className="invest-process-cards" data-invest-scroll-track>
            {pathway.map(([icon, title, text]) => <article key={title}><i className={`fi ${icon} invest-icon`} aria-hidden="true"></i><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="invest-scroll-actions" aria-label="Investment pathway controls">
            <button type="button" data-invest-scroll-prev aria-label="Previous pathway cards"></button>
            <button type="button" data-invest-scroll-next aria-label="Next pathway cards"></button>
          </div>
        </div>
      </section>

      <section className="invest-trust invest-residency kpd-section" aria-label="Developer trust and delivery">
        <div className="invest-residency-panel invest-trust-copy motion-reveal">
          <i className="fi fi-tr-building-shield invest-icon" aria-hidden="true"></i>
          <span className="kpd-eyebrow">Developer Trust &amp; Delivery</span>
          <h2>Review the platform behind the address.</h2>
          <p>KPD extends Kasumigaseki Capital&apos;s discipline into Dubai through measured residential development, clear documentation, and a delivery culture shaped around long-horizon value.</p>
          <button className="btn-pill" type="button" data-booking-open>Speak to advisory</button>
        </div>
        <div className="invest-residency-support invest-trust-support">
          <figure className="invest-residency-media invest-trust-media motion-reveal" style={delay("90ms")}><img src="/legacy/assets/images/library/modern-financial-office-buildings-2026-03-18-04-41-23-utc.jpg" alt="Modern financial district towers" /></figure>
          <div className="invest-residency-cards invest-trust-cards" aria-label="Developer trust proof points">
            <article className="motion-reveal" style={delay("140ms")}><i className="fi fi-tr-building invest-icon" aria-hidden="true"></i><h3>Development discipline</h3><p>Each project is reviewed around site logic, specification, buildability, and buyer use.</p></article>
            <article className="motion-reveal" style={delay("200ms")}><i className="fi fi-tr-bank invest-icon" aria-hidden="true"></i><h3>Capital strength</h3><p>The platform is shaped by institutional investment thinking and careful project sequencing.</p></article>
            <article className="motion-reveal" style={delay("260ms")}><i className="fi fi-tr-user-shield invest-icon" aria-hidden="true"></i><h3>Buyer confidence</h3><p>Documentation, quality control, and advisory coordination are kept visible throughout.</p></article>
          </div>
        </div>
      </section>

      <section className="invest-liquidity kpd-section" aria-label="Market liquidity and exit">
        <div className="single-project-section-head invest-section-head motion-reveal"><h2>Market Liquidity &amp; Exit</h2><div className="single-project-section-copy"><p>Dubai&apos;s active ownership market allows investors to review entry and exit together: demand depth, resale timing, rental readiness, and buyer appetite are part of the same conversation.</p></div></div>
        <div className="invest-liquidity-grid">
          <article className="invest-liquidity-feature motion-reveal"><i className="fi fi-tr-chart-mixed invest-icon" aria-hidden="true"></i><h3>Liquidity is planned before purchase.</h3><p>Location, unit mix, handover date, price band, and future tenant profile are evaluated early so the asset has a clearer resale or leasing story later.</p></article>
          <article className="motion-reveal" style={delay("70ms")}><i className="fi fi-tr-chart-histogram invest-icon" aria-hidden="true"></i><h3>Active resale market</h3><p>Comparable transactions and buyer demand help frame potential exit timing.</p></article>
          <article className="motion-reveal" style={delay("140ms")}><i className="fi fi-tr-handshake invest-icon" aria-hidden="true"></i><h3>Tenant depth</h3><p>Business relocation, families, and global residents support leasing activity.</p></article>
          <article className="motion-reveal" style={delay("210ms")}><i className="fi fi-tr-receipt invest-icon" aria-hidden="true"></i><h3>Clear transfer route</h3><p>Fees, transfer steps, and documentation expectations are reviewed in advance.</p></article>
          <article className="motion-reveal" style={delay("280ms")}><i className="fi fi-tr-arrow-trend-up invest-icon" aria-hidden="true"></i><h3>Holding strategy</h3><p>Rental, resale, end-use, or hybrid ownership paths can be compared before commitment.</p></article>
        </div>
      </section>

      <section className="invest-featured kpd-section" aria-label="Featured developments">
        <div className="single-project-section-head invest-section-head motion-reveal"><h2>Featured developments</h2><div className="single-project-section-copy"><p>Review KPD&apos;s current residential pages, then continue into a private advisory conversation for availability, floor plans, pricing, and payment terms.</p></div></div>
        <div className="pdf-development-cards invest-development-cards">
          <Link className="pdf-dev-card motion-reveal" href="/developments/seven-x-seven"><img src="/legacy/assets/images/project-media/sxs/facade%20right%202.png" alt="Seven X Seven exterior" /><div className="pdf-dev-card-body"><h3>Seven X Seven</h3><p>A Meydan Horizon residence shaped by city access, quiet amenity, and measured daily living.</p><span>Explore</span></div></Link>
          <Link className="pdf-dev-card motion-reveal" style={delay("80ms")} href="/developments/emerald-villa"><img src="/legacy/assets/images/project-media/Emerald%20Villa/37.jpg" alt="Emerald Villa exterior" /><div className="pdf-dev-card-body"><h3>Emerald Villa</h3><p>A private villa composition shaped around garden arrival, privacy, and family-scaled living.</p><span>Explore</span></div></Link>
          <Link className="pdf-dev-card motion-reveal" style={delay("160ms")} href="/developments/dubai-hills-mansion"><img src="/legacy/assets/images/project-media/Dubai%20Hills%20Mansion/6_plex_front_rev_final_1.jpg" alt="Dubai Hills Mansion exterior" /><div className="pdf-dev-card-body"><h3>Dubai Hills Mansion</h3><p>A mansion-scale residence organized around private wellness, gardens, and long-horizon family use.</p><span>Explore</span></div></Link>
        </div>
      </section>

      <section className="invest-faq-section kpd-section kpd-section--compact" aria-label="Investor questions">
        <div className="invest-faq-shell">
          <aside className="invest-faq-aside motion-reveal">
            <i className="fi fi-tr-question invest-icon" aria-hidden="true"></i>
            <span className="kpd-eyebrow">Frequently Asked Questions</span>
            <h2>Answers for the first investment conversation.</h2>
            <p>Use these questions as a starting point before a private review of availability, payment terms, ownership route, and documentation requirements.</p>
          </aside>
          <div className="faq-list invest-faq-list">
            {faq.map(([question, answer], index) => <details className="invest-faq-item motion-reveal" key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="projects-spec-contact invest-contact" aria-label="Begin an investment inquiry">
        <img src="/legacy/assets/images/experience-center/hq/15.jpg" alt="Private advisory workspace at the KPD Experience Center" />
        <div className="projects-spec-contact-copy motion-reveal">
          <span>Investment Inquiry</span>
          <h2>Begin with a private<br />investment review.</h2>
          <p>Discuss budget, project fit, payment milestones, residency planning, and ownership strategy with the KPD advisory team.</p>
          <div className="projects-spec-contact-actions">
            <button type="button" data-booking-open>Book a review</button>
            <Link href="/contact">Contact team</Link>
          </div>
        </div>
      </section>
    </main><SiteShellFooter />
    <InvestEnhancements />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page invest-dubai-page" sources={["/legacy/assets/js/ownership-cost-planner.js?v=20260929"]} />
  </>;
}
