import { describe, expect, it } from "vitest";
import { aboutDefaults } from "@/lib/about-defaults";
import { contactInquiryDefaults } from "@/lib/contact-inquiry-content";
import { defaultKeyFacts } from "@/lib/development-gallery-light";
import { homeDefaults } from "@/lib/home-defaults";
import { investDefaults } from "@/lib/invest-defaults";
import { legacyDefaults, legacyGalleryDefaults } from "@/lib/legacy-defaults";
import { newsListingDefaults } from "@/lib/news-listing";
import { ownershipCostPlannerDefaults } from "@/lib/ownership-cost-planner";
import { legacyProjectTemplates } from "@/lib/legacy-project-templates";
import { projectPageLabelDefaults } from "@/lib/project-chrome";
import { starterModules } from "@/lib/project-starter";
import { sxsDefaults } from "@/lib/sxs-defaults";
import { legalContact, legalDocuments, termsPageContent } from "@/lib/terms-defaults";
import { hasTranslation, isTranslatableKey, mergeLocale, TEXT_KEYS, translationDiff, translationSettingKey } from "./merge-locale";

describe("mergeLocale", () => {
  const english = {
    heading: "Luxury, in balance.",
    image: "/legacy/assets/images/hero.jpg",
    ctaVisible: true,
    sortOrder: 2,
    headingStyle: { fontSize: "40px" },
    statsNote: "",
    missing: undefined,
  };

  it("replaces only the text the translation gives", () => {
    const merged = mergeLocale(english, { heading: "الفخامة في توازن.", image: "https://evil.example/x.jpg", ctaVisible: false, sortOrder: 99, headingStyle: { fontSize: "9px" }, statsNote: "A note" });
    expect(merged).toEqual({ ...english, heading: "الفخامة في توازن." });
  });

  it("never changes the English object", () => {
    const before = JSON.stringify(english);
    mergeLocale(english, { heading: "x", image: "y" });
    expect(JSON.stringify(english)).toBe(before);
  });

  it.each([null, undefined, "", "   "])("falls back to English for a blank translation (%j)", (blank) => {
    expect(mergeLocale(english, { heading: blank })).toEqual(english);
    expect(mergeLocale(english, blank as never)).toEqual(english);
  });

  it("leaves a field alone when the English text is blank: a language never shows what the English editor emptied", () => {
    expect(mergeLocale(english, { statsNote: "Note in Arabic" })).toEqual(english);
  });

  it("may give text to a field English leaves undefined: the page shows its built-in wording there", () => {
    // undefined is not "hasOwnProperty" false here: English saves nothing for it.
    const saved = { missionKicker: undefined as string | undefined, image: undefined as string | undefined, labels: undefined as unknown };
    expect(mergeLocale(saved, { missionKicker: "مهمتنا", image: "/x.jpg", labels: { x: "y" } })).toEqual({ missionKicker: "مهمتنا", image: undefined, labels: undefined });
  });

  it("ignores keys the English does not have when they are not text", () => {
    expect(mergeLocale(english, { extra: "x" })).toEqual(english);
    expect(mergeLocale({ a: "x" }, { heroVideo: "https://evil.example/v.mp4" })).toEqual({ a: "x" });
  });

  it("hands back the English object itself when nothing is translated", () => {
    expect(mergeLocale(english, { image: "/x.jpg", ctaVisible: false })).toBe(english);
    expect(mergeLocale(english, null)).toBe(english);
    expect(mergeLocale(english, { heading: "   " })).toBe(english);
  });

  it("walks nested objects", () => {
    const merged = mergeLocale({ labels: { calculator: "Mortgage calculator", subnavCta: "Enquire" }, typography: { body: { fontSize: "18px" } } }, { labels: { calculator: "حاسبة الرهن" }, typography: { body: { fontSize: "9px" } } });
    expect(merged).toEqual({ labels: { calculator: "حاسبة الرهن", subnavCta: "Enquire" }, typography: { body: { fontSize: "18px" } } });
  });

  it("ignores a translation whose shape does not fit", () => {
    expect(mergeLocale({ a: { b: "x" } }, { a: "y" })).toEqual({ a: { b: "x" } });
    expect(mergeLocale({ a: ["x"] }, { a: { 0: "y" } })).toEqual({ a: ["x"] });
    expect(mergeLocale({ a: 4 }, { a: "four" })).toEqual({ a: 4 });
    expect(mergeLocale({ a: true }, { a: false })).toEqual({ a: true });
  });

  it("keeps a press list as published, whatever its inner keys are called", () => {
    const listing = { coverage: [{ title: "KPD launches", publication: "Zawya", url: "https://x" }] };
    expect(mergeLocale(listing, { coverage: [{ title: "إطلاق", url: "https://evil.example" }] })).toEqual(listing);
  });
});

