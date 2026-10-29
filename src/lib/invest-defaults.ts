/// Canonical Invest in Dubai content as delivered by the client (public/legacy/
/// invest-in-dubai.html). Single source of truth for the public page fallbacks
/// and the admin investor-guide editor. Pure data - safe for client components.

export type IconCard = { icon: string; title: string; text: string };
export type YieldRow = { code: string; city: string; yieldLabel: string; yieldBar: string; trend: "up" | "down"; gainLabel: string; gainBar: string };
export type FaqItem = { question: string; answer: string };
export type FeaturedCard = { href: string; image: string; title: string; copy: string };
export type Metric = { value: string; label: string };

export type PanelSection = { eyebrow: string; heading: string; text: string; button: string; image: string; cards: IconCard[] };
export type PaymentSection = { heading: string; text: string; image: string; cards: IconCard[] };

export const investSectionIds = ["benefits", "market", "payment", "residency", "pathway", "trust", "liquidity", "featured", "faq", "calculator"] as const;
export type InvestSectionId = (typeof investSectionIds)[number];
export const investSectionLabels: Record<InvestSectionId, string> = {
  benefits: "Why Dubai remains investable",
  market: "Yield comparison",
  payment: "Flexible payment plans",
  residency: "Golden Visa / residency",
  pathway: "Investment pathway",
  trust: "Developer trust and delivery",
  liquidity: "Market liquidity and exit",
  featured: "Featured developments",
  faq: "Frequently asked questions",
  calculator: "Mortgage calculator",
};

