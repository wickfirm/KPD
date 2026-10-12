import { describe, expect, it } from "vitest";
import { applySeoOverride, fixedPageSeoDefaults, parseSeoOverride, seoKey, seoOverrideFromForm } from "./seo-overrides";
import { legalSeo, pageSeo } from "./seo";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

describe("seoKey", () => {
  it("namespaces one settings row per item", () => {
    expect(seoKey("page", "about")).toBe("seo:page:about");
    expect(seoKey("article", "abc")).toBe("seo:article:abc");
    expect(seoKey("project", "xyz")).toBe("seo:project:xyz");
  });
});

describe("seoOverrideFromForm", () => {
  it("reads and tidies the two boxes", () => {
    expect(seoOverrideFromForm(form({ seoTitle: "  A   title ", seoDescription: "Line one\nline two " }))).toEqual({ title: "A title", description: "Line one line two" });
  });
  it("returns an empty override when both boxes are blank", () => {
    expect(seoOverrideFromForm(form({ seoTitle: " ", seoDescription: "" }))).toEqual({});
  });
  it("returns null when the form has no SEO boxes (older saved versions)", () => {
    expect(seoOverrideFromForm(form({ title: "x" }))).toBeNull();
  });
});

describe("parseSeoOverride", () => {
  it("keeps only non-empty strings", () => {
    expect(parseSeoOverride({ title: "T", description: 5 })).toEqual({ title: "T" });
    expect(parseSeoOverride(null)).toEqual({});
    expect(parseSeoOverride(["x"])).toEqual({});
  });
});

describe("applySeoOverride", () => {
  const base = { title: "Auto title", description: "Auto description", path: "/x" };
  it("uses the saved text where there is some", () => {
    expect(applySeoOverride(base, { title: "Mine" })).toEqual({ title: "Mine", description: "Auto description", path: "/x" });
    expect(applySeoOverride(base, { description: "Mine too" })).toEqual({ title: "Auto title", description: "Mine too", path: "/x" });
  });
  it("falls back to the automatic text when nothing is saved", () => {
    expect(applySeoOverride(base, {})).toEqual(base);
  });
});

describe("fixedPageSeoDefaults", () => {
  it("maps page slugs to the built-in copy", () => {
    expect(fixedPageSeoDefaults("home")).toEqual(pageSeo.home);
    expect(fixedPageSeoDefaults("invest-in-dubai")).toEqual(pageSeo.invest);
    expect(fixedPageSeoDefaults("terms")).toEqual({ ...legalSeo.terms, path: "/terms" });
    expect(fixedPageSeoDefaults("unknown")).toBeNull();
  });
});
