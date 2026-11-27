import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import { t } from "@/lib/i18n";

/// A word of a delivered shell, as it reads, and what it says in another language.
export type ShellWord = { english: string; text: string };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/// How the word may be written in the shell's HTML: a character that has an
/// escape there may come as itself or as the escape ("&" or "&amp;", "©" or "&copy;").
const htmlForms = (text: string) => escapeRegExp(text).replaceAll("&", "(?:&|&amp;)").replaceAll("©", "(?:©|&copy;)");

/// Replaces the words of a delivered shell that a page shows as it was
/// delivered — the article page's header and footer — for a page in another
/// language. A word is replaced where it is alone in its text node, or is the
/// whole value of an attribute that says it aloud or shows it as a hint
/// (aria-label, alt, placeholder, title, value). A word that is not in the
/// list, or whose other language is not known, stays as it came. An English
/// page is given its shell back untouched.
export function localizeShellWords(html: string, locale: Locale, words: readonly ShellWord[]): string {
  if (locale === DEFAULT_LOCALE) return html;
  let out = html;
  for (const { english, text } of words) {
    if (!text.trim() || text === english) continue;
    const shown = escapeHtml(text);
    const word = htmlForms(english.trim());
    out = out
      .replace(new RegExp(`(>)\\s*${word}\\s*(<)`, "g"), (_whole, open: string, close: string) => `${open}${shown}${close}`)
      .replace(new RegExp(`(\\s(?:aria-label|alt|placeholder|title|value)=")${word}(")`, "g"), (_whole, open: string, close: string) => `${open}${shown}${close}`);
  }
  return out;
}

/// The footer's newsletter field says "Email Address" as delivered. In another
/// language it says what the client's translators made of exactly that ("Email
/// Address", in their sheet).
export function newsletterEmailLabel(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "Email Address" : t(locale, "sxs.emailAddress");
}