describe("mergeLocale with lists", () => {
  it("merges a list of text by position and keeps the rest English", () => {
    expect(mergeLocale(["First", "Second", "Third"], ["الأول", null, ""])).toEqual(["الأول", "Second", "Third"]);
  });

  it("never adds or removes an entry", () => {
    expect(mergeLocale(["One"], ["واحد", "اثنان"])).toEqual(["واحد"]);
    expect(mergeLocale(["One", "Two"], ["واحد"])).toEqual(["واحد", "Two"]);
  });

  it("merges a list of entries by position, field by field", () => {
    const team = [
      { name: "Taro Kasumigaseki", role: "Chairman", image: "/a.jpg" },
      { name: "Hanako Dubai", role: "CEO", image: "/b.jpg" },
    ];
    const merged = mergeLocale(team, [{ role: "رئيس مجلس الإدارة", image: "/evil.jpg" }, null]);
    expect(merged).toEqual([
      { name: "Taro Kasumigaseki", role: "رئيس مجلس الإدارة", image: "/a.jpg" },
      { name: "Hanako Dubai", role: "CEO", image: "/b.jpg" },
    ]);
  });

  it("keeps an entry English when the English list has changed shape since", () => {
    const blocks = [
      { type: "heading", heading: "Overview" },
      { type: "paragraph", text: "Please read…" },
    ];
    // The translation was made when a paragraph came first.
    const shifted = [{ type: "paragraph", text: "يرجى القراءة…" }, null];
    expect(mergeLocale(blocks, shifted)).toEqual(blocks);
    // Entries of the same kind still line up.
    expect(mergeLocale(blocks, [{ type: "heading", heading: "نظرة عامة" }, { type: "paragraph", text: "يرجى القراءة…" }])[0]).toEqual({ type: "heading", heading: "نظرة عامة" });
  });

  it("handles a list inside a list (a table)", () => {
    const rows = [["Contact details", "Your name"], ["Message", "Whatever you write"]];
    expect(mergeLocale(rows, [["بيانات الاتصال", "اسمك"], null])).toEqual([["بيانات الاتصال", "اسمك"], ["Message", "Whatever you write"]]);
  });

  it("translates a list only under a key that is text", () => {
    const english = { introParagraphs: ["One", "Two"], experienceImages: ["/a.jpg", "/b.jpg"] };
    expect(mergeLocale(english, { introParagraphs: ["واحد", "اثنان"], experienceImages: ["https://evil.example/a.jpg"] })).toEqual({ ...english, introParagraphs: ["واحد", "اثنان"] });
  });
});

