import { describe, expect, it } from "vitest";
import { legacyGalleryDefaults, pickLegacyGalleryLight } from "./legacy-defaults";

describe("pickLegacyGalleryLight", () => {
  it("keeps saved strings, including empty ones that hide an element", () => {
    expect(pickLegacyGalleryLight({ type: "legacy", nameHeading: "", bandText: "Next", timeline: [] })).toEqual({ nameHeading: "", bandText: "Next" });
  });
  it("ignores missing blocks and non-string values", () => {
    expect(pickLegacyGalleryLight(undefined)).toEqual({});
    expect(pickLegacyGalleryLight({ lede: 3 })).toEqual({});
  });
  it("has a default for every field", () => {
    expect(Object.values(legacyGalleryDefaults).every((value) => typeof value === "string" && value.length > 0)).toBe(true);
  });
});
