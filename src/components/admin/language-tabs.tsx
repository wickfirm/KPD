import type { ReactNode } from "react";
import { languageNames, localeNames, type Locale } from "@/lib/locales";

/// The fields that are not part of the editor's own address and are dropped
/// when switching language (they belong to the save just made).
const TRANSIENT = new Set(["lang", "saved", "restored", "error", "denied", "notice", "synced"]);

/// English / العربية /日本語 under an editor's heading. Each tab is the same
/// editor in that language; English is the content itself, the other two its
/// translations. A dot marks a language the content is already translated in.
///
/// `english` is the read-only English editor that an Arabic or Japanese tab
/// keeps beside its own (see EnglishCopy). It is rendered here, under the
/// heading, and never among the editor's own elements: React derives the ids
/// of the editor's controls from the elements around them, so an extra element
/// there — even an empty one — would change the English editor.
export function LanguageTabs({ current, translated = [], query = {}, english }: {
  current: Locale;
  translated?: readonly Locale[];
  query?: Record<string, string | string[] | undefined>;
  english?: ReactNode;
}) {
  const kept = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (TRANSIENT.has(key)) continue;
    for (const item of Array.isArray(value) ? value : [value]) if (item) kept.append(key, item);
  }
  const href = (locale: Locale) => {
    const search = new URLSearchParams(kept);
    if (locale !== "en") search.set("lang", locale);
    const text = search.toString();
    return text ? `?${text}` : "?";
  };
  const tabs: Locale[] = ["en", "ar", "ja"];
  return <>
    <nav className="cms-lang-tabs" aria-label="Language">
      <span className="cms-lang-tabs__label">Language</span>
      {tabs.map((locale) => {
        const done = locale !== "en" && translated.includes(locale);
        return <a key={locale} href={href(locale)} lang={locale} hrefLang={locale} aria-current={locale === current ? "page" : undefined}>
          {localeNames[locale]}
          {done ? <span className="cms-lang-tabs__dot" title="Translated" /> : null}
        </a>;
      })}
    </nav>
    {english}
  </>;
}

/// The same editor in English, kept beside an Arabic or Japanese tab. It is
/// never shown or used directly: the tab reads it for the grey English under
/// each box, and sends it along with a save so the server compares the
/// translation with exactly the wording the editor saw.
export function EnglishCopy({ id, children }: { id: string; children: ReactNode }) {
  return <div id={id} hidden inert aria-hidden="true" data-english-copy>{children}</div>;
}

/// Small AR / JA badges for a list: the languages a piece of content is
/// translated in. Nothing is shown for content that is only in English.
export function TranslatedBadges({ locales }: { locales?: readonly Locale[] }) {
  const shown = (locales ?? []).filter((locale) => locale !== "en");
  if (!shown.length) return null;
  return <>{shown.map((locale) => <span key={locale} className="cms-badge cms-badge--lang" lang={locale} title={`${languageNames[locale]} translation`}>{locale.toUpperCase()}</span>)}</>;
}
