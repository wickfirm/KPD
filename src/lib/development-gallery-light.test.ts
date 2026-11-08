import { describe, expect, it } from "vitest";
import { defaultKeyFacts, driveMinutes, mapsLink, parseKeyFacts } from "./development-gallery-light";

describe("development gallery-light helpers", () => {
  it("parses key facts and skips incomplete lines", () => {
    expect(parseKeyFacts("Residences | 155\nbroken\nTypes | 1 | 2")).toEqual([{ label: "Residences", value: "155" }, { label: "Types", value: "1 | 2" }]);
    expect(parseKeyFacts(defaultKeyFacts("seven-x-seven"))).toHaveLength(5);
    expect(defaultKeyFacts("villa")).toBe("");
  });
  it("reads drive minutes", () => {
    expect(driveMinutes("8 mins")).toBe(8);
    expect(driveMinutes("about 22 min")).toBe(22);
    expect(Number.isNaN(driveMinutes("soon"))).toBe(true);
  });
  it("turns an embed map into a link", () => {
    expect(mapsLink("https://maps.google.com/maps?q=25.18%2C55.32&z=16&output=embed")).toBe("https://maps.google.com/maps?q=25.18%2C55.32&z=16");
  });
});
