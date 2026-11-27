import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

// What search engines are told about another language follows the language
// selector, as the "keep out of search" mark does. Until the selector is
// switched on a translation can be reached at its address, but no page
// declares it and the sitemap does not list it (the user's decision, 27 Nov).

const state = vi.hoisted(() => ({ switcher: false }));
vi.mock("@/lib/locale", () => ({
  getSwitcherLocales: async () => (state.switcher ? ["ar", "ja"] : []),
  getPublishedLocales: async () => ["ar", "ja"],
}));
vi.mock("@/lib/translations/store", () => ({
  settingTranslationLocales: async (ids: string[]) => new Map(ids.map((id) => [id, ["ar", "ja"]])),
  pageTranslationLocalesBySlug: async (slugs: string[]) => new Map(slugs.map((slug) => [slug, ["ar"]])),
  articleTranslationLocales: async () => new Map(),
  projectTranslationLocales: async () => new Map(),
}));
const { pageLanguages } = await import("@/lib/hreflang");

describe("the languages a page declares to search engines", () => {
  it("are none while the selector is off, though the translations exist", async () => {
    state.switcher = false;
    expect(await pageLanguages({ setting: "home" })).toEqual([]);
    expect(await pageLanguages({ page: "about" })).toEqual([]);
  });

  it("are the ones the selector offers once it is switched on", async () => {
    state.switcher = true;
    // A page's answer is read once a request, so these are other pages.
    expect(await pageLanguages({ setting: "news_listing" })).toEqual(["ar", "ja"]);
    expect(await pageLanguages({ page: "contact" })).toEqual(["ar"]);
  });
});

describe("the selector", () => {
  const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

  it("is what hreflang and the sitemap follow, as the robots tag does", () => {
    expect(source("src/lib/hreflang.ts")).toMatch(/getSwitcherLocales\(/);
    expect(source("src/app/sitemap.ts")).toMatch(/getSwitcherLocales\(/);
    expect(source("src/app/layout.tsx")).toMatch(/getSwitcherShown\(/);
    // Not whether a language can be reached: that is another question.
    for (const file of ["src/lib/hreflang.ts", "src/app/sitemap.ts"]) expect(source(file), file).not.toMatch(/getPublishedLocales/);
  });
});
