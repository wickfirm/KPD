import { describe, expect, it } from "vitest";
import { freshSiteDraftData, newSiteDraft, siteDraftKey } from "./site-preview";
import { sectionDraftMaxAgeMs } from "./section-preview";

describe("siteDraftKey", () => {
  it("is per page and per editor, case-insensitive on the email", () => {
    expect(siteDraftKey("home", "Ed@X.com")).toBe("preview:home:ed@x.com");
    expect(siteDraftKey("invest", "ed@x.com")).toBe("preview:invest:ed@x.com");
    expect(siteDraftKey("home", "a@x.com")).not.toBe(siteDraftKey("home", "b@x.com"));
  });
});

describe("freshSiteDraftData", () => {
  it("returns the data of a recent draft", () => {
    expect(freshSiteDraftData(newSiteDraft({ a: 1 }, 1_000), 2_000)).toEqual({ a: 1 });
  });
  it("returns null for stale, future-dated or malformed drafts", () => {
    expect(freshSiteDraftData(newSiteDraft({ a: 1 }, 1_000), 1_000 + sectionDraftMaxAgeMs)).toBeNull();
    expect(freshSiteDraftData(newSiteDraft({ a: 1 }, 9_000), 1_000)).toBeNull();
    expect(freshSiteDraftData({ savedAt: 1_000 }, 2_000)).toBeNull();
    expect(freshSiteDraftData({ data: null, savedAt: 1_000 }, 2_000)).toBeNull();
    expect(freshSiteDraftData("nope")).toBeNull();
    expect(freshSiteDraftData(undefined)).toBeNull();
  });
});
