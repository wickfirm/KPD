import { describe, expect, it } from "vitest";
import { isPublished, localesSettingKey, parsePublishedLocales, parseSwitcherShown } from "./published-locales";

describe("parsePublishedLocales", () => {
  it("lists only the languages switched on", () => {
    expect(parsePublishedLocales({ ar: true, ja: false })).toEqual(["ar"]);
    expect(parsePublishedLocales({ ar: true, ja: true })).toEqual(["ar", "ja"]);
    expect(parsePublishedLocales({ ar: false, ja: false })).toEqual([]);
  });
  it.each([undefined, null, "ar", ["ar"], {}, { ar: "true" }, { ar: 1 }, { en: true }])(
    "treats %j as nothing published",
    (value) => expect(parsePublishedLocales(value)).toEqual([]),
  );
  it("is not moved by the switcher key", () => {
    expect(parsePublishedLocales({ ar: true, ja: true, switcher: true })).toEqual(["ar", "ja"]);
    expect(parsePublishedLocales({ ar: true, ja: true, switcher: false })).toEqual(["ar", "ja"]);
  });
});

describe("parseSwitcherShown", () => {
  it("is on only when the row says exactly true", () => {
    expect(parseSwitcherShown({ ar: true, ja: true, switcher: true })).toBe(true);
    // It does not depend on a language being on.
    expect(parseSwitcherShown({ ar: false, ja: false, switcher: true })).toBe(true);
  });
  it.each([undefined, null, true, "true", ["switcher"], {}, { ar: true, ja: true }, { switcher: "true" }, { switcher: 1 }])(
    "treats %j as off",
    (value) => expect(parseSwitcherShown(value)).toBe(false),
  );
});

describe("isPublished", () => {
  it("is always true for English", () => {
    expect(isPublished("en", [])).toBe(true);
  });
  it("follows the switches for the others", () => {
    expect(isPublished("ar", ["ar"])).toBe(true);
    expect(isPublished("ja", ["ar"])).toBe(false);
  });
});

describe("localesSettingKey", () => {
  it("stores the switches in their own site_settings row", () => {
    expect(localesSettingKey).toBe("locales");
  });
});
