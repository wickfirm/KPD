// ── The language a form was filled in ────────────────────────────────────────
// A submission from an Arabic or a Japanese page says so: in its details (the
// Messages screen), in the team's copy by email and in the Salesforce lead's
// description, which carries the details. No Salesforce field is added for it
// — the brief asks before any new field. The endpoint's own refusals are
// answered in that language too.
//
// An English submission is exactly what it was: no entry is added and every
// message is the same sentence as before.

import { formMessage, type MessageKey } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale, languageNames, localeFromPath, type Locale } from "@/lib/locales";

/// The language of the page a form was sent from. A form that says it
// (`visitorLanguage`) is believed; otherwise its address says it
// ("/ar/contact"), as the delivered forms only send their address.
export function submissionLanguage(payload: { visitorLanguage?: unknown; sourcePage?: unknown }): Locale {
  if (isLocale(payload.visitorLanguage)) return payload.visitorLanguage;
  if (typeof payload.sourcePage === "string" && payload.sourcePage.startsWith("/")) return localeFromPath(payload.sourcePage).locale;
  return DEFAULT_LOCALE;
}

/// The entry that goes into a submission's details. Nothing for English.
export function languageDetail(locale: Locale): { label: string; value: string } | null {
  return locale === DEFAULT_LOCALE ? null : { label: "Visitor language", value: languageNames[locale] };
}

const REFUSALS = {
  required: { english: "name, email and message are required.", key: "form.required" },
  email: { english: "Invalid email address.", key: "form.invalidEmail" },
  save: { english: "We could not save your enquiry right now. Please try again shortly.", key: "form.error" },
} as const satisfies Record<string, { english: string; key: MessageKey }>;

export type ContactProblem = keyof typeof REFUSALS;

/// The endpoint's refusal in the form's language: the same sentence as always
/// for English, the sheet's wording for the same situation otherwise.
export function contactError(locale: Locale, problem: ContactProblem): string {
  const { english, key } = REFUSALS[problem];
  return formMessage(locale, english, key);
}
