/// Canonical Invest in Dubai content as delivered by the client (public/legacy/
/// invest-in-dubai.html). Single source of truth for the public page fallbacks
/// and the admin investor-guide editor. Pure data - safe for client components.

export type IconCard = { icon: string; title: string; text: string };
export type YieldRow = { code: string; city: string; yieldLabel: string; yieldBar: string; trend: "up" | "down"; gainLabel: string; gainBar: string };
export type FaqItem = { question: string; answer: string };
export type FeaturedCard = { href: string; image: string; title: string; copy: string };
export type Metric = { value: string; label: string };

export type PanelSection = { eyebrow: string; heading: string; text: string; button: string; image: string; cards: IconCard[] };

export type InvestContent = {
  metrics: Metric[];
  benefits: { heading: string; text: string; items: IconCard[] };
  market: { heading: string; text: string; rows: YieldRow[] };
  residency: PanelSection;
  pathway: { heading: string; text: string; button: string; steps: IconCard[] };
  trust: PanelSection;
  liquidity: { heading: string; text: string; feature: IconCard; cards: IconCard[] };
  featured: { heading: string; text: string; cards: FeaturedCard[] };
  faq: { eyebrow: string; heading: string; text: string; items: FaqItem[] };
  contact: { eyebrow: string; heading: string; text: string; image: string; primaryLabel: string; secondaryLabel: string };
};

/// Everything the editor may save: any part can be missing and falls back to
/// the delivered default (lists replace the default list as a whole).
export type InvestSaved = { [K in keyof InvestContent]?: InvestContent[K] extends unknown[] ? InvestContent[K] : Partial<InvestContent[K]> };

