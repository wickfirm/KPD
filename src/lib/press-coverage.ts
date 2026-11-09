// ── Press coverage ("In the press" on /news, and the /rss.xml feed) ──────────
// Outside articles about KPD: publication, headline as published, link, date
// and language. Stored inside the `news_listing` setting (Pages → News) as
// `coverage`; while that key has never been saved the list below is shown, so
// the coverage is live without a database write.

export type PressItem = {
  publication: string;
  title: string;
  /// Link to the article on the publication's site. Empty = shown unlinked.
  url: string;
  /// YYYY-MM-DD. Empty = undated (sorted last, no date in the feed).
  date: string;
  lang: "en" | "ar";
};

const en = (publication: string, title: string, url = "", date = ""): PressItem => ({ publication, title, url, date, lang: "en" });
const ar = (publication: string, title: string, url = "", date = ""): PressItem => ({ publication, title, url, date, lang: "ar" });

/// UAE launch coverage (list supplied 2026-11-09). Headlines are as each
/// publication ran them (Zawya's "real rstate" typo corrected). Zawya Arabic
/// has no link yet; only the 25h date is known (from its URL).
export const pressCoverageDefaults: PressItem[] = [
  ar("Al Bayan", "«كاسوميغاسيكي» اليابانية تتوسع في الإمارات", "https://www.albayan.ae/economy/1557992"),
  en("Arab News Japan", "Kasumigaseki Properties Development Introduces Its Japanese Approach to Real Estate in the United Arab Emirates", "https://www.arabnews.jp/en/business/kasumigaseki-properties-development-introduces-its-japanese-approach-to-real-estate-in-the-united-arab-emirates-3000796"),
  en("Zawya", "Kasumigaseki Properties Development introduces its Japanese approach to real estate in the United Arab Emirates", "https://www.zawya.com/en/press-release/companies-news/kasumigaseki-properties-development-introduces-its-japanese-approach-to-real-rstate-in-the-united-arab-emirates-1591299"),
  ar("Zawya", "كاسوميغاسيكي للتطوير العقاري تستعرض نهجها الياباني في قطاع العقارات في دولة الإمارات العربية المتحدة"),
  en("Emirates 24/7", "Japanese developer Kasumigaseki expands UAE footprint with property development push", "https://www.emirates247.com/business/japanese-developer-kasumigaseki-expands-uae-footprint-with-property-development-push/6633"),
  en("MENA FN", "Kasumigaseki Properties Development Introduces Its Japanese Approach To Real Estate In The United Arab Emirates", "https://menafn.com/1111795409/Kasumigaseki-Properties-Development-Introduces-Its-Japanese-Approach-To-Real-Estate-In-The-United-Arab-Emirates"),
  en("Construction Business News Middle East (LinkedIn)", "Kasumigaseki Capital Moves From Investing To Developing In The UAE", "https://lnkd.in/p/d2T32Gsj"),
  en("Construction Business News Middle East", "Kasumigaseki Capital Moves From Investing To Developing In The UAE", "https://www.cbnme.com/news/kasumigaseki-capital-moves-from-investing-to-developing-in-the-uae/"),
  ar("Arqam", "كاسوميغاسيكي تستعرض نهجها الياباني في عقارات الإمارات", "https://arqam.news/602756/"),
  en("Property Time", "From investor to developer: Tokyo-listed Kasumigaseki brings a Japanese rulebook to UAE homebuilding", "https://www.propertytime.ae/developers/kasumigaseki-properties-development-uae-japanese-developer/"),
  en("Middle East News 24/7", "Kasumigaseki Properties Development Introduces Its Japanese Approach to Real Estate in the United Arab Emirates", "https://menews247.com/kasumigaseki-properties-development-introduces-its-japanese-approach-to-real-estate-in-the-united-arab-emirates/"),
  en("Mid-East Info", "Kasumigaseki Properties Development Introduces Its Japanese Approach to Real Estate in the United Arab Emirates", "https://mid-east.info/kasumigaseki-properties-development-introduces-its-japanese-approach-to-real-estate-in-the-united-arab-emirates/"),
  ar("25h", "كاسوميغاسيكي للتطوير العقاري تستعرض نهجها الياباني في قطاع العقارات في دولة الإمارات العربية المتحدة", "https://25h.app/2026/10/12/%D9%83%D8%A7%D8%B3%D9%88%D9%85%D9%8A%D8%BA%D8%A7%D8%B3%D9%8A%D9%83%D9%8A-%D9%84%D9%84%D8%AA%D8%B7%D9%88%D9%8A%D8%B1-%D8%A7%D9%84%D8%B9%D9%82%D8%A7%D8%B1%D9%8A-%D8%AA%D8%B3%D8%AA%D8%B9%D8%B1%D8%B6/", "2026-10-12"),
  en("Executive Bulletin", "Kasumigaseki Properties Development Introduces Its Japanese Approach to Real Estate in the United Arab Emirates", "https://executive-bulletin.com/real-estate-2/kasumigaseki-properties-development-introduces-its-japanese-approach-to-real-estate-in-the-united-arab-emirates"),
  en("Property News International", "Kasumigaseki Properties Development expands into UAE market", "https://www.propertynewsint.com/news/kasumigaseki-properties-development-expands-into-uae-market"),
  ar("Al Masdar Al Eqary", "شركة \"كاسوميغاسيكي\" اليابانية تبدأ تطوير مشاريع عقارية في الإمارات", "https://masdarak.com/business-news/%D8%B4%D8%B1%D9%83%D8%A9-%D9%83%D8%A7%D8%B3%D9%88%D9%85%D9%8A%D8%BA%D8%A7%D8%B3%D9%8A%D9%83%D9%8A-%D8%A7%D9%84%D9%8A%D8%A7%D8%A8%D8%A7%D9%86%D9%8A%D8%A9-%D8%AA%D8%A8%D8%AF%D8%A3-%D8%AA%D8%B7%D9%88/"),
  en("Media News", "Japanese developer Kasumigaseki expands UAE footprint with property development push", "https://www.medianews.tech/article.php?id=d1a092fec8e6&lang=en"),
  en("Dubai Property Guide", "Kasumigaseki Properties Development Introduces Its Japanese Approach To Real Estate In The United Arab Emirates", "https://dubaipropertyguide.io/kasumigaseki-properties-development-introduces-its-japanese-approach-to-real-estate-in-the-united-arab-emirates/"),
  en("Business Lobbies", "Kasumigaseki Properties Brings Japanese Real Estate Model to UAE", "https://businesslobbies.com/post/kasumigaseki-properties-brings-japanese-real-estate-model-to-uae"),
  en("The Gulf Property", "Japanese developer announces entry into UAE realty", "https://www.thegulfproperty.com/articles/japanese-developer-announces-entry-into-uae-realty"),
  en("Akhbar", "Japanese developer Kasumigaseki expands UAE footprint with property development push", "https://akhbar.com/ar/news/japanese-developer-kasumigaseki-expands-uae-footprint-with-property-development-push/"),
  en("DXB rest", "Japan’s Kasumegaseki Company Starts Developing Real Estate Projects in the UAE", "https://dxbrest.ae/en/details.php?id=4396"),
  en("Business Lobbies (LinkedIn)", "Kasumigaseki Properties Brings Japanese Real Estate Model to UAE", "https://lnkd.in/p/deHQawD6"),
  en("Executive Bulletin (Facebook)", "Kasumigaseki Properties Development Introduces Its Japanese Approach to Real Estate in the United Arab Emirates", "https://www.facebook.com/executivebulletin/posts/pfbid0aj4ZZtW9oot1AqVhSzCrAqNPW7wPE9WSdageJctiK48yFMvrG2754JuYCiXjuoDl"),
];

