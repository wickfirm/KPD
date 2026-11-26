// ─────────────────────────────────────────────────────────────────────────────
// A translation form and the English it was translated from, in one payload.
// Pure helpers shared by the editor (client) and the save actions (server).
//
// On an Arabic or Japanese tab the editor sees the same form as in English.
// The English form is kept beside it, read-only, for the grey hints; its
// fields are also sent along as hidden "en__…" fields, so the server compares
// the translation with exactly the wording the editor saw — including the
// built-in wording a page shows for a field nothing is saved for.
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/locales";
import { ENGLISH_FIELD_PREFIX } from "./merge-locale";

/// The language of a form, from its hidden "lang" field. English when absent
/// or not a language of this site.
export function formLocale(formData: FormData): Locale {
  const value = formData.get("lang");
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export type SplitTranslationForm = {
  /// The language the form was filled in for.
  locale: Locale;
  /// The editor's fields, without "lang" and without the English copy.
  form: FormData;
  /// The same form in English, when the editor's browser sent it.
  english: FormData | null;
};

/// Splits what a translation tab posted.
export function splitTranslationForm(formData: FormData): SplitTranslationForm {
  const form = new FormData();
  let english: FormData | null = null;
  formData.forEach((value, name) => {
    if (name === "lang") return;
    if (name.startsWith(ENGLISH_FIELD_PREFIX)) {
      english ??= new FormData();
      english.append(name.slice(ENGLISH_FIELD_PREFIX.length), value);
      return;
    }
    form.append(name, value);
  });
  return { locale: formLocale(formData), form, english };
}

export type EnglishFormField = { name: string; value: string };

/// The fields that carry an English form along with a translation: one hidden
/// field per entry, in the form's own order (repeated names stay in order).
export function englishFormFields(english: FormData): EnglishFormField[] {
  const fields: EnglishFormField[] = [];
  english.forEach((value, name) => fields.push({ name: `${ENGLISH_FIELD_PREFIX}${name}`, value: String(value) }));
  return fields;
}

/// The row an unsaved-changes preview is kept in. A translation's preview gets
/// its own, so an English preview and an Arabic one of the same page never
/// overwrite each other.
export function translationDraftKey(key: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? key : `${key}:${locale}`;
}

/// The preview address of a page in the language of the form that is previewed.
export function previewInLocale(target: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return target;
  return `${target}${target.includes("?") ? "&" : "?"}lang=${locale}`;
}
