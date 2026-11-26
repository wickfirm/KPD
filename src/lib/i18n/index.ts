import { type Locale } from "@/lib/locales";
import en, { type Messages, type Translation } from "./en";
import ar from "./ar";
import ja from "./ja";

// ─────────────────────────────────────────────────────────────────────────────
// Text that belongs to the site itself (buttons, labels, messages), in the
// visitor's language. Pure: safe to import from client components, which pass
// the locale they were given; server components pass getLocale().
//
//   t(locale, "nav.about")
//   t(locale, "news.showAll", { count: 12 })   // "Show all {count}"
//
// A translation that leaves an entry out shows the English text. Page content
// is not translated here: it comes from the CMS, per language.
// ─────────────────────────────────────────────────────────────────────────────

type Namespace = keyof Messages & string;
type Name<N extends Namespace> = keyof Messages[N] & string;

/// Every "area.name" key of the English dictionary, checked by the compiler.
export type MessageKey = { [N in Namespace]: `${N}.${Name<N>}` }[Namespace];

const translations: Record<Locale, Translation> = { en, ar, ja };

/// A message in the visitor's language. `vars` fill "{name}" placeholders, so
/// a translation can move or drop a number without splitting the sentence.
export function t(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
  const cut = key.indexOf(".");
  const namespace = key.slice(0, cut) as Namespace;
  const name = key.slice(cut + 1);
  const english = en[namespace] as Record<string, string>;
  const message = (translations[locale][namespace] as Record<string, string> | undefined)?.[name] || english[name];
  return message.replace(/\{(\w+)\}/g, (whole, placeholder: string) => (placeholder in vars ? String(vars[placeholder]) : whole));
}
