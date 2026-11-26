// ─────────────────────────────────────────────────────────────────────────────
// Locales. Pure helpers with no request or server imports, so the same module
// is safe in client components, the edge middleware and unit tests. Reading
// the language of the request on the server is locale.ts.
//
// URLs: English keeps its unprefixed addresses ("/about"); Arabic and Japanese
// live under their own prefix with the same slug ("/ar/about", "/ja/news/x").
// The middleware strips the prefix and renders the English route.
// ─────────────────────────────────────────────────────────────────────────────

export const locales = ["en", "ar", "ja"] as const;
export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";

/// Request header the middleware sets to the language of the response.
/// Server components read it through getLocale() (src/lib/locale.ts).
export const LOCALE_HEADER = "x-kpd-locale";

/// Set alongside LOCALE_HEADER for an admin preview (?lang=), which shows copy
/// in a language that is not published yet.
export const LOCALE_PREVIEW_HEADER = "x-kpd-locale-preview";

/// The languages that live under a prefix.
export const prefixedLocales = ["ar", "ja"] as const satisfies readonly Locale[];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/// Right-to-left languages flip the whole document.
export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

const mirroredGlyphs: Record<string, string> = { "→": "←", "←": "→", "↗": "↖", "↘": "↙" };

/// An arrow as it points the way the text reads: a forward arrow on an Arabic
/// page points left, and one that leaves the page keeps its tilt. A down
/// arrow is its own mirror, and English pages get the glyph as it was written.
export function arrowGlyph(locale: Locale, glyph: string): string {
  return isRtl(locale) ? (mirroredGlyphs[glyph] ?? glyph) : glyph;
}

/// A URL path split into its language and the route that renders it:
/// "/ar/about" → { locale: "ar", path: "/about" }; "/about" and "/archive"
/// → { locale: "en", path: <unchanged> }.
export function localeFromPath(pathname: string): { locale: Locale; path: string } {
  for (const locale of prefixedLocales) {
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1) };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/// Addresses that are not pages, so they never take a language prefix.
const NOT_A_PAGE = [
  "/admin",
  "/api",
  "/_next",
  "/assets",
  "/brand",
  "/fonts",
  "/team",
  "/timeline",
  "/uploads",
  "/videos",
  "/locales",
  "/site-access",
] as const;
const NOT_A_PAGE_FILES = new Set(["/robots.txt", "/sitemap.xml", "/rss.xml", "/llms.txt", "/favicon.ico", "/icon.png", "/icon.svg", "/apple-icon.png", "/opengraph-image"]);

/// True for the address of a page on this site ("/", "/about", "/legacy",
/// "/news/a?x=1#top"). False for another site, "mailto:", "#top", an asset or
/// a system route. "/legacy" is the History page; "/legacy/…" is the client's
/// delivered files.
export function isPageAddress(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path === "/legacy") return true;
  if (NOT_A_PAGE_FILES.has(path) || /^\/google[0-9a-z]+\.html$/i.test(path)) return false;
  if ((NOT_A_PAGE as readonly string[]).includes(path)) return false;
  return ![...NOT_A_PAGE, "/legacy"].some((prefix) => path.startsWith(`${prefix}/`));
}

/// The link to the same page in a language. English keeps today's unprefixed
/// addresses, so for "en" (and for anything that is not a same-site page:
/// another site, "mailto:", "tel:", "#top", an asset) the href comes back
/// exactly as given. The query and the hash are kept.
export function localeHref(href: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return href;
  return pageInLocale(href, locale);
}

/// The same page in a language, from an address written in any language:
/// "/ar/about" → "en" gives "/about"; "/about" → "ja" gives "/ja/about". This
/// is what a language switcher needs, since localeHref leaves English alone.
export function pageInLocale(href: string, locale: Locale): string {
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? "" : href.slice(cut);
  if (!isPageAddress(path)) return href;
  // Drop the language the address already carries.
  const base = localeFromPath(path).path;
  if (locale === DEFAULT_LOCALE) return `${base}${rest}`;
  return base === "/" ? `/${locale}${rest}` : `/${locale}${base}${rest}`;
}

/// `localeHref` for every internal link inside a block of delivered HTML.
/// English comes back untouched, so nothing is at risk on English pages.
export function localizeHtmlLinks(html: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return html;
  return html.replace(/\bhref=(["'])(\/[^"'<>]*)\1/g, (whole, quote: string, path: string) => {
    const next = localeHref(path, locale);
    return next === path ? whole : `href=${quote}${next}${quote}`;
  });
}

/// How each language names itself, always in that language.
export const localeNames: Record<Locale, string> = { en: "English", ar: "العربية", ja: "日本語" };

/// How the CMS calls each language. The CMS itself stays in English.
export const languageNames: Record<Locale, string> = { en: "English", ar: "Arabic", ja: "Japanese" };

/// The language of an editor tab, from its ?lang= address parameter. Anything
/// that is not a language of this site is the English tab.
export function editorLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/// "ar-AE" / "ja-JP": the region form used for dates.
function dateLocale(locale: Locale): string {
  if (locale === "ar") return "ar-AE-u-nu-latn"; // Arabic with Western digits, the norm on UAE property sites
  return locale === "ja" ? "ja-JP" : "en-US";
}

export type DateStyle = "long" | "short";

/// A date for readers of a language: the month spelled out ("March 3, 2026",
/// "3 مارس 2026") or a short numeric date. Arabic keeps Western digits.
export function formatDate(date: Date, locale: Locale, style: DateStyle = "long"): string {
  const options: Intl.DateTimeFormatOptions = style === "long" ? { month: "long", day: "numeric", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat(dateLocale(locale), options).format(date);
}

/// "en_AE" / "ar_AE" / "ja_JP" for Open Graph's og:locale.
export function ogLocale(locale: Locale): string {
  return locale === "ja" ? "ja_JP" : `${locale}_AE`;
}