describe("translationDiff", () => {
  it("keeps only the text that differs from English", () => {
    const english = { heading: "Luxury, in balance.", image: "/hero.jpg", ctaVisible: true, label: "Explore" };
    expect(translationDiff(english, { heading: "الفخامة في توازن.", image: "/other.jpg", ctaVisible: false, label: "Explore" })).toEqual({ heading: "الفخامة في توازن." });
  });

  it("drops a changed image, link or switch: those are shared with English", () => {
    const english = { ctaUrl: "/contact", image: "/a.jpg", visible: true, title: "A" };
    expect(translationDiff(english, { ctaUrl: "https://evil.example", image: "/b.jpg", visible: false, title: "A" })).toBeNull();
  });

  it("is null when nothing is translated", () => {
    expect(translationDiff({ a: "x", b: ["y"] }, { a: "x", b: ["y"] })).toBeNull();
    expect(translationDiff({ a: "x" }, { a: "  x  " })).toBeNull();
    expect(translationDiff({ a: "x" }, {})).toBeNull();
  });

  it("does not translate a blank English field", () => {
    expect(translationDiff({ note: "" }, { note: "Something" })).toBeNull();
  });

  it("treats a cleared box as not translated", () => {
    // The editor emptied it: the page falls back to English, so nothing is stored.
    expect(translationDiff({ heading: "Hello" }, { heading: "" })).toBeNull();
    expect(translationDiff({ heading: "Hello" }, { heading: "   " })).toBeNull();
  });

  it("stores lists with null where an entry is still English", () => {
    const english = { management: [{ name: "A", role: "Chair", image: "/a.jpg" }, { name: "B", role: "CEO", image: "/b.jpg" }], introParagraphs: ["One", "Two"] };
    const built = { management: [{ name: "A", role: "رئيس", image: "/a.jpg" }, { name: "B", role: "CEO", image: "/b.jpg" }], introParagraphs: ["One", "اثنان"] };
    expect(translationDiff(english, built)).toEqual({ management: [{ role: "رئيس" }, null], introParagraphs: [null, "اثنان"] });
  });

  it("stores what a list entry is, so a later merge can line the entries up", () => {
    const english = [{ type: "paragraph", text: "Hello", image: "/a.jpg" }];
    expect(translationDiff(english, [{ type: "paragraph", text: "مرحبا", image: "/a.jpg" }])).toEqual([{ type: "paragraph", text: "مرحبا" }]);
  });

  it("stores nothing for a list the form made shorter", () => {
    expect(translationDiff(["One", "Two"], ["واحد"])).toBeNull();
  });

  it("cannot add a key or reach a press list", () => {
    const english = { heading: "x", coverage: [{ title: "T" }] };
    expect(translationDiff(english, { heading: "y", extra: "new", coverage: [{ title: "ع" }] })).toEqual({ heading: "y" });
  });

  it("walks a list of entries under any key, and a list of text only under a key that is text", () => {
    const english = { management: [{ name: "A" }], experienceImages: ["/a.jpg"], metrics: [{ value: "$4.4B" }] };
    const built = { management: [{ name: "أ" }], experienceImages: ["https://evil.example"], metrics: [{ value: "٤" }] };
    expect(translationDiff(english, built)).toEqual({ management: [{ name: "أ" }], metrics: [{ value: "٤" }] });
  });
});

describe("mergeLocale over translationDiff", () => {
  const english = {
    hero: { type: "hero", heading: "From Tokyo\nto Dubai.", text: "Our story.", image: "/hero.jpg", ctaLabel: "Explore", ctaUrl: "/about" },
    story: ["First paragraph.", "Second paragraph."],
    timeline: [
      { year: "1955", title: "Founded", summary: "The company is founded in Tokyo.", image: "/1955.jpg" },
      { year: "2014", title: "Dubai", summary: "The Dubai office opens.", image: "/2014.jpg" },
    ],
    labels: { calculator: "Mortgage calculator" },
  };
  const arabic = {
    ...english,
    hero: { ...english.hero, heading: "من طوكيو\nإلى دبي.", ctaUrl: "https://evil.example" },
    story: ["الفقرة الأولى.", "Second paragraph."],
    timeline: [{ ...english.timeline[0], title: "التأسيس" }, english.timeline[1]],
  };

  it("shows exactly the text the editor translated, and nothing else changes", () => {
    const merged = mergeLocale(english, translationDiff(english, arabic));
    expect(merged).toEqual({
      ...english,
      hero: { ...english.hero, heading: "من طوكيو\nإلى دبي." },
      story: ["الفقرة الأولى.", "Second paragraph."],
      timeline: [{ ...english.timeline[0], title: "التأسيس" }, english.timeline[1]],
    });
  });

  it("keeps the English object and the untouched list entries identical by reference", () => {
    const merged = mergeLocale(english, translationDiff(english, arabic)) as typeof english;
    expect(merged.timeline[1]).toBe(english.timeline[1]);
    expect(merged.labels).toBe(english.labels);
  });

  it("gives the English content back when the form is still English", () => {
    expect(mergeLocale(english, translationDiff(english, english))).toEqual(english);
  });
});