export const investDefaults: InvestContent = {
  metrics: [
    { value: "Global", label: "Capital access" },
    { value: "Dubai", label: "Freehold market" },
    { value: "KPD", label: "Disciplined delivery" },
  ],
  benefits: {
    heading: "Why Dubai remains investable",
    text: "Quick answers to the core motivations behind Dubai investment: regulated ownership, business mobility, rental demand, and a city that continues to attract global residents and capital.",
    items: [
      { icon: "fi-tr-shield-check", title: "Government-backed market", text: "Clear title registration, regulated escrow, and defined transaction steps give international buyers a visible framework for decision-making." },
      { icon: "fi-tr-chart-line-up", title: "Capital growth", text: "Prime Dubai districts continue to benefit from population growth, infrastructure investment, and sustained end-user demand." },
      { icon: "fi-tr-user-shield", title: "World-class safety", text: "Governance, security, infrastructure, and daily quality of life support Dubai's appeal for families, entrepreneurs, and global residents." },
      { icon: "fi-tr-home", title: "Rental yield depth", text: "Leasing demand is supported by business relocation, international mobility, tourism, schools, and a growing base of long-term residents." },
      { icon: "fi-tr-contract", title: "Transparent process", text: "Buyers can evaluate fees, documents, ownership route, payment milestones, and handover obligations before committing." },
      { icon: "fi-tr-wallet-money", title: "Flexible entry options", text: "Off-plan and ready homes create different routes for investors reviewing cash flow, handover timing, and portfolio balance." },
      { icon: "fi-tr-world", title: "Global mobility", text: "Residency pathways, aviation connectivity, and a pro-business environment make Dubai a practical base as well as an investment market." },
      { icon: "fi-tr-route", title: "Exit planning", text: "Resale, leasing readiness, and holding strategy can be planned from the beginning so the purchase is evaluated beyond acquisition day." },
    ],
  },
  market: {
    heading: "Dubai vs Global Hubs: Rental Yield at a Glance",
    text: "A compact comparison of rental yield and capital appreciation signals across major global hubs, presented as a decision board for first-pass market review.",
    rows: [
      { code: "AE", city: "Dubai", yieldLabel: "7.5%", yieldBar: "100%", trend: "up", gainLabel: "+41.6%", gainBar: "100%" },
      { code: "US", city: "San Francisco", yieldLabel: "6.6%", yieldBar: "88%", trend: "up", gainLabel: "+33.2%", gainBar: "80%" },
      { code: "SG", city: "Singapore", yieldLabel: "3.0%", yieldBar: "40%", trend: "up", gainLabel: "+18.4%", gainBar: "44%" },
      { code: "GB", city: "London", yieldLabel: "3.3%", yieldBar: "44%", trend: "down", gainLabel: "-2.7%", gainBar: "6%" },
      { code: "FR", city: "Paris", yieldLabel: "2.9%", yieldBar: "39%", trend: "down", gainLabel: "-8.5%", gainBar: "20%" },
      { code: "HK", city: "Hong Kong", yieldLabel: "2.2%", yieldBar: "29%", trend: "down", gainLabel: "-30.5%", gainBar: "73%" },
    ],
  },
  residency: {
    eyebrow: "Golden Visa Through Property Investment",
    heading: "Residency planning, reviewed with the purchase.",
    text: "For many buyers, Dubai real estate is part investment and part long-term personal infrastructure. KPD frames the conversation around ownership use, qualifying asset value, documentation route, and family planning before a commitment is made.",
    button: "Discuss eligibility",
    image: "/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg",
    cards: [
      { icon: "fi-tr-badge-check", title: "Eligibility review", text: "Asset value, ownership route, and current residency conditions are reviewed with appointed advisors." },
      { icon: "fi-tr-folder-open", title: "Document clarity", text: "Buyer information, transaction documents, and handover steps are organized as one advisory path." },
      { icon: "fi-tr-users-alt", title: "Family planning", text: "End use, leasing, schooling, mobility, and longer-term living intentions are considered together." },
    ],
  },
  pathway: {
    heading: "Investment pathway",
    text: "The process is kept simple: understand the brief, select the asset, review payment terms, document eligibility routes, and plan the ownership phase before handover.",
    button: "Begin inquiry",
    steps: [
      { icon: "fi-tr-route", title: "Define the brief", text: "Budget, use case, timing, preferred address, and holding strategy are clarified first." },
      { icon: "fi-tr-house-building", title: "Select the residence", text: "Available homes are reviewed against layout, view, location logic, payment terms, and daily livability." },
      { icon: "fi-tr-contract", title: "Confirm documents", text: "Buyer details, reservation documents, payment schedule, and transaction requirements are prepared." },
      { icon: "fi-tr-receipt", title: "Register the plan", text: "Payment milestones, ownership route, and handover obligations are tracked through one clear process." },
      { icon: "fi-tr-key", title: "Plan handover", text: "Completion, inspection, leasing, furnishing, or end-use planning is discussed before possession." },
    ],
  },
  trust: {
    eyebrow: "Developer Trust & Delivery",
    heading: "Review the platform behind the address.",
    text: "KPD extends Kasumigaseki Capital's discipline into Dubai through measured residential development, clear documentation, and a delivery culture shaped around long-horizon value.",
    button: "Speak to advisory",
    image: "/legacy/assets/images/library/modern-financial-office-buildings-2026-03-18-04-41-23-utc.jpg",
    cards: [
      { icon: "fi-tr-building", title: "Development discipline", text: "Each project is reviewed around site logic, specification, buildability, and buyer use." },
      { icon: "fi-tr-bank", title: "Capital strength", text: "The platform is shaped by institutional investment thinking and careful project sequencing." },
      { icon: "fi-tr-user-shield", title: "Buyer confidence", text: "Documentation, quality control, and advisory coordination are kept visible throughout." },
    ],
  },
  liquidity: {
    heading: "Market Liquidity & Exit",
    text: "Dubai's active ownership market allows investors to review entry and exit together: demand depth, resale timing, rental readiness, and buyer appetite are part of the same conversation.",
    feature: { icon: "fi-tr-chart-mixed", title: "Liquidity is planned before purchase.", text: "Location, unit mix, handover date, price band, and future tenant profile are evaluated early so the asset has a clearer resale or leasing story later." },
    cards: [
      { icon: "fi-tr-chart-histogram", title: "Active resale market", text: "Comparable transactions and buyer demand help frame potential exit timing." },
      { icon: "fi-tr-handshake", title: "Tenant depth", text: "Business relocation, families, and global residents support leasing activity." },
      { icon: "fi-tr-receipt", title: "Clear transfer route", text: "Fees, transfer steps, and documentation expectations are reviewed in advance." },
      { icon: "fi-tr-arrow-trend-up", title: "Holding strategy", text: "Rental, resale, end-use, or hybrid ownership paths can be compared before commitment." },
    ],
  },
  featured: {
    heading: "Featured developments",
    text: "Review KPD's current residential pages, then continue into a private advisory conversation for availability, floor plans, pricing, and payment terms.",
    cards: [
      { href: "/developments/seven-x-seven", image: "/legacy/assets/images/project-media/sxs/facade%20right%202.png", title: "Seven X Seven", copy: "A Meydan Horizon residence shaped by city access, quiet amenity, and measured daily living." },
      { href: "/developments/emerald-villa", image: "/legacy/assets/images/project-media/Emerald%20Villa/37.jpg", title: "Emerald Villa", copy: "A private villa composition shaped around garden arrival, privacy, and family-scaled living." },
      { href: "/developments/dubai-hills-mansion", image: "/legacy/assets/images/project-media/Dubai%20Hills%20Mansion/6_plex_front_rev_final_1.jpg", title: "Dubai Hills Mansion", copy: "A mansion-scale residence organized around private wellness, gardens, and long-horizon family use." },
    ],
  },
  faq: {
    eyebrow: "Frequently Asked Questions",
    heading: "Answers for the first investment conversation.",
    text: "Use these questions as a starting point before a private review of availability, payment terms, ownership route, and documentation requirements.",
    items: [
      { question: "Can international buyers purchase property in Dubai?", answer: "International buyers can purchase property in designated ownership areas, subject to the current transaction, registration, and documentation process for the selected asset." },
      { question: "Can property investment support residency planning?", answer: "Qualifying property investment may be reviewed as part of current residency eligibility routes. Requirements can change, so final advice should be checked against official channels and appointed advisors." },
      { question: "How should I compare off-plan payment plans?", answer: "Compare the booking amount, construction-linked milestones, handover balance, post-handover terms, total cost, expected completion timing, and the strength of the location and product brief." },
      { question: "What should I review before resale or leasing?", answer: "Review comparable supply, expected handover timing, service charges, tenant demand, view, layout, payment history, and the clarity of the ownership documentation." },
      { question: "What happens after I select a residence?", answer: "The KPD team can coordinate availability review, floor plan discussion, payment plan explanation, and the next documentation steps for the selected development." },
    ],
  },
  contact: {
    eyebrow: "Investment Inquiry",
    heading: "Begin with a private\ninvestment review.",
    text: "Discuss budget, project fit, payment milestones, residency planning, and ownership strategy with the KPD advisory team.",
    image: "/legacy/assets/images/experience-center/hq/15.jpg",
    primaryLabel: "Book a review",
    secondaryLabel: "Contact team",
  },
};

