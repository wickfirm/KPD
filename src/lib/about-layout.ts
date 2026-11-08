// ── About page (Gallery light) layout helpers ────────────────────────────────
// Pure functions that shape the existing CMS text into the Option 2.1 layout
// without changing a word of it.

/// Splits Mission/Vision text into a large lead line and the muted remainder.
/// A blank line wins (editors can choose the split); otherwise the first
/// sentence becomes the lead.
export function splitLead(value: string): { lead: string; rest: string } {
  const text = value.replace(/\r\n/g, "\n").trim();
  if (!text) return { lead: "", rest: "" };
  const blank = text.split(/\n\s*\n/);
  if (blank.length > 1) return { lead: blank[0].trim(), rest: blank.slice(1).join("\n\n").trim() };
  const match = text.match(/^(.+?[.!?])\s+(\S[\s\S]*)$/);
  if (!match) return { lead: text, rest: "" };
  return { lead: match[1], rest: match[2].trim() };
}

/// A philosophy paragraph as a value card. "Hinshitsu, quality, is an
/// uncompromising commitment…" becomes title "Hinshitsu", caption
/// "01 · Quality" and text "An uncompromising commitment…". Any other
/// paragraph is shown whole under a numbered caption.
export function valueCard(paragraph: string, index: number): { cap: string; title: string; text: string } {
  const number = String(index + 1).padStart(2, "0");
  const match = paragraph.trim().match(/^([^\s,]+),\s*([^,]{1,40}),\s*is\s+([\s\S]+)$/);
  if (!match) return { cap: number, title: "", text: paragraph.trim() };
  const [, title, label, rest] = match;
  const capital = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  return { cap: `${number} · ${capital(label.trim())}`, title, text: capital(rest.trim()) };
}
