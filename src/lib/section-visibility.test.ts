import { describe, expect, it } from "vitest";
import { developmentSections, hiddenFromForm, pageSections, parseHiddenSections, sectionFilter } from "./section-visibility";

describe("section visibility", () => {
  it("shows every section when nothing is saved", () => {
    const shown = sectionFilter(undefined);
    expect(pageSections.home.every((section) => shown(section.id))).toBe(true);
    expect(parseHiddenSections(null)).toEqual({});
  });

  it("hides only the listed sections", () => {
    const shown = sectionFilter(["news", "numbers"]);
    expect(shown("news")).toBe(false);
    expect(shown("numbers")).toBe(false);
    expect(shown("hero")).toBe(true);
  });

  it("reads unticked boxes as hidden", () => {
    const form = new FormData();
    for (const section of pageSections.contact) if (section.id !== "form") form.set(`show:${section.id}`, "on");
    expect(hiddenFromForm(form, pageSections.contact)).toEqual(["form"]);
  });

  it("drops malformed saved values", () => {
    expect(parseHiddenSections({ home: ["hero", "hero", 3, ""], about: "x", news: [] })).toEqual({ home: ["hero"] });
    expect(parseHiddenSections(["home"])).toEqual({});
  });

  it("lists a development's own sections by id", () => {
    const sections = developmentSections([{ id: "abc", title: "Amenities" }], true).map((section) => section.id);
    expect(sections).toEqual(["hero", "overview", "module:abc", "calculator"]);
    expect(developmentSections([], false).map((section) => section.id)).toEqual(["calculator"]);
  });

  it("uses unique ids per page", () => {
    for (const sections of Object.values(pageSections)) {
      const ids = sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
