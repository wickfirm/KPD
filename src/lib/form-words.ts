// ── The words of the delivered script's forms ────────────────────────────────
// The enquiry pop-up is built, and its messages shown, by the delivered
// scripts (public/legacy/assets/js/site-cms.js and inquiry-form-copy.js),
// outside React. They look each word up in a table the footer publishes as
// window.__KPD_CONTACT.text, keyed by the English, and read the pop-up's
// choices from window.__KPD_CONTACT.interestChoices. An English page publishes
// neither and the scripts show their own words, exactly as before.
//
// What a visitor types or picks is not among these: a development reads in the
// page's language and keeps its English name as the value the form posts.

import { formMessage, t, type MessageKey } from "@/lib/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

const WORDS: [string, MessageKey][] = [
  ["Inquiry Form", "popup.title"],
  ["Share a few contact details and the KPD team will coordinate the right advisory conversation.", "popup.intro"],
  ["Minimize inquiry form", "popup.minimize"],
  ["Full name", "popup.fullName"],
  ["Email address", "popup.emailAddress"],
  ["Phone number", "popup.phoneNumber"],
  ["Short message", "popup.shortMessage"],
  ["Interest", "popup.interest"],
  ["Interested in", "popup.interestedIn"],
  ["Online call", "popup.onlineCall"],
  ["Submit inquiry", "popup.submit"],
  ["The KPD team will respond with the right advisory route.", "popup.privacyNote"],
  ["Country code", "form.countryCode"],
  // The enquiry pop-up's own hint for the message (inquiry-form-copy.js).
  ["Message", "form.message"],
];

/// A message and, where the sheet has no row of its own for it yet, the sheet's
/// wording for the same situation.
const MESSAGES: [string, MessageKey, MessageKey?][] = [
  ["Please provide your email address.", "form.provideEmail", "form.invalidEmail"],
  ["Please enter a valid phone number.", "form.invalidPhone"],
  ["Sending your enquiry…", "form.sending"],
  ["Thank you. Your enquiry has been received.", "form.success"],
  ["Unable to send your enquiry.", "form.unableToSend", "form.errorShort"],
  ["Unable to send your enquiry. Please try again.", "form.unableToSendRetry", "form.error"],
];

/// Every English string the delivered script looks up.
export const DELIVERED_FORM_WORDS: readonly string[] = [...WORDS, ...MESSAGES].map(([english]) => english);

/// The table for a page's language: English → the language, for the words that
/// have a translation. English has none, and so does a language the sheet does
/// not cover: the script's own words show then.
export function formWords(locale: Locale): Record<string, string> {
  const table: Record<string, string> = {};
  if (locale === DEFAULT_LOCALE) return table;
  for (const [english, key] of WORDS) {
    const text = t(locale, key);
    if (text !== english) table[english] = text;
  }
  for (const [english, key, fallback] of MESSAGES) {
    const text = formMessage(locale, english, key, fallback);
    if (text !== english) table[english] = text;
  }
  return table;
}

/// Each development's name in the page's language, keyed by its English name,
/// for the ones that differ.
export function projectLabels(english: { slug: string; name: string }[], shown: { slug: string; name: string }[]): Record<string, string> {
  const labels: Record<string, string> = {};
  const bySlug = new Map(shown.map((item) => [item.slug, item.name]));
  for (const item of english) {
    const name = bySlug.get(item.slug);
    if (name && name !== item.name) labels[item.name] = name;
  }
  return labels;
}

/// A choice of the enquiry pop-up: the English it posts, and what is shown.
export type Choice = { value: string; label: string };

/// The four choices the delivered script (inquiry-form-copy.js) lists when
/// Site settings holds no interests and no development is published.
const OWN_INTERESTS = ["Online Call", "Customer Experience Centre Visit", "Investing", "Broker Partnership"];

/// The enquiry pop-up's choices on a page in another language, in the order the
/// script lists them: the interests saved in Site settings where there are
/// any, otherwise each published development and then the script's own four.
/// A choice reads in the page's language and posts the English at the same
/// position of the list — never the translated label. Where a language has no
/// label of its own, the English is shown too.
export function interestChoices(saved: { popupInterests?: string[] }, shown: { popupInterests?: string[] }, developments: { name: string }[] = [], shownDevelopments: { name: string }[] = []): Choice[] {
  const pairs = (english: string[], labels: string[] = []) => english.map((value, index) => ({ value, label: labels[index]?.trim() || value }));
  const savedInterests = (saved.popupInterests ?? []).map((value) => value.trim()).filter(Boolean);
  if (savedInterests.length) return pairs(savedInterests, shown.popupInterests);
  return [...pairs(developments.map((item) => item.name), shownDevelopments.map((item) => item.name)), ...pairs(OWN_INTERESTS)];
}
