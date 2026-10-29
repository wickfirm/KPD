/// Editor-controlled type for one piece of public text. Values are optional:
/// a blank control keeps the delivered size, weight, or style.
export type TextStyle = {
  fontSize?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
};

const LENGTH = /^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em|%|vw|vh)|clamp\([0-9.%\sremvw,()+-]+\))$/i;

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
  const fontWeight = weight === "bold" || weight === "normal" ? weight : undefined;
  const fontStyle = slant === "italic" || slant === "normal" ? slant : undefined;
  if (!fontSize && !fontWeight && !fontStyle) return undefined;
  return { ...(fontSize ? { fontSize } : {}), ...(fontWeight ? { fontWeight } : {}), ...(fontStyle ? { fontStyle } : {}) };
}

export function cleanTextStyle(value: unknown): TextStyle | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const fontSize = typeof source.fontSize === "string" ? safeLength(source.fontSize) : "";
  const fontWeight = source.fontWeight === "bold" || source.fontWeight === "normal" ? source.fontWeight : undefined;
  const fontStyle = source.fontStyle === "italic" || source.fontStyle === "normal" ? source.fontStyle : undefined;
  if (!fontSize && !fontWeight && !fontStyle) return undefined;
  return { ...(fontSize ? { fontSize } : {}), ...(fontWeight ? { fontWeight } : {}), ...(fontStyle ? { fontStyle } : {}) };
}

/// Inline style for a React element. Unsafe sizes are dropped.
export function textStyleProps(value?: TextStyle | null): { fontSize?: string; fontWeight?: "normal" | "bold"; fontStyle?: "normal" | "italic" } | undefined {
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
  ].filter(Boolean).join(";");
  return css ? ` style="${css}"` : "";
}
