import { describe, expect, it } from "vitest";
import { maximumLoanPercent, monthlyPayment, mortgageQuote, ownershipPlan } from "./calculator-math";

describe("investor mortgage calculator", () => {
  it("matches the standard amortising payment", () => {
    // PMT(1% per month, 12 months, 100,000) is 8,884.88.
    expect(monthlyPayment(100_000, 12, 1)).toBeCloseTo(8884.878867, 2);
    expect(monthlyPayment(100_000, 0, 1)).toBeCloseTo(100_000 / 12, 6);
    expect(monthlyPayment(0, 4, 25)).toBe(0);
  });

  it("matches the worked example printed in the calculator", () => {
    // Price AED 5,000,000, 40% down, 25 years, 4.54%. The markup shows these
    // amounts as the initial result, so a formula change shows up here.
    const quote = mortgageQuote({ price: 5_000_000, depositPercent: 40, years: 25, annualRate: 4.54 });
    expect(quote.deposit).toBe(2_000_000);
    expect(quote.loan).toBe(3_000_000);
    expect(quote.dldCost).toBe(200_000);
    expect(quote.trusteeCost).toBe(4_200);
    expect(quote.registrationCost).toBe(7_790);
    expect(quote.agencyCost).toBe(105_000);
    expect(quote.bankCost).toBe(31_500);
    expect(quote.valuationCost).toBe(3_150);
    expect(quote.purchaseCosts).toBe(351_640);
    expect(quote.totalUpfront).toBe(2_351_640);
    expect(Math.round(quote.monthly)).toBe(16_743);
  });
});

describe("ownership cost planner", () => {
  const milestones = [
    { label: "Booking", percentage: 20 },
    { label: "During construction", percentage: 40 },
    { label: "Handover balance", percentage: 40 },
  ];
  const fees = {
    dldRate: 4,
    registrationFee: 5_000,
    mortgageRegistrationRate: 0.25,
    mortgageAdminFee: 290,
    bankArrangementRate: 1,
    vatRate: 5,
  };

  it("adds the full price and the one-off fees when nothing is financed", () => {
    const plan = ownershipPlan({ price: 3_000_000, milestones, finance: false, loanPercent: 0, annualRate: 4, years: 25, ...fees });
    expect(plan.dld).toBe(120_000);
    expect(plan.milestoneCash).toBe(3_000_000);
    expect(plan.beforeKeys).toBe(3_125_000);
    expect(plan.monthly).toBe(0);
  });

  it("defers only the financed part of the handover milestone", () => {
    const cap = maximumLoanPercent(3_000_000, 75, 40);
    expect(cap).toBe(40);
    const plan = ownershipPlan({ price: 3_000_000, milestones, finance: true, loanPercent: cap, annualRate: 4, years: 25, ...fees });
    expect(plan.loan).toBe(1_200_000);
    expect(plan.milestoneCash).toBe(1_800_000);
    expect(plan.mortgageRegistration).toBe(3_290);
    expect(plan.bankFee).toBe(12_600);
    expect(plan.beforeKeys).toBe(1_940_890);
    expect(Math.round(plan.monthly)).toBe(6_334);
  });

  it("caps the loan by residency when that is tighter than the handover balance", () => {
    expect(maximumLoanPercent(3_000_000, 50, 40)).toBe(40);
    expect(maximumLoanPercent(3_000_000, 30, 40)).toBe(30);
  });
});
