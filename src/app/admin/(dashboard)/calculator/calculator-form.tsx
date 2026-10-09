"use client";

import { useActionState, useState } from "react";
import type { OwnershipCostPlanner, PlannerMilestone } from "@/lib/ownership-cost-planner";
import { saveOwnershipCostPlanner, type OwnershipCostPlannerFormState } from "../actions";

const initialState: OwnershipCostPlannerFormState = {};

type MilestoneRow = { label: string; percentage: string; date: string };
const toRows = (milestones: PlannerMilestone[]): MilestoneRow[] =>
  milestones.map((milestone) => ({ label: milestone.label, percentage: String(milestone.percentage), date: milestone.date }));

/// Calculator editor rewritten for non-technical editors: every payment step
/// is a labeled row (name / percentage / date) with add and remove buttons,
/// replacing the previous "Label | percentage | date" pipe notation.
export default function CalculatorForm({ settings }: { settings: OwnershipCostPlanner }) {
  const [state, formAction, pending] = useActionState(saveOwnershipCostPlanner, initialState);
  const [rowsByProject, setRowsByProject] = useState<MilestoneRow[][]>(() => settings.projects.map((project) => toRows(project.milestones)));

  const updateRow = (projectIndex: number, rowIndex: number, changes: Partial<MilestoneRow>) =>
    setRowsByProject((all) => all.map((rows, pi) => (pi === projectIndex ? rows.map((row, ri) => (ri === rowIndex ? { ...row, ...changes } : row)) : rows)));
  const addRow = (projectIndex: number) =>
    setRowsByProject((all) => all.map((rows, pi) => (pi === projectIndex ? [...rows, { label: "", percentage: "", date: "" }] : rows)));
  const removeRow = (projectIndex: number, rowIndex: number) =>
    setRowsByProject((all) => all.map((rows, pi) => (pi === projectIndex ? rows.filter((_, ri) => ri !== rowIndex) : rows)));
  const total = (rows: MilestoneRow[]) => rows.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0);

  return <form action={formAction} className="cms-card cms-calculator-form">
    <span className="cms-eyebrow">Public calculator</span><h1>Ownership Cost Planner</h1>
    <p className="cms-muted">These values are currently illustrative. Saving makes them live on the Investor Guide calculator immediately — no developer needed.</p>
    {state.error ? <p className="cms-error">{state.error}</p> : null}

    <section className="cms-editor-section"><h2>Fees and financing</h2><p className="cms-muted">Standard one-off costs applied to every calculation.</p><div className="cms-grid">
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

    <section className="cms-editor-section"><h2>Developments and payment steps</h2>
      <p className="cms-muted">Each development has a starting price, an indicative interest rate, and the payment steps buyers see in the timeline. Add one row per payment; the percentages must add up to 100%.</p>
      <div className="cms-management-grid">{settings.projects.map((project, projectIndex) => {
        const rows = rowsByProject[projectIndex] ?? [];
        return <fieldset className="cms-repeat-card" key={project.slug}>
          <legend>{project.name}</legend>
          <input type="hidden" name="projectSlug" value={project.slug} />
          <input type="hidden" name={`milestoneCount-${projectIndex}`} value={rows.length} />
          <div className="cms-grid">
            <label className="cms-field"><span>Starting price (AED)</span><input name="startingPrice" type="number" min="0" step="1000" defaultValue={project.startingPrice} /></label>
            <label className="cms-field"><span>Indicative interest rate (%)</span><input name="interestRate" type="number" min="0" step="0.01" defaultValue={project.interestRate} /></label>
          </div>
          <h4>Payment steps shown to buyers</h4>
          {rows.map((row, rowIndex) => <div className="cms-milestone-row" key={rowIndex}>
            <label className="cms-field"><span>Step name</span><input name={`ml-${projectIndex}-${rowIndex}`} value={row.label} onChange={(event) => updateRow(projectIndex, rowIndex, { label: event.target.value })} placeholder="Booking" /></label>
            <label className="cms-field"><span>%</span><input name={`mp-${projectIndex}-${rowIndex}`} type="number" min="0" max="100" step="0.01" value={row.percentage} onChange={(event) => updateRow(projectIndex, rowIndex, { percentage: event.target.value })} /></label>
            <label className="cms-field"><span>Date</span><input name={`md-${projectIndex}-${rowIndex}`} type="date" value={row.date} onChange={(event) => updateRow(projectIndex, rowIndex, { date: event.target.value })} /></label>
            <button className="cms-milestone-row__remove" type="button" onClick={() => removeRow(projectIndex, rowIndex)}>Remove</button>
          </div>)}
          <p className={`cms-milestone-total${Math.abs(total(rows) - 100) < 0.01 ? "" : " is-off"}`}><span>Running total</span><strong>{Math.round(total(rows) * 100) / 100}% {Math.abs(total(rows) - 100) < 0.01 ? "✓" : "— must reach 100%"}</strong></p>
          <button className="cms-btn cms-btn--ghost" type="button" onClick={() => addRow(projectIndex)}>Add payment step</button>
        </fieldset>;
      })}</div>
    </section>

    <section className="cms-editor-section"><h2>Disclaimer</h2><label className="cms-field"><span>Public disclaimer</span><textarea name="disclaimer" rows={4} defaultValue={settings.disclaimer} /></label></section>
    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save calculator settings"}</button></div>
  </form>;
}
