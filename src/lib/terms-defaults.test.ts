import { describe, expect, it } from "vitest";
import { termsPageContent, termsPageTitle } from "./terms-defaults";

describe("terms page copy", () => {
  it("uses the client document title and the terms sections only", () => {
    expect(termsPageTitle).toBe("Terms and Conditions");
    const headings = termsPageContent.filter((block) => block.type === "heading").map((block) => block.heading);
    expect(headings).toContain("Governing law");
    expect(headings).toContain("Warranties and liability");
    expect(headings).not.toContain("Who this covers");
    expect(headings).not.toContain("Managing cookies");
    const text = termsPageContent.map((block) => block.text ?? "").join("\n");
    expect(text).toContain("laws of the United Arab Emirates");
    expect(text).toContain("info@kpd.ae");
    expect(text).not.toContain("We do not sell personal information");
  });
});
