/// Pure copies of the two public calculators, so the amounts can be checked
/// without a browser. The investor-page script (mortgage-calculator.js) and
/// the ownership planner (ownership-cost-planner.js) must keep these formulas.

export function monthlyPayment(principal: number, annualRatePercent: number, years: number) {
  const months = years * 12;
  if (!Number.isFinite(principal) || principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (!monthlyRate) return principal / months;
  const growth = (1 + monthlyRate) ** months;
  return principal * (monthlyRate * growth) / (growth - 1);
}

/// Investor-page mortgage calculator. Fees match the labels in the delivered
/// markup: 4% land department, AED 4,200 trustee, 0.25% + AED 290 mortgage
/// registration, 2% + 5% VAT agency, 1% + 5% VAT bank, AED 3,000 + 5% VAT valuation.
export function mortgageQuote(input: { price: number; depositPercent: number; years: number; annualRate: number }) {
  const price = input.price;
  const deposit = price * (input.depositPercent / 100);
  const loan = Math.max(0, price - deposit);
  const dldCost = price * 0.04;
  const trusteeCost = 4200;
  const registrationCost = loan * 0.0025 + 290;
  const agencyCost = price * 0.02 * 1.05;
  const bankCost = loan * 0.01 * 1.05;
  const valuationCost = 3000 * 1.05;
  const purchaseCosts = dldCost + trusteeCost + registrationCost + agencyCost + bankCost + valuationCost;
  return {
    deposit,
    loan,
    monthly: monthlyPayment(loan, input.annualRate, input.years),
    dldCost,
    trusteeCost,
    registrationCost,
    agencyCost,
    bankCost,
    valuationCost,
    purchaseCosts,
    totalUpfront: deposit + purchaseCosts,
  };
}

export type PlannerMilestone = { label: string; percentage: number };
export type OwnershipPlanInput = {
  price: number;
  milestones: PlannerMilestone[];
  finance: boolean;
  loanPercent: number;
  annualRate: number;
  years: number;
  dldRate: number;
  registrationFee: number;
  mortgageRegistrationRate: number;
  mortgageAdminFee: number;
  bankArrangementRate: number;
  vatRate: number;
};

/// Ownership Cost Planner. The loan is capped by the caller (LTV and the
/// handover milestone). Only the financed part of the last milestone is deferred.
export function ownershipPlan(input: OwnershipPlanInput) {
  const price = input.price;
  const loan = input.finance ? price * input.loanPercent / 100 : 0;
  const dld = price * input.dldRate / 100;
  const baseFees = dld + input.registrationFee;
  const mortgageRegistration = input.finance ? loan * input.mortgageRegistrationRate / 100 + input.mortgageAdminFee : 0;
  const bankFee = input.finance ? loan * input.bankArrangementRate / 100 * (1 + input.vatRate / 100) : 0;
  const last = input.milestones.length - 1;
  const milestoneCash = input.milestones.reduce((sum, milestone, index) => {
    const amount = price * milestone.percentage / 100;
    return sum + (input.finance && index === last ? Math.max(0, amount - loan) : amount);
  }, 0);
  return {
    dld,
    baseFees,
    loan,
    mortgageRegistration,
    bankFee,
    milestoneCash,
    beforeKeys: milestoneCash + baseFees + mortgageRegistration + bankFee,
    monthly: input.finance ? monthlyPayment(loan, input.annualRate, input.years) : 0,
  };
}

/// Same cap the planner applies: the lesser of the residency LTV and the
/// handover milestone, expressed as a percent of the price.
export function maximumLoanPercent(price: number, ltvPercent: number, handoverPercent: number) {
  if (price <= 0) return 0;
  const maximumLoan = Math.min(ltvPercent / 100 * price, handoverPercent / 100 * price);
  return Math.round(maximumLoan / price * 100);
}
