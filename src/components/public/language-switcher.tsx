"use client";

import { usePathname } from "next/navigation";
import { localeNames, pageInLocale, type Locale } from "@/lib/locales";
import { t } from "@/lib/i18n";

/// Links to the same page in the site's other published languages.
///
/// Where it appears decides its form:
/// - header: compact, only the other languages, because the delivered header
///   has no room for more beside its links and button.
/// - menu: the mobile menu panel of the main site, a white list.
/// - overlay: the dark full-screen menus of the seven x seven landing.
/// - footer: the legal row.
/// The menu, overlay and footer list every published language and mark the
/// current one as plain text.
///
/// The page's address is read here because the shell (header, footer) is
/// shared by every page and does not know which one is showing. Each link is a
/// plain anchor, so switching is a full page load. That is on purpose:
/// "/about" and "/ar/about" are the same route under the hood, and a soft
/// navigation between them would translate the page while leaving <html lang>
/// and the direction as they were.
///
/// Only rendered when the caller has languages to offer (getSwitcherLocales in
/// src/lib/locale.ts): the published ones once the switcher is switched on with
/// them, none before. So a language can be reached at its address while English
/// pages stay exactly as they were.
export function LanguageSwitcher({ locale, published, variant }: { locale: Locale; published: Locale[]; variant: "header" | "menu" | "overlay" | "footer" }) {
  const pathname = usePathname();
  const languages = (["en", ...published] as Locale[]).filter((language) => variant !== "header" || language !== locale);
  // A plain labelled group, never a <nav>: it sits inside the site's navigation
  // landmarks, and the delivered styles position nav elements themselves.
  return (
    <>
      {/* The switcher's stylesheet is a static file linked here, not bundled:
          only a page that shows the switcher asks for it, so every other page's
          CSS is untouched. React lifts the link into the head. */}
      {/* eslint-disable-next-line @next/next/no-css-tags -- deliberate, see above */}
      <link rel="stylesheet" href="/locales/language-switcher.css" precedence="kpd-lang" />
      <div role="group" className={`kpd-lang kpd-lang--${variant}`} aria-label={t(locale, "nav.language")}>
        <ul className="kpd-lang-list">
          {languages.map((language, index) => (
            <li key={language} className="kpd-lang-item">
              {index ? <span className="kpd-lang-sep" aria-hidden="true" /> : null}
              {language === locale ? (
                <span className="kpd-lang-current" lang={language} aria-current="true">{localeNames[language]}</span>
              ) : (
                // A plain anchor on purpose: it must be a full page load, not a router navigation.
                <a className="kpd-lang-link" lang={language} hrefLang={language} href={pageInLocale(pathname ?? "/", language)}>{localeNames[language]}</a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
