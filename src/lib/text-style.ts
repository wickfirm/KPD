/// Editor-controlled type for one piece of public text. Values are optional:
/// a blank control keeps the delivered size, weight, or style. The delivered
/// Figtree face is variable (300–900), so numeric weights are safe; "normal"
/// stays for rows saved before numeric weights were offered (it equals 400).
export type TextStyle = {
  fontSize?: string;
  fontWeight?: "normal" | "bold" | "300" | "400" | "500" | "600" | "700" | "800";
  fontStyle?: "normal" | "italic";
  /// Unitless multiplier (1.5) or a CSS length, like fontSize.
  lineHeight?: string;
};

const LENGTH = /^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em|%|vw|vh)|clamp\([0-9.%\sremvw,()+-]+\))$/i;
const WEIGHTS = new Set(["normal", "bold", "300", "400", "500", "600", "700", "800"]);
const LINE_HEIGHT = /^(?:[0-9]+(?:\.[0-9]+)?|(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em|%)))$/i;

/// Line height accepts a unitless multiplier or a plain length.
export function safeLineHeight(value?: string) {
  const trimmed = value?.trim() ?? "";
  return LINE_HEIGHT.test(trimmed) ? trimmed : "";
}

/// CMS typography accepts only CSS length values, so a saved size cannot
/// become arbitrary CSS in the public document.
export function safeLength(value?: string) {
  const trimmed = value?.trim() ?? "";
  return LENGTH.test(trimmed) ? trimmed : "";
}

export function textStyleFromForm(formData: FormData, prefix: string): TextStyle | undefined {
  const fontSize = safeLength(String(formData.get(`${prefix}FontSize`) || ""));
  const weight = String(formData.get(`${prefix}FontWeight`) || "");
  const slant = String(formData.get(`${prefix}FontStyle`) || "");
  const lineHeight = safeLineHeight(String(formData.get(`${prefix}LineHeight`) || ""));
  const fontWeight = WEIGHTS.has(weight) ? (weight as TextStyle["fontWeight"]) : undefined;
  const fontStyle = slant === "italic" || slant === "normal" ? slant : undefined;
  if (!fontSize && !fontWeight && !fontStyle && !lineHeight) return undefined;
  return { ...(fontSize ? { fontSize } : {}), ...(fontWeight ? { fontWeight } : {}), ...(fontStyle ? { fontStyle } : {}), ...(lineHeight ? { lineHeight } : {}) };
}

export function cleanTextStyle(value: unknown): TextStyle | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const fontSize = typeof source.fontSize === "string" ? safeLength(source.fontSize) : "";
  const fontWeight = typeof source.fontWeight === "string" && WEIGHTS.has(source.fontWeight) ? (source.fontWeight as TextStyle["fontWeight"]) : undefined;
  const fontStyle = source.fontStyle === "italic" || source.fontStyle === "normal" ? source.fontStyle : undefined;
  const lineHeight = typeof source.lineHeight === "string" ? safeLineHeight(source.lineHeight) : "";
  if (!fontSize && !fontWeight && !fontStyle && !lineHeight) return undefined;
  return { ...(fontSize ? { fontSize } : {}), ...(fontWeight ? { fontWeight } : {}), ...(fontStyle ? { fontStyle } : {}), ...(lineHeight ? { lineHeight } : {}) };
}

/// Inline style for a React element. Unsafe sizes are dropped.
export function textStyleProps(value?: TextStyle | null): { fontSize?: string; fontWeight?: TextStyle["fontWeight"]; fontStyle?: "normal" | "italic"; lineHeight?: string } | undefined {
  const clean = cleanTextStyle(value);
  if (!clean) return undefined;
  return clean;
}

/// A safe style attribute for CMS text that is written into an HTML string.
export function textStyleAttribute(value?: TextStyle | null) {
  const clean = cleanTextStyle(value);
  if (!clean) return "";
  const css = [
    clean.fontSize ? `font-size:${clean.fontSize}` : "",
    clean.fontWeight ? `font-weight:${clean.fontWeight}` : "",
    clean.fontStyle ? `font-style:${clean.fontStyle}` : "",
    clean.lineHeight ? `line-height:${clean.lineHeight}` : "",
  ].filter(Boolean).join(";");
  return css ? ` style="${css}"` : "";
}
