export type TextStyleValue = {
  fontSize?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
};

/// Compact, repeatable CMS controls for text that appears on the public site.
export function TextStyleFields({ prefix, value, label = "Text appearance", preserveDefault = false }: { prefix: string; value?: TextStyleValue; label?: string; preserveDefault?: boolean }) {
  return <fieldset className="cms-editor-section">
    <legend className="cms-subheading">{label}</legend>
    <div className="cms-grid">
      <label className="cms-field"><span>Font size</span><input name={`${prefix}FontSize`} defaultValue={value?.fontSize ?? ""} placeholder="e.g. 18px or 1.25rem" /><small>Leave blank for the site default.</small></label>
      <label className="cms-field"><span>Weight</span><select name={`${prefix}FontWeight`} defaultValue={value?.fontWeight ?? (preserveDefault ? "" : "normal")}>{preserveDefault ? <option value="">Keep delivered weight</option> : null}<option value="normal">Normal</option><option value="bold">Bold</option></select></label>
      <label className="cms-field"><span>Style</span><select name={`${prefix}FontStyle`} defaultValue={value?.fontStyle ?? (preserveDefault ? "" : "normal")}>{preserveDefault ? <option value="">Keep delivered style</option> : null}<option value="normal">Normal</option><option value="italic">Italic</option></select></label>
    </div>
  </fieldset>;
}
