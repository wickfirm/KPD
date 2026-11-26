// ─────────────────────────────────────────────────────────────────────────────
// A translation laid over English content. Pure helpers with no imports, so
// the same rules run in server actions, page loaders and unit tests.
//
// A translation holds only the text that differs from English, in the shape of
// the English value: objects by key, lists by position, and null where a
// position is not translated. translationDiff builds it from an editor form
// filled in another language; mergeLocale lays it back over the English value.
//
// Rules, all of which keep an English page and a half-finished translation safe:
// - Only text is ever replaced. A translation can never add a list entry,
//   change a list's length, or reach a key that is not in TEXT_KEYS: images,
//   links, switches, order and styles are shared with English by construction.
// - A blank translation falls back to the English text.
// - A field the English editor emptied (a blank string) stays empty in every
//   language. A field English leaves undefined shows the page's built-in
//   wording, so a translation may give it text.
// ─────────────────────────────────────────────────────────────────────────────

export type TranslationJson = null | string | TranslationJson[] | { [key: string]: TranslationJson };

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/// Keys whose value is text a visitor reads. Anything not listed here is shared
/// with English and is never translated, so a key added later stays English in
/// every language until someone decides it is text (merge-locale.test.ts lists
/// the keys of every stored shape and fails on one that is not decided).
export const TEXT_KEYS: ReadonlySet<string> = new Set([
  // page blocks, homepage, developments
  "heading", "text", "eyebrow", "intro", "title",
  "heroText", "heroCtaLabel", "heroSecondaryLabel",
  "sectionHeading", "story", "mission", "vision",
  "chairmanText", "chairmanName", "chairmanRole", "ceoText", "ceoName", "ceoRole",
  "philosophyKicker", "missionKicker", "visionKicker", "leadershipKicker", "leadershipHeading",
  "teamKicker", "teamHeading", "visitKicker", "visitHeading", "visitText", "visitCtaLabel", "visitLinkLabel",
  "valueCaps", "value", "label",
  "name", "role", "bio",
  "statsKicker", "statsNote", "introKicker", "introHeading", "introParagraphs", "cap", "body",
  "developmentHeading", "developmentKicker", "developmentBannerText", "developmentText",
  "developmentCtaLabel",
  "newsHeading", "newsText", "newsCta", "newsCardLabel",
  "contactHeading", "contactKicker", "contactText", "contactCtaLabel", "cardCtaLabel", "experienceCaptions",
  "tag", "copy", "caption",
  // History page
  "lede", "mapLabel", "startLabel", "nameKicker", "nameHeading", "nameText",
  "bandKicker", "bandHeading", "bandText", "bandLinkLabel",
  "year", "summary",
  // Investor guide
  "source", "city", "yieldLabel", "gainLabel", "button", "question", "answer",
  "primaryLabel", "secondaryLabel", "disclaimer",
  "estimateLabel", "monthlyLabel", "costsButton", "formHeading", "formText", "submitLabel",
  "benefits", "market", "payment", "pathway", "liquidity", "featured",
  "calculator", "calculatorButton", "subnavCta", "yieldCity", "yieldGross", "yieldGain", "featuredCta",
  // News page
  "featureCta", "cardCta", "emptyText", "pressLabel", "pressHeading", "pressText",
  "pressLinkLabel", "pressLinkText", "filterAll", "filterPerspective", "filterAnnouncement",
  "pressCardCta", "coverageLabel", "coverageHeading",
  // seven x seven landing
  "headline", "alt", "note", "minutes", "tabOne", "tabTwo", "tabThree", "tabPenthouse", "unit",
  "consent", "copyright", "primary", "secondary", "submit", "description",
  "detail", "size", "number", "legend",
  // Contact page wording
  "salesLabel", "customerLabel", "channelLabel", "jobLabel",
  "salesMessagePrompt", "customerMessagePrompt", "channelMessagePrompt", "jobMessagePrompt", "pressMessagePrompt",
  "formHeading", "addressLabel", "address", "directionsLabel", "callLabel",
  "termsText", "marketingText", "quickCallLabel", "quickEmailLabel",
  // legal documents (items are a list of lines; cards, headers, rows lists of text)
  "items", "cards", "headers", "rows",
  // development sections, page labels, and the development itself
  "ctaLabel", "brochureLabel", "bookLabel", "enquireEyebrow", "enquireHeading", "enquireText",
  "enquirePrimaryLabel", "enquireSecondaryLabel", "keyFacts", "labels", "overview", "driveNote",
  "tagline", "location",
  // site-wide copy
  "newsletterNote", "newsletterHeading", "newsletterSubmitLabel",
  "footerDevelopmentsTitle", "footerCompanyTitle", "footerMediaTitle",
  "footerAboutLabel", "footerHistoryLabel", "footerInvestorLabel", "footerNewsLabel", "footerContactLabel",
  "footerTermsLabel", "footerPrivacyLabel", "footerCookiesLabel", "footerCopyright",
  "enquiryLabel", "callLabel", "whatsappLabel", "headerCtaLabel",
  "popupTitle", "popupIntro", "popupSubmitLabel", "popupNote",
  // articles
  "coverImageAlt",
]);