describe("hasTranslation", () => {
  it("is false for nothing translated", () => {
    expect(hasTranslation(null)).toBe(false);
    expect(hasTranslation({ a: null, b: [null, null] })).toBe(false);
    expect(hasTranslation({ management: [null, { type: "paragraph" }] })).toBe(false);
  });
  it("is true when one field is", () => {
    expect(hasTranslation({ a: null, b: [null, "اثنان"] })).toBe(true);
  });
});

describe("translationSettingKey", () => {
  it("keeps the English record where it is and adds a row per language", () => {
    expect(translationSettingKey("home", "ar")).toBe("home:ar");
    expect(translationSettingKey("project-chrome:abc", "ja")).toBe("project-chrome:abc:ja");
  });
});

// ── Which keys are text ──────────────────────────────────────────────────────
//
// Every key of every shape the CMS stores is either text (TEXT_KEYS) or shared
// with English (SHARED_KEYS). A key that is in neither fails here, so a new
// field forces the decision instead of silently staying English — or silently
// letting an image link be translated.

const SHARED_KEYS = new Set([
  // media and links
  "image", "images", "src", "media", "heroVideo", "heroImage", "storyImage", "chairmanImage", "ceoImage", "visitImage", "bandImage",
  "imageOne", "imageTwo", "imageTen", "map", "intro", "logoWhite", "logoBlack", "markWhite", "markBlack",
  "url", "href", "ctaUrl", "heroCtaUrl", "heroSecondaryUrl", "visitLinkUrl", "bandLinkUrl", "ctaUrl", "directionsUrl", "mapUrl",
  "statsNoteUrl", "pressLinkUrl",
  // contact details, which are the same in every language
  "email", "phone", "whatsapp", "facebook", "x", "instagram", "youtube", "linkedin",
  // identity and structure
  "id", "type", "key", "slug", "kind", "anchor", "position", "code", "icon", "phase", "trend", "callout", "privacy",
  "presentation", "sectionOrder", "yieldBar", "gainBar",
  // numbers written with Western digits, which Arabic keeps
  "lat", "lng", "reveal", "percent",
  "totalSqft", "totalSqm", "suiteSqft", "suiteSqm", "balconySqft", "balconySqm",
  // names of shapes that hold settings rather than text
  "style",
]);

function leafKeys(value: unknown, key: string, out: Set<string>) {
  if (Array.isArray(value)) { value.forEach((item) => leafKeys(item, key, out)); return; }
  if (typeof value === "string") { out.add(key); return; }
  if (value && typeof value === "object") {
    for (const [name, item] of Object.entries(value)) leafKeys(item, name, out);
  }
}

const storedShapes: [string, unknown][] = [
  ["home", homeDefaults],
  ["about", aboutDefaults],
  ["history", { ...legacyGalleryDefaults, ...legacyDefaults }],
  ["investor guide", investDefaults],
  ["news page", newsListingDefaults],
  ["seven x seven", sxsDefaults],
  ["contact form", contactInquiryDefaults],
  ["legal contact", legalContact],
  ["legal documents", legalDocuments],
  ["legal page blocks", termsPageContent],
  ["standard sections", starterModules],
  ["delivered sections", Object.values(legacyProjectTemplates).map((template) => template.modules)],
  ["key facts", { keyFacts: defaultKeyFacts("seven-x-seven") }],
  ["page labels", projectPageLabelDefaults],
];

