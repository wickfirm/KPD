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
