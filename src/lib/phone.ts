/// Countries offered next to every phone field on the site (brochure pop-up,
/// "Start a conversation" pop-up, /contact). public/legacy/assets/js/site-cms.js
/// keeps its own copy for the pop-up; phone.test.ts checks the two match.
export const PHONE_COUNTRIES = [
  "United Arab Emirates (+971)", "Saudi Arabia (+966)", "Qatar (+974)", "Kuwait (+965)", "Bahrain (+973)", "Oman (+968)",
  "India (+91)", "Pakistan (+92)", "United Kingdom (+44)", "United States (+1)", "Canada (+1)", "France (+33)", "Germany (+49)",
  "China (+86)", "Japan (+81)", "Singapore (+65)", "Australia (+61)", "Switzerland (+41)", "Italy (+39)", "Spain (+34)",
  "Russia (+7)", "Turkey (+90)", "Egypt (+20)", "Lebanon (+961)", "Jordan (+962)", "South Africa (+27)", "Nigeria (+234)",
  "Brazil (+55)", "Other",
] as const;

/// "United Arab Emirates (+971)" -> "+971"; "Other" -> "+".
export function dialCodeLabel(country: string): string {
  const dial = /\(\+(\d{1,4})\)/.exec(country)?.[1];
  return dial ? `+${dial}` : "+";
}

/// A phone number needs at least 7 digits to be callable.
export function looksLikePhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 7;
}

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