export const pressCoverageCopyDefaults = {
  coverageLabel: "In the press",
  coverageHeading: "KPD in the **media.**",
} as const;

const ARABIC = /[؀-ۿ]/;

/// Arabic script in the headline means an Arabic item, whatever was picked.
export function detectLang(title: string): "en" | "ar" {
  return ARABIC.test(title) ? "ar" : "en";
}

function cleanUrl(value: unknown): string {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : "";
}

function cleanDate(value: unknown): string {
  const date = typeof value === "string" ? value.trim() : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ? date : "";
}

/// Normalises an editor list: trims fields, drops rows without a headline,
/// only keeps http(s) links and YYYY-MM-DD dates.
export function normalizePressItems(raw: unknown): PressItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const publication = typeof r.publication === "string" ? r.publication.trim() : "";
    if (!title) return [];
    const lang = r.lang === "ar" || r.lang === "en" ? r.lang : detectLang(title);
    return [{ publication, title, url: cleanUrl(r.url), date: cleanDate(r.date), lang }];
  });
}

/// The saved list, or the supplied coverage while nothing has been saved.
/// A saved empty list stays empty (the editor removed everything).
export function resolvePressItems(saved: unknown): PressItem[] {
  return saved === undefined ? pressCoverageDefaults : normalizePressItems(saved);
}

/// Newest first; undated items keep their editor order after the dated ones.
export function sortPressItems(items: PressItem[]): PressItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.date && b.item.date && a.item.date !== b.item.date) return a.item.date < b.item.date ? 1 : -1;
      if (a.item.date && !b.item.date) return -1;
      if (!a.item.date && b.item.date) return 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

/// "12 Oct 2026", or "" for an undated item.
export function pressDateLabel(date: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

/// Google News titles end with " - Publication"; split it off for the inbox.
export function splitGoogleNewsTitle(title: string): { title: string; publication: string } {
  const m = /^(.*\S)\s+[-–—]\s+([^-–—]{2,80})$/.exec(title.trim());
  return m ? { title: m[1], publication: m[2].trim() } : { title: title.trim(), publication: "" };
}