export type InvestContent = {
  metrics: Metric[];
  benefits: { heading: string; text: string; items: IconCard[] };
  market: { heading: string; text: string; source: string; rows: YieldRow[] };
  payment: PaymentSection;
  paymentVisible: boolean;
  residency: PanelSection;
  pathway: { heading: string; text: string; button: string; steps: IconCard[] };
  trust: PanelSection;
  liquidity: { heading: string; text: string; feature: IconCard; cards: IconCard[] };
  featured: { heading: string; text: string; cards: FeaturedCard[] };
  faq: { eyebrow: string; heading: string; text: string; items: FaqItem[] };
  contact: { eyebrow: string; heading: string; text: string; image: string; primaryLabel: string; secondaryLabel: string };
  sectionOrder: InvestSectionId[];
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
    text: "A regulated ownership framework. International demand. Business mobility. Multiple entry routes. A city built to keep attracting people, capital and enterprise. These are the fundamentals to examine first.",
    items: [
      { icon: "fi-tr-shield-check", title: "A government-backed market", text: "Title registration, regulated escrow and defined transaction steps give international buyers a clear process to review before commitment." },
      { icon: "fi-tr-chart-line-up", title: "Capital growth", text: "Population growth, infrastructure investment and end-user demand continue to shape the case for well-located residential property." },
      { icon: "fi-tr-user-shield", title: "World-class safety", text: "Security, infrastructure and everyday quality of life support Dubai's appeal to families, entrepreneurs and international residents." },
      { icon: "fi-tr-home", title: "Rental yield depth", text: "Business relocation, global mobility, tourism, schools and a growing base of long-term residents all contribute to leasing demand." },
      { icon: "fi-tr-contract", title: "Transparent process", text: "The process can be seen before it is signed. Fees, documents, ownership route, payment milestones and handover obligations can be reviewed in advance." },
      { icon: "fi-tr-wallet-money", title: "Flexible entry options", text: "Off-plan and ready homes create different routes for buyers balancing cash flow, handover timing and portfolio strategy." },
      { icon: "fi-tr-world", title: "A connected hub", text: "Residency pathways, global aviation links and a pro-business environment make Dubai both a practical base and an investment market." },
      { icon: "fi-tr-route", title: "Exit planning", text: "Plan the exit before the entry. Resale, leasing readiness and holding strategy belong in the first conversation, not the last." },
    ],
  },
  market: {
    heading: "Rental Yield at a Glance",
    text: "A first-pass comparison of gross rental yield and capital appreciation across major global hubs.",
    source: "Source: Comparative market data compiled from the Savills World Cities Prime Residential Index and Knight Frank Global Research. Figures represent gross market averages and historical cyclical performance.",
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
    text: "Residency is part of the ownership conversation. For some buyers, Dubai property is both an asset and part of a longer-term personal plan. We frame the discussion around qualifying asset value, ownership structure, documentation route and family intentions before commitment.",
    button: "Discuss eligibility",
    image: "/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg",
    cards: [
      { icon: "fi-tr-badge-check", title: "Eligibility review", text: "Review asset value, ownership route and current residency requirements with appointed advisers and official sources." },
      { icon: "fi-tr-folder-open", title: "Document clarity", text: "Keep buyer information, transaction documents and handover requirements in one visible path." },
      { icon: "fi-tr-users-alt", title: "Family planning", text: "End use, leasing, schooling, mobility and longer-term living intentions should be considered together." },
    ],
  },
  pathway: {
    heading: "Investment pathway",
    text: "Understand the brief. Select the residence. Confirm the documents. Register the plan. Prepare for handover.",
    button: "Begin an enquiry",
    steps: [
      { icon: "fi-tr-route", title: "Define the brief", text: "Budget, use case, timing, preferred address and holding strategy come first." },
      { icon: "fi-tr-house-building", title: "Select the residence", text: "Review available homes against layout, view, location, payment terms and everyday use." },
      { icon: "fi-tr-contract", title: "Confirm the documents", text: "Prepare buyer details, reservation documents, payment schedule and transaction requirements." },
      { icon: "fi-tr-receipt", title: "Register the plan", text: "Track payment milestones, ownership route and handover obligations through one clear process." },
      { icon: "fi-tr-key", title: "Plan the handover", text: "Discuss completion, inspection, leasing, furnishing or end-use before possession." },
    ],
  },
  trust: {
    eyebrow: "Developer Trust & Delivery",
    heading: "Review the platform behind the address.",
    text: "Behind every address, a public-company standard. Kasumigaseki Properties Development is backed by Kasumigaseki Capital, listed on the Tokyo Stock Exchange Prime Market. That institutional framework informs how projects are studied, documented, built and carried beyond handover.",
    button: "Speak to advisory",
    image: "/legacy/assets/images/library/modern-financial-office-buildings-2026-03-18-04-41-23-utc.jpg",
    cards: [
      { icon: "fi-tr-building", title: "Development discipline", text: "Site logic, specification, buildability and buyer use are examined before the project moves forward." },
      { icon: "fi-tr-bank", title: "Capital strength", text: "Institutional investment thinking and careful project sequencing sit behind the development platform." },
      { icon: "fi-tr-user-shield", title: "Buyer confidence", text: "Documentation, quality control and advisory coordination stay visible throughout the ownership journey." },
    ],
  },
  liquidity: {
    heading: "Market Liquidity & Exit",
    text: "Think about the exit before you enter. Dubai's active ownership market allows entry and exit to be considered together: demand depth, resale timing, rental readiness and future buyer appetite belong in the same review.",
    feature: { icon: "fi-tr-chart-mixed", title: "Liquidity is planned before purchase.", text: "Location, unit mix, handover date, price band and future tenant profile should be tested early so the asset has a clearer resale or leasing story later." },
    cards: [
      { icon: "fi-tr-chart-histogram", title: "Active resale market", text: "Comparable transactions and buyer demand can help frame potential exit timing." },
      { icon: "fi-tr-handshake", title: "Tenant depth", text: "Business relocation, families and international residents contribute to leasing activity." },
      { icon: "fi-tr-receipt", title: "Clear transfer route", text: "Review fees, transfer steps and documentation expectations before they become deadlines." },
      { icon: "fi-tr-arrow-trend-up", title: "Holding strategy", text: "Compare rental, resale, end-use and hybrid ownership paths before commitment." },
    ],
  },
  featured: {
    heading: "Featured developments",
    text: "Current developments. Review the current residential collection, then move into a private conversation for availability, floor plans, pricing and payment terms.",
    cards: [
      { href: "/developments/seven-x-seven", image: "/legacy/assets/images/project-media/sxs/facade%20right%202.png", title: "seven x seven Meydan Horizon Residences", copy: "A residence shaped around balance: city and sanctuary, privacy and connection, stillness and play." },
      { href: "/developments/emerald-villa", image: "/legacy/assets/images/project-media/Emerald%20Villa/37.jpg", title: "Villa 174", copy: "A private villa shaped around garden arrival, layered privacy and family-scaled living." },
      { href: "/developments/dubai-hills-mansion", image: "/legacy/assets/images/project-media/Dubai%20Hills%20Mansion/6_plex_front_rev_final_1.jpg", title: "Villa 24", copy: "A mansion-scale home organised around garden, wellness and long-term family life." },
    ],
  },
  payment: {
    heading: "Flexible Payment Plans.",
    text: "Investment structure should be clear before commitment. KPD reviews booking, construction, handover and post-handover obligations as one complete cash-flow path.",
    image: "/legacy/assets/images/library/luxury-downtown-of-dubai-2026-03-19-09-24-48-utc.jpg",
    cards: [
      { icon: "fi-tr-wallet-money", title: "Reservation", text: "Confirm the selected residence, initial booking amount, registration path and payment-plan version before moving forward." },
      { icon: "fi-tr-calendar-clock", title: "Construction milestones", text: "Review scheduled payments against construction progress, target handover and total capital allocation." },
      { icon: "fi-tr-key", title: "Handover balance", text: "Understand completion obligations, handover documentation and the ownership transition before final payment." },
      { icon: "fi-tr-file-invoice-dollar", title: "Post-handover planning", text: "Where available, post-handover terms are reviewed alongside leasing, resale and holding-period objectives." },
    ],
  },
  paymentVisible: true,
  sectionOrder: [...investSectionIds],
  faq: {
    eyebrow: "Frequently Asked Questions",
    heading: "Answers for the first investment conversation.",
    text: "The first questions worth asking. Use these as a starting point before a private review of availability, payment terms, ownership route and documentation requirements.",
    items: [
      { question: "Can international buyers purchase property in Dubai?", answer: "International buyers can purchase property in designated ownership areas, subject to the current transaction, registration, and documentation process for the selected asset." },
      { question: "Can property investment support residency planning?", answer: "Qualifying property investment may be reviewed as part of current residency eligibility routes. Requirements can change, so final advice should be checked against official channels and appointed advisors." },
      { question: "How should I compare off-plan payment plans?", answer: "Review the booking amount, construction-linked milestones, handover balance, post-handover terms, total cost, expected completion timing and the strength of the location and product brief as one complete cash-flow path." },
      { question: "What should I review before resale or leasing?", answer: "Review comparable supply, expected handover timing, service charges, tenant demand, view, layout, payment history, and the clarity of the ownership documentation." },
      { question: "What happens after I select a residence?", answer: "The Kasumigaseki Properties Development team can coordinate availability, floor-plan review, payment-plan explanation and the next documentation steps for the selected development." },
    ],
  },
  contact: {
    eyebrow: "Investment Inquiry",
    heading: "Begin with a private\ninvestment review.",
    text: "Discuss budget, project fit, payment milestones, residency planning and ownership strategy in a private review.",
    image: "/legacy/assets/images/experience-center/hq/15.jpg",
    primaryLabel: "Book a review",
    secondaryLabel: "Contact the team",
  },
};

