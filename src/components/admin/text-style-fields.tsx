export type TextStyleValue = {
  fontSize?: string;
  fontWeight?: "normal" | "bold" | "300" | "400" | "500" | "600" | "700" | "800";
  fontStyle?: "normal" | "italic";
  lineHeight?: string;
};

/// Compact, repeatable CMS controls for text that appears on the public site.
export function TextStyleFields({ prefix, value, label = "Text appearance", preserveDefault = false }: { prefix: string; value?: TextStyleValue; label?: string; preserveDefault?: boolean }) {
  return <fieldset className="cms-editor-section">
    <legend className="cms-subheading">{label}</legend>
    <div className="cms-grid">
      <label className="cms-field"><span>Font size</span><input name={`${prefix}FontSize`} defaultValue={value?.fontSize ?? ""} placeholder="e.g. 18px or 1.25rem" /><small>Leave blank for the site default.</small></label>
      <label className="cms-field"><span>Weight</span><select name={`${prefix}FontWeight`} defaultValue={value?.fontWeight ?? (preserveDefault ? "" : "normal")}>{preserveDefault ? <option value="">Keep delivered weight</option> : null}<option value="300">Light (300)</option><option value="normal">Normal (400)</option><option value="500">Medium (500)</option><option value="600">SemiBold (600)</option><option value="bold">Bold (700)</option><option value="800">ExtraBold (800)</option></select></label>
      <label className="cms-field"><span>Line height</span><input name={`${prefix}LineHeight`} defaultValue={value?.lineHeight ?? ""} placeholder="e.g. 1.4 or 24px" /><small>Leave blank for the site default.</small></label>
      <label className="cms-field"><span>Style</span><select name={`${prefix}FontStyle`} defaultValue={value?.fontStyle ?? (preserveDefault ? "" : "normal")}>{preserveDefault ? <option value="">Keep delivered style</option> : null}<option value="normal">Normal</option><option value="italic">Italic</option></select></label>
    </div>
  </fieldset>;
}
