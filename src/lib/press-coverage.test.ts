import { describe, expect, it } from "vitest";
import { detectLang, normalizePressItems, pressCoverageDefaults, resolvePressItems, sortPressItems, splitGoogleNewsTitle } from "./press-coverage";

describe("press coverage", () => {
  it("ships the 24 supplied items, Arabic ones marked ar", () => {
    expect(pressCoverageDefaults).toHaveLength(24);
    for (const item of pressCoverageDefaults) expect(item.lang).toBe(detectLang(item.title));
    expect(pressCoverageDefaults.filter((item) => item.lang === "ar")).toHaveLength(5);
    expect(pressCoverageDefaults.filter((item) => !item.url).map((item) => item.publication)).toEqual(["Zawya"]);
  });

  it("uses the supplied list until the editor saves one, and keeps a saved empty list", () => {
    expect(resolvePressItems(undefined)).toBe(pressCoverageDefaults);
    expect(resolvePressItems([])).toEqual([]);
  });

  it("drops rows without a headline and unsafe links or dates", () => {
    expect(normalizePressItems([
      { publication: " Zawya ", title: " Headline ", url: "javascript:alert(1)", date: "2026-13-40" },
      { publication: "X", title: "  " },
      { title: "عنوان", url: "https://example.com/a", date: "2026-10-12" },
    ])).toEqual([
      { publication: "Zawya", title: "Headline", url: "", date: "", lang: "en" },
      { publication: "", title: "عنوان", url: "https://example.com/a", date: "2026-10-12", lang: "ar" },
    ]);
  });

  it("sorts newest first and keeps undated items last in editor order", () => {
    const item = (title: string, date: string) => ({ publication: "", title, url: "", date, lang: "en" as const });
    expect(sortPressItems([item("a", ""), item("b", "2026-10-01"), item("c", ""), item("d", "2026-10-12")]).map((i) => i.title)).toEqual(["d", "b", "a", "c"]);
  });

  it("splits the publication off a Google News title", () => {
    expect(splitGoogleNewsTitle("Japanese developer expands - Emirates 24|7")).toEqual({ title: "Japanese developer expands", publication: "Emirates 24|7" });
    expect(splitGoogleNewsTitle("No publication")).toEqual({ title: "No publication", publication: "" });
  });
});