/// Keys whose whole branch is shared with English, whatever its inner keys are
/// called. Press headlines are other publications' own words: they stay as
/// published, in every language.
const SHARED_BRANCHES: ReadonlySet<string> = new Set(["coverage"]);

/// Keys that say what a list entry is. They are copied into a translation so
/// mergeLocale can tell when the English list has changed shape since.
const MARKER_KEYS = ["type", "id"] as const;

export function isTranslatableKey(key: string): boolean {
  return !SHARED_BRANCHES.has(key) && TEXT_KEYS.has(key);
}

/// True when a key's value may be replaced in a translation:
/// - an object, or a list of entries, is a container and is always walked;
/// - text, or a list of text (also a list of lists, like a table), only under
///   a key in TEXT_KEYS;
/// - nothing else (numbers, switches, links and files under their own key).
function mayReplace(key: string, english: unknown): boolean {
  if (SHARED_BRANCHES.has(key)) return false;
  if (isRecord(english)) return true;
  if (Array.isArray(english)) return (english.length > 0 && english.every(isRecord)) || TEXT_KEYS.has(key);
  return TEXT_KEYS.has(key);
}

/// A list entry against the entry at the same position in the other language:
/// when both say what they are (`type`, or `id` for a legal document) and they
/// disagree, the English list has changed shape, so the entry stays English.
function sameEntry(english: RecordValue, other: RecordValue): boolean {
  for (const key of MARKER_KEYS) {
    if (typeof english[key] === "string" && typeof other[key] === "string" && english[key] !== other[key]) return false;
  }
  return true;
}

/// The English content with a translation's text laid over it. Field by field:
/// whatever the translation leaves out or leaves blank is the English value.
/// The English object itself is never mutated, and a part of it that is not
/// translated is the very same object it was.
export function mergeLocale<T>(english: T, translation: unknown): T {
  if (translation === null || translation === undefined) return english;
  if (typeof english === "string") return (isText(english) && isText(translation) ? translation : english) as T;
  if (Array.isArray(english)) {
    if (!Array.isArray(translation)) return english;
    return english.map((item, index) => {
      const other = translation[index];
      if (isRecord(item) && isRecord(other) && !sameEntry(item, other)) return item;
      return mergeLocale(item, other);
    }) as T;
  }
  if (isRecord(english)) {
    if (!isRecord(translation)) return english;
    let merged: RecordValue | null = null;
    const set = (key: string, value: unknown) => {
      merged ??= { ...english };
      merged[key] = value;
    };
    for (const key of Object.keys(translation)) {
      const current = english[key];
      if (current === undefined) {
        // Nothing is saved for this field in English: the page shows its
        // built-in wording, which a translation may replace.
        if (isTranslatableKey(key) && isText(translation[key])) set(key, translation[key]);
        continue;
      }
      if (!mayReplace(key, current)) continue;
      const next = mergeLocale(current, translation[key]);
      if (next !== current) set(key, next);
    }
    return (merged ?? english) as T;
  }
  return english;
}

/// The part of `built` — the editor's form in another language — that
/// translates `english`, or null when none of its text differs. `english` is
/// the English form built the same way, so it is exactly the wording the
/// editor saw to translate. Only text under TEXT_KEYS is kept: an image, link
/// or switch changed on a translation tab is dropped here, never stored.
export function translationDiff<T>(english: T, built: unknown): TranslationJson {
  if (typeof english === "string") {
    if (!isText(english) || typeof built !== "string" || !isText(built) || built.trim() === english.trim()) return null;
    return built;
  }
  if (Array.isArray(english)) {
    if (!Array.isArray(built) || built.length < english.length) return null;
    const items = english.map((item, index) => translationDiff(item, built[index]));
    return items.some((item) => item !== null) ? items : null;
  }
  if (isRecord(english)) {
    if (!isRecord(built)) return null;
    const out: RecordValue = {};
    for (const key of Object.keys(english)) {
      if (!mayReplace(key, english[key])) continue;
      const diff = translationDiff(english[key], built[key]);
      if (diff !== null) out[key] = diff;
    }
    if (!Object.keys(out).length) return null;
    // What this entry is, so a later merge can tell it apart from another entry.
    for (const key of MARKER_KEYS) {
      if (typeof english[key] === "string") out[key] = english[key];
    }
    return out as TranslationJson;
  }
  return null;
}

/// True when a translation holds at least one translated field.
export function hasTranslation(translation: unknown): boolean {
  if (typeof translation === "string") return translation.trim() !== "";
  if (Array.isArray(translation)) return translation.some(hasTranslation);
  if (isRecord(translation)) return Object.keys(translation).some((key) => !(MARKER_KEYS as readonly string[]).includes(key) && hasTranslation(translation[key]));
  return false;
}

/// The settings key of a record's translation: "home" → "home:ar". English has
/// none; its text is the record itself.
export function translationSettingKey(key: string, locale: string): string {
  return `${key}:${locale}`;
}

/// Prefix of the hidden fields that carry an editor's English form alongside a
/// translation, so the server can compare the two (see form-translation.ts).
export const ENGLISH_FIELD_PREFIX = "en__";
