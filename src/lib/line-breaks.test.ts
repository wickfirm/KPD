import { describe, expect, it } from "vitest";
import { normalizeLineBreaks } from "./line-breaks";

describe("normalizeLineBreaks", () => {
  it("keeps a single line as it is", () => {
    expect(normalizeLineBreaks("Turning Challenge Into Value")).toBe("Turning Challenge Into Value");
  });
  it("turns Windows and old Mac line endings into one newline", () => {
    expect(normalizeLineBreaks("Turning Challenge\r\nInto Value")).toBe("Turning Challenge\nInto Value");
    expect(normalizeLineBreaks("Turning Challenge\rInto Value")).toBe("Turning Challenge\nInto Value");
  });
  it("trims spaces around every line and around the whole text", () => {
    expect(normalizeLineBreaks("  Soulful Places \r\n Enriched Lives  ")).toBe("Soulful Places\nEnriched Lives");
  });
  it("drops blank lines so a heading never gets an empty line", () => {
    expect(normalizeLineBreaks("A\n\n\nB\n")).toBe("A\nB");
  });
  it("handles empty and missing values", () => {
    expect(normalizeLineBreaks("")).toBe("");
    expect(normalizeLineBreaks(null)).toBe("");
    expect(normalizeLineBreaks(undefined)).toBe("");
  });
});
