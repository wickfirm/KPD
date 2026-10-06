/// Editable content model for the KPD Ownership Cost Planner.
/// The public legacy pages consume this through /api/calculator/kpd.
export type PlannerMilestone = { label: string; percentage: number; date: string };
export type PlannerProject = { slug: string; name: string; startingPrice: number; interestRate: number; milestones: PlannerMilestone[] };
export type OwnershipCostPlanner = {
  dldRate: number;
  registrationFee: number;
  mortgageRegistrationRate: number;
  mortgageAdminFee: number;
  bankArrangementRate: number;
  vatRate: number;
  ltv: { national: number; resident: number; nonResident: number };
  disclaimer: string;
  projects: PlannerProject[];
};

export const ownershipCostPlannerDefaults: OwnershipCostPlanner = {
  dldRate: 4,
  registrationFee: 5_000,
  mortgageRegistrationRate: 0.25,
  mortgageAdminFee: 290,
  bankArrangementRate: 1,
  vatRate: 5,
  ltv: { national: 80, resident: 75, nonResident: 65 },
  disclaimer: "Illustrative figures only. This is not an offer of finance. Fees, lending criteria, payment plans and availability are subject to confirmation by KPD, the relevant authorities and lending partners.",
  projects: [
    { slug: "seven-x-seven", name: "Seven X Seven", startingPrice: 3_000_000, interestRate: 4, milestones: [
      { label: "Booking", percentage: 20, date: "2026-10-01" }, { label: "During construction", percentage: 40, date: "2027-06-01" }, { label: "Handover balance", percentage: 40, date: "2028-12-01" },
    ] },
    { slug: "emerald-villa", name: "Emerald Villa", startingPrice: 5_500_000, interestRate: 4, milestones: [
      { label: "Booking", percentage: 20, date: "2026-10-01" }, { label: "During construction", percentage: 40, date: "2027-08-01" }, { label: "Handover balance", percentage: 40, date: "2029-03-01" },
    ] },
    { slug: "dubai-hills-mansion", name: "Dubai Hills Mansion", startingPrice: 12_000_000, interestRate: 4, milestones: [
      { label: "Booking", percentage: 20, date: "2026-10-01" }, { label: "During construction", percentage: 40, date: "2027-09-01" }, { label: "Handover balance", percentage: 40, date: "2029-06-01" },
    ] },
  ],
};

export function plannerValue(value: unknown): OwnershipCostPlanner {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ownershipCostPlannerDefaults;
  const raw = value as Partial<OwnershipCostPlanner>;
  return {
    ...ownershipCostPlannerDefaults,
    ...raw,
    ltv: { ...ownershipCostPlannerDefaults.ltv, ...(raw.ltv ?? {}) },
    projects: Array.isArray(raw.projects) && raw.projects.length ? raw.projects : ownershipCostPlannerDefaults.projects,
  };
}

/// Server-renders the calculator's HTML shell so it's part of the initial page
/// paint. The planner JS detects the pre-rendered form via data-planner-prerendered
/// and skips its own innerHTML replacement, going straight to wiring up listeners
/// and populating dynamic values.
export function renderPlannerHtml(compact: boolean, projectSlug: string): string {
  const options = ownershipCostPlannerDefaults.projects
    .map((p) => `<option value="${p.slug}"${p.slug === projectSlug ? " selected" : ""}>${p.name}</option>`)
    .join("");
  return `<section class="ownership-planner${compact ? " ownership-planner--compact" : ""}" aria-label="Ownership Cost Planner"><div class="ownership-planner__intro"><span class="kpd-eyebrow">Ownership Cost Planner</span><h2>Plan the path to ownership.</h2><p>Review indicative payment milestones, fees and optional handover financing for your selected KPD residence.</p></div><div class="ownership-planner__body"><form class="ownership-planner__form" novalidate><label><span>Development</span><select data-planner-project>${options}</select></label><label><span>Purchase price</span><div class="ownership-planner__price"><details class="ownership-planner__price-acc" data-planner-price-acc><summary><span><span class="ownership-planner__price-current" data-planner-price-label></span><em class="ownership-planner__price-source" data-planner-price-source></em></span><i aria-hidden="true"></i></summary><div class="ownership-planner__price-list" data-planner-price-list></div><button type="button" class="ownership-planner__price-custom" data-planner-price-custom>Enter a custom amount</button></details><div class="ownership-planner__amount ownership-planner__amount--manual" data-planner-price-manual hidden><span>AED</span><input data-planner-price type="number" min="100000" step="50000" inputmode="numeric" aria-label="Custom purchase price"></div></div></label><label><span>Residency status</span><select data-planner-residency><option value="resident">UAE resident</option><option value="national">UAE national</option><option value="nonResident">Non-resident</option></select></label><label class="ownership-planner__toggle"><input data-planner-finance type="checkbox"><span>Finance handover balance</span></label><div class="ownership-planner__finance" data-planner-finance-fields hidden><label><span>Loan amount <b data-planner-loan-label></b></span><input data-planner-loan type="range" min="0" step="1"><small data-planner-loan-help></small></label><div class="ownership-planner__finance-grid"><label><span>Loan period</span><select data-planner-period><option value="5">5 years</option><option value="10">10 years</option><option value="15">15 years</option><option value="20">20 years</option><option value="25" selected>25 years</option></select></label><label><span>Interest rate</span><div class="ownership-planner__amount"><input data-planner-rate type="number" min="0" max="20" step="0.01" inputmode="decimal"><span>%</span></div></label></div></div></form><div class="ownership-planner__results" aria-live="polite"><div class="ownership-planner__result-head"><span>Indicative plan</span><strong data-planner-before-keys></strong></div><ol class="ownership-planner__timeline" data-planner-timeline></ol><div class="ownership-planner__fees"><h3>One-off fees</h3><dl data-planner-fees></dl></div><div class="ownership-planner__mortgage" data-planner-mortgage hidden><span>Monthly payment after handover</span><strong data-planner-monthly></strong><small data-planner-mortgage-detail></small></div><button class="btn-pill ownership-planner__cta" type="button" data-planner-discuss>Discuss this plan</button><p class="ownership-planner__disclaimer" data-planner-disclaimer></p></div></div></section>`;
}