/// Icon names available in the delivered icon set (Flaticon uicons, thin
/// rounded) - offered as suggestions in the editor.
export const investIcons = [
  "fi-tr-shield-check", "fi-tr-chart-line-up", "fi-tr-user-shield", "fi-tr-home", "fi-tr-contract", "fi-tr-wallet-money", "fi-tr-world", "fi-tr-route",
  "fi-tr-house-building", "fi-tr-receipt", "fi-tr-key", "fi-tr-badge-check", "fi-tr-folder-open", "fi-tr-users-alt", "fi-tr-building", "fi-tr-bank",
  "fi-tr-chart-mixed", "fi-tr-chart-histogram", "fi-tr-handshake", "fi-tr-arrow-trend-up", "fi-tr-passport", "fi-tr-building-shield", "fi-tr-calendar-clock", "fi-tr-file-invoice-dollar", "fi-tr-question",
];

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/// Field-wise merge for an object section; list-valued sections replace the
/// default list as a whole when the editor saved at least one entry.
function mergeSection<T extends object>(base: T, saved: unknown): T {
  const out = { ...base } as Record<string, unknown>;
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    for (const [key, value] of Object.entries(saved as Record<string, unknown>)) {
      if (!(key in out)) continue;
      const current = out[key];
      if (Array.isArray(current)) { if (Array.isArray(value) && value.length) out[key] = value; }
      else if (current && typeof current === "object") out[key] = mergeSection(current as object, value);
      else if (nonEmpty(value)) out[key] = value;
    }
  }
  return out as T;
}

/// The page content: saved editor values over the delivered defaults.
export function mergeInvestContent(saved: unknown): InvestContent {
  return mergeSection(investDefaults, saved);
}

/// Clamps arbitrary submitted JSON to the investor-guide schema: only known
/// keys survive, every value is a trimmed string (or an allowed enum), list
/// entries that are completely empty are dropped. The delivered defaults are
/// the template, so the shape can never drift from what the page renders.
function sanitizeLike(template: unknown, value: unknown): unknown {
  if (Array.isArray(template)) {
    const sample = template[0];
    if (!Array.isArray(value) || sample === undefined) return [];
    return value
      .map((item) => sanitizeLike(sample, item))
      .filter((item) => item && typeof item === "object" && Object.entries(item as Record<string, unknown>).some(([key, field]) => key !== "trend" && typeof field === "string" && field.trim() !== ""));
  }
  if (template && typeof template === "object") {
    const source = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(template as Record<string, unknown>).map(([key, child]) => {
      if (key === "trend") return [key, source[key] === "down" ? "down" : "up"];
      return [key, sanitizeLike(child, source[key])];
    }));
  }
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeInvestContent(value: unknown): InvestContent {
  return sanitizeLike(investDefaults, value) as InvestContent;
}
