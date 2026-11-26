import { describe, expect, it, vi } from "vitest";
import { t } from "./i18n";

// Both dictionaries empty, as they are until the translation sheet arrives:
// every string must still come out in English.
vi.mock("./i18n/ar", () => ({ default: {} }));
vi.mock("./i18n/ja", () => ({ default: {} }));

describe("t with no translations at all", () => {
  it.each(["ar", "ja"] as const)("shows English for every key in %s", (locale) => {
    expect(t(locale, "nav.home")).toBe("Home");
    expect(t(locale, "footer.company")).toBe("Company");
    expect(t(locale, "news.noArticles")).toBe("No articles in this category yet.");
    expect(t(locale, "dev.enquireHeading")).toBe("Arrange a private\nviewing.");
    expect(t(locale, "dev.plan", { number: 2 })).toBe("Plan 2");
  });
});
