/// "United Arab Emirates (+971)" + "050 123 4567" -> "+971 50 123 4567".
/// A number the visitor already typed in international form is kept as typed,
/// so the Lead's Phone always carries a country code for calls and duplicate matching.
export function withDialCode(phone: string, country: string): string {
  const typed = phone.trim();
  if (!typed) return "";
  if (typed.startsWith("+")) return typed;
  if (typed.startsWith("00")) return `+${typed.slice(2).trim()}`;
  const dial = /\(\+(\d{1,4})\)/.exec(country)?.[1];
  if (!dial) return typed;
  const local = typed.replace(/^0+/, "");
  if (local.replace(/\D/g, "").startsWith(dial) && local.replace(/\D/g, "").length > 9) return `+${local}`;
  return `+${dial} ${local}`;
}
