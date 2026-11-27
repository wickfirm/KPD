import { describe, expect, it, vi } from "vitest";
import en from "./i18n/en";
import { t } from "./i18n";

// Partial translations, as a sheet leaves them until every line is reviewed:
// some entries translated, the rest still to come. The real files are complete
// (see "the translations" below), so the fallback is shown with these.
vi.mock("./i18n/ar", () => ({
  default: { nav: { home: "الرئيسية" }, news: { showAll: "عرض الكل ({count})" }, dev: { plan: "خطة {number}" } },
}));
vi.mock("./i18n/ja", () => ({ default: { nav: { home: "ホーム" } } }));

/// Every "area.name" key with its text.
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, entry]) =>
    typeof entry === "string" ? [[`${path}${key}`, entry] as [string, string]] : strings(entry, `${path}${key}.`));
}
/// A text's placeholders, sorted: "{name} — {title}" and "{title} — {name}" hold the same.
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(" ");

describe("t", () => {
  it("gives English the dictionary text", () => {
    expect(t("en", "nav.about")).toBe("About");
    expect(t("en", "nav.backToNews")).toBe("Back to News");
  });

  it("uses a translation where there is one", () => {
    expect(t("ar", "nav.home")).toBe("الرئيسية");
  });

  it("falls back to English for anything a translation leaves out", () => {
    expect(t("ar", "nav.about")).toBe("About");
    expect(t("ar", "footer.company")).toBe("Company");
  });

  it("falls back to English for anything a translation leaves out, in either language", () => {
    expect(t("ar", "nav.about")).toBe("About");
    expect(t("ar", "footer.company")).toBe("Company");
    expect(t("ja", "nav.home")).toBe("ホーム");
    expect(t("ja", "nav.siteMenu")).toBe("Site menu");
    expect(t("ja", "footer.company")).toBe("Company");
  });

  it("fills placeholders, so a translation can move a number in its sentence", () => {
    expect(t("en", "dev.plan", { number: 3 })).toBe("Plan 3");
    expect(t("ar", "dev.plan", { number: 3 })).toBe("خطة 3");
    expect(t("ar", "news.showAll", { count: 12 })).toBe("عرض الكل (12)");
  });

  it("leaves a placeholder alone when no value is given for it", () => {
    expect(t("en", "dev.showSlide")).toBe("Show slide {number}");
    expect(t("en", "dev.showSlide", { other: 1 })).toBe("Show slide {number}");
  });
});

describe("the English dictionary", () => {
  it("has text for every key, with no stray whitespace around it", () => {
    const all = strings(en);
    expect(all.length).toBeGreaterThan(100);
    for (const [key, text] of all) {
      expect(text, key).not.toBe("");
      expect(text.trim(), key).toBe(text);
    }
  });

  it("writes every placeholder as {name}", () => {
    for (const [, text] of strings(en)) expect(text).toMatch(/^[^{}]*(\{\w+\}[^{}]*)*$/);
  });

  it("uses one key per text where the site shows the same label in several places", () => {
    // The page trails reuse the menu's labels rather than keeping copies.
    expect(en.breadcrumb).not.toHaveProperty("home");
    expect(en.breadcrumb).not.toHaveProperty("about");
  });
});

describe("the translations", () => {
  // The files as they are, whatever the partial ones mocked above.
  const real = async (name: "ar" | "ja"): Promise<unknown> => (await vi.importActual<{ default: unknown }>(`./i18n/${name}`)).default;

  // A string of the site's own words that has no translation shows English on
  // that page. The site is meant to be translated in full, so a string added
  // to en.ts fails here until both files hold it (docs/translations/).
  it.each([["Arabic", "ar"], ["Japanese", "ja"]] as const)("%s holds every string of the English dictionary, with the same placeholders", async (label, name) => {
    const dictionary = await real(name);
    const english = strings(en);
    expect(strings(dictionary).map(([key]) => key).sort(), label).toEqual(english.map(([key]) => key).sort());
    for (const [key, text] of english) {
      const translated = key.split(".").reduce<unknown>((part, piece) => (part as Record<string, unknown>)[piece], dictionary);
      expect(translated, `${label} ${key}`).toBeTypeOf("string");
      expect((translated as string).trim(), `${label} ${key}`).toBe(translated);
      expect(placeholders(translated as string), `${label} ${key}`).toBe(placeholders(text));
    }
  });
});