describe("which keys are text", () => {
  it.each(storedShapes)("decides every text key of the %s", (_name, shape) => {
    const keys = new Set<string>();
    leafKeys(shape, "", keys);
    const undecided = [...keys].filter((key) => !TEXT_KEYS.has(key) && !SHARED_KEYS.has(key));
    expect(undecided).toEqual([]);
  });

  it("never treats media, links, switches or styles as text", () => {
    for (const key of ["image", "images", "src", "url", "href", "ctaUrl", "ctaVisible", "heroCtaVisible", "popupEnabled", "headingStyle", "textStyle", "nameStyle", "sectionOrder", "calculatorIndex", "showOnHomepage", "sortOrder", "type", "id", "slug", "anchor", "position", "icon", "code", "lat", "lng", "percent", "phase", "trend", "recipients", "email", "phone", "whatsapp", "coverage", "experienceImages", "pressLinkUrl", "popupFrequency", "popupDelaySeconds", "presentation", "layout", "heroMediaType"]) {
      expect(isTranslatableKey(key), key).toBe(false);
    }
  });

  it("treats the copy of every page as text", () => {
    for (const key of ["heading", "text", "eyebrow", "title", "intro", "summary", "body", "label", "value", "name", "role", "bio", "year", "alt", "question", "answer", "consent", "copyright", "keyFacts", "tagline", "location", "coverImageAlt", "popupTitle", "footerCopyright", "minutes", "interestOptions", "salesProjects", "customerProjects", "customerNatures", "popupInterests"]) {
      expect(isTranslatableKey(key), key).toBe(true);
    }
  });

  it("leaves the calculator alone: its wording is the client's own code", () => {
    const keys = [...leafKeySet(ownershipCostPlannerDefaults)].filter((key) => isTranslatableKey(key)).sort();
    expect(keys).toEqual(["disclaimer", "label", "name"]);
  });
});

function leafKeySet(shape: unknown): Set<string> {
  const keys = new Set<string>();
  leafKeys(shape, "", keys);
  return keys;
}

describe("a form's choices", () => {
  // The Contact page's three lists, the pop-up's interests and the landing
  // page's options: text a translator can translate, line by line.
  it("are text: each line is replaced by the line at the same position", () => {
    const english = { type: "contact-form", salesProjects: ["seven x seven", "Villa 174", "General enquiry"], submitLabel: "Send" };
    expect(mergeLocale(english, { type: "contact-form", salesProjects: ["سيفن باي سيفن", "فيلا 174"] })).toEqual({ type: "contact-form", salesProjects: ["سيفن باي سيفن", "فيلا 174", "General enquiry"], submitLabel: "Send" });
  });

  it("replace the page's built-in list when nothing is saved in English", () => {
    // Nothing was saved for the list, so the page shows its defaults; a
    // translation of them must still show.
    const english = { type: "contact-form", formHeading: "Enquiry" };
    const translation = { type: "contact-form", salesProjects: ["سيفن باي سيفن", "فيلا 174", "استفسار عام"] };
    expect(mergeLocale(english, translation)).toEqual({ type: "contact-form", formHeading: "Enquiry", salesProjects: ["سيفن باي سيفن", "فيلا 174", "استفسار عام"] });
  });

  it("never let a translation add a list that is not text", () => {
    const english = { type: "hero", heading: "A" };
    expect(mergeLocale(english, { type: "hero", images: ["/a.jpg", "/b.jpg"] })).toBe(english);
    expect(mergeLocale(english, { type: "hero", salesProjects: [] })).toBe(english);
    expect(mergeLocale(english, { type: "hero", salesProjects: ["ok", "  "] })).toBe(english);
  });
});
