"use client";

import { useActionState } from "react";
import type { OwnershipCostPlanner } from "@/lib/ownership-cost-planner";
import { saveOwnershipCostPlanner, type OwnershipCostPlannerFormState } from "../actions";

const initialState: OwnershipCostPlannerFormState = {};
const rows = (project: OwnershipCostPlanner["projects"][number]) => project.milestones.map((m) => `${m.label} | ${m.percentage} | ${m.date}`).join("\n");

export default function CalculatorForm({ settings }: { settings: OwnershipCostPlanner }) {
  const [state, formAction, pending] = useActionState(saveOwnershipCostPlanner, initialState);
  return <form action={formAction} className="cms-card cms-calculator-form">
    <span className="cms-eyebrow">Public calculator</span><h1>Ownership Cost Planner</h1>
    <p className="cms-muted">These values are currently illustrative. Saving makes them live on the Investor Guide and project calculator sections immediately.</p>
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <section className="cms-editor-section"><h2>Fees and financing</h2><div className="cms-grid">
      <label className="cms-field"><span>DLD transfer fee (%)</span><input name="dldRate" type="number" min="0" step="0.01" defaultValue={settings.dldRate} /></label>
      <label className="cms-field"><span>Registration and admin fee (AED)</span><input name="registrationFee" type="number" min="0" step="1" defaultValue={settings.registrationFee} /></label>
      <label className="cms-field"><span>Mortgage registration (%)</span><input name="mortgageRegistrationRate" type="number" min="0" step="0.01" defaultValue={settings.mortgageRegistrationRate} /></label>
      <label className="cms-field"><span>Mortgage admin fee (AED)</span><input name="mortgageAdminFee" type="number" min="0" step="1" defaultValue={settings.mortgageAdminFee} /></label>
      <label className="cms-field"><span>Bank arrangement fee (%)</span><input name="bankArrangementRate" type="number" min="0" step="0.01" defaultValue={settings.bankArrangementRate} /></label>
      <label className="cms-field"><span>VAT on bank fee (%)</span><input name="vatRate" type="number" min="0" step="0.01" defaultValue={settings.vatRate} /></label>
    </div></section>
    <section className="cms-editor-section"><h2>Maximum loan-to-value</h2><p className="cms-muted">The calculator caps the loan slider using these percentages.</p><div className="cms-grid">
      <label className="cms-field"><span>UAE national (%)</span><input name="ltvNational" type="number" min="0" max="100" defaultValue={settings.ltv.national} /></label>
      <label className="cms-field"><span>UAE resident (%)</span><input name="ltvResident" type="number" min="0" max="100" defaultValue={settings.ltv.resident} /></label>
      <label className="cms-field"><span>Non-resident (%)</span><input name="ltvNonResident" type="number" min="0" max="100" defaultValue={settings.ltv.nonResident} /></label>
    </div></section>
    <section className="cms-editor-section"><h2>Developments</h2><p className="cms-muted">Milestones use one row per payment: <strong>Label | percentage | YYYY-MM-DD</strong>. Ensure the total is 100%.</p>
      <div className="cms-management-grid">{settings.projects.map((project) => <fieldset className="cms-repeat-card" key={project.slug}><legend>{project.name}</legend><input type="hidden" name="projectSlug" value={project.slug} /><label className="cms-field"><span>Starting price (AED)</span><input name="startingPrice" type="number" min="0" step="1000" defaultValue={project.startingPrice} /></label><label className="cms-field"><span>Indicative interest rate (%)</span><input name="interestRate" type="number" min="0" step="0.01" defaultValue={project.interestRate} /></label><label className="cms-field"><span>Payment milestones</span><textarea name="milestones" rows={5} defaultValue={rows(project)} /><small>Dates and amounts are shown in the buyer timeline.</small></label></fieldset>)}</div>
    </section>
    <section className="cms-editor-section"><h2>Disclaimer</h2><label className="cms-field"><span>Public disclaimer</span><textarea name="disclaimer" rows={4} defaultValue={settings.disclaimer} /></label></section>
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save calculator settings"}</button>
  </form>;
}
