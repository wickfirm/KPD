import { describe, expect, it, vi } from "vitest";
import en from "./i18n/en";
import { t } from "./i18n";

// A partial Arabic translation, as the sheet leaves one until every line is
// reviewed: some entries translated, the rest still to come.
vi.mock("./i18n/ar", () => ({
  default: { nav: { home: "الرئيسية" }, news: { showAll: "عرض الكل ({count})" }, dev: { plan: "خطة {number}" } },
}));

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
  /// Every "area.name" key with its text.
  function strings(value: unknown, path = ""): [string, string][] {
    if (typeof value !== "object" || value === null) return [];
    return Object.entries(value).flatMap(([key, entry]) =>
      typeof entry === "string" ? [[`${path}${key}`, entry] as [string, string]] : strings(entry, `${path}${key}.`));
  }

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
