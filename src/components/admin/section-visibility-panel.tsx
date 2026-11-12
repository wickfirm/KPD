import { saveSectionVisibility, toggleSectionVisibility } from "@/app/admin/(dashboard)/section-visibility-actions";
import { loadHiddenSections } from "@/lib/section-visibility-store";
import { ownSwitchNotes, type SectionDef } from "@/lib/section-visibility";

/// "Sections on this page": one Show switch per block of a public page. A
/// hidden block keeps its content in the editor below and comes back exactly
/// as it was when it is switched on again. Saves on its own button, separately
/// from the content form.
export async function SectionVisibilityPanel({ page, sections, returnTo, noteKey }: { page: string; sections: SectionDef[]; returnTo: string; noteKey?: string }) {
  const hidden = new Set(await loadHiddenSections(page));
  const hiddenCount = sections.filter((section) => hidden.has(section.id)).length;
  const note = ownSwitchNotes[noteKey ?? page];
  return <details className="cms-card cms-card--settings cms-sections-panel" id="sections-visibility" data-unsaved-label="Sections on this page" open={hiddenCount > 0}>
    <summary>
      <span className="cms-card-intro"><span className="cms-eyebrow">Page layout</span><h2>Sections on this page</h2></span>
      <span className={`cms-badge cms-badge--${hiddenCount ? "DRAFT" : "PUBLISHED"}`}>{hiddenCount ? `${hiddenCount} hidden` : "All shown"}</span>
    </summary>
    <form action={saveSectionVisibility}>
      <p className="cms-muted">Untick a section to hide it from the live page. Its content stays here, so ticking it again brings it back exactly as it was.{note ? ` ${note}` : ""}</p>
      <input type="hidden" name="page" value={page} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="cms-sections-panel__grid">
        {sections.map((section) => <label className="cms-check" key={section.id}>
          <input type="checkbox" name={`show:${section.id}`} defaultChecked={!hidden.has(section.id)} />
          <span><strong>{section.label}</strong>{section.hint ? <small className="cms-muted">{section.hint}</small> : null}</span>
        </label>)}
      </div>
      <div className="cms-actions"><button className="cms-btn" type="submit">Save sections</button></div>
    </form>
  </details>;
}

/// The Hide / Show button on one section's own card in an editor, so a block
/// can be switched off where it is edited. Same setting as the panel above.
export function SectionToggle({ page, section, hidden, returnTo }: { page: string; section: string; hidden: boolean; returnTo: string }) {
  return <form action={toggleSectionVisibility} className="cms-section-toggle">
    <input type="hidden" name="page" value={page} />
    <input type="hidden" name="section" value={section} />
    <input type="hidden" name="hide" value={hidden ? "0" : "1"} />
    <input type="hidden" name="returnTo" value={returnTo} />
    <button className={`cms-btn cms-btn--small ${hidden ? "" : "cms-btn--ghost"}`} type="submit" title={hidden ? "Show this section on the live page again" : "Hide this section from the live page; its content is kept"}>{hidden ? "Show on page" : "Hide from page"}</button>
  </form>;
}

/// A "Hidden" label for a section card whose block is switched off.
export function HiddenBadge() {
  return <span className="cms-badge cms-badge--DRAFT">Hidden on page</span>;
}