/// Icon names available in the delivered icon set (Flaticon uicons, thin
/// rounded) - offered as suggestions in the editor.
export const investIcons = [
  "fi-tr-shield-check", "fi-tr-chart-line-up", "fi-tr-user-shield", "fi-tr-home", "fi-tr-contract", "fi-tr-wallet-money", "fi-tr-world", "fi-tr-route",
  "fi-tr-house-building", "fi-tr-receipt", "fi-tr-key", "fi-tr-badge-check", "fi-tr-folder-open", "fi-tr-users-alt", "fi-tr-building", "fi-tr-bank",
  "fi-tr-chart-mixed", "fi-tr-chart-histogram", "fi-tr-handshake", "fi-tr-arrow-trend-up", "fi-tr-passport", "fi-tr-building-shield", "fi-tr-calendar-clock", "fi-tr-file-invoice-dollar", "fi-tr-question",
];

/// The page content is CMS-only. The delivered object above remains a schema
/// template for validation, but is never rendered or used to prefill saves.
export function mergeInvestContent(saved: unknown): InvestContent {
  return sanitizeInvestContent(saved);
}

/// Puts the calculator last and keeps every section once. Unknown ids are dropped.
export function normalizeInvestSectionOrder(value: unknown): InvestSectionId[] {
  const allowed = new Set<string>(investSectionIds);
  const picked: InvestSectionId[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && allowed.has(item) && !picked.includes(item as InvestSectionId)) picked.push(item as InvestSectionId);
    }
  }
  for (const id of investSectionIds) if (!picked.includes(id)) picked.push(id);
  return picked;
}

/// The payment-plan block was hidden in the delivered file. Show its copy until
/// the CMS record has its own, and leave a deliberately hidden section hidden.
export function ensureInvestSections(content: InvestContent): InvestContent {
  if (content.paymentVisible === false) return content;
  const empty = !content.payment.heading && !content.payment.text && !content.payment.image && content.payment.cards.length === 0;
  if (!empty) return content;
  return { ...content, payment: { ...investDefaults.payment, cards: investDefaults.payment.cards.map((card) => ({ ...card })) } };
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
  const { sectionOrder: _sectionOrder, paymentVisible: _paymentVisible, ...shape } = investDefaults;
  const content = sanitizeLike(shape, value) as Omit<InvestContent, "sectionOrder" | "paymentVisible">;
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    ...content,
    paymentVisible: source.paymentVisible === false ? false : true,
    sectionOrder: normalizeInvestSectionOrder(source.sectionOrder),
  };
}
