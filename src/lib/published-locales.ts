// ─────────────────────────────────────────────────────────────────────────────
// Published languages (Site settings → Languages). Pure; see locale.ts for
// reading them on the server.
//
// One site_settings row, key "locales": { "ar": true, "ja": false, "switcher":
// false }. Each language other than English has its own switch, and both are
// off until the client turns them on; English is always on. "switcher" decides
// whether the language switcher is offered at all: a language can be on (so it
// can be reached at its address) while the switcher stays off.
// ─────────────────────────────────────────────────────────────────────────────

import { locales, type Locale } from "./locales";

export const localesSettingKey = "locales";

/// The languages switched on. Anything that is not exactly `true` counts as off,
/// as does a missing or malformed row: an unpublished language stays a 404.
export function parsePublishedLocales(value: unknown): Locale[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const row = value as Record<string, unknown>;
  return locales.filter((locale): locale is Locale => locale !== "en" && row[locale] === true);
}

/// Whether the language switcher is switched on. Off, like the languages,
/// unless the row says exactly `true`.
export function parseSwitcherShown(value: unknown): boolean {
  return !!value && typeof value === "object" && !Array.isArray(value) && (value as Record<string, unknown>).switcher === true;
}

export function isPublished(locale: Locale, published: readonly Locale[]): boolean {
  return locale === "en" || published.includes(locale);
}
