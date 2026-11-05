import { describe, expect, it } from "vitest";
import { normalizeLineBreaks, preserveLineBreaks } from "./line-breaks";

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

describe("preserveLineBreaks (body copy, feedback items 4 and 16)", () => {
  it("keeps blank lines so editors can add vertical spacing", () => {
    expect(preserveLineBreaks("Line one\r\n\r\nLine two")).toBe("Line one\n\nLine two");
    expect(preserveLineBreaks("Line one\n\n\n\nLine two")).toBe("Line one\n\n\n\nLine two");
  });
  it("still tidies line endings and trailing whitespace", () => {
    expect(preserveLineBreaks("Line one  \r\nLine two\t")).toBe("Line one\nLine two");
    expect(preserveLineBreaks("\n\nLine one\n\n")).toBe("Line one");
    expect(preserveLineBreaks(null)).toBe("");
  });
});
