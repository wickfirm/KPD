import { describe, expect, it } from "vitest";
import { brochureLink } from "./brochure-mail";

describe("brochure download links", () => {
  it("keeps absolute http links and resolves site paths", () => {
    expect(brochureLink("https://kpd.ae", "https://cdn.example/brochure.pdf")).toBe("https://cdn.example/brochure.pdf");
    expect(brochureLink("https://kpd.ae", "/uploads/brochure.pdf")).toBe("https://kpd.ae/uploads/brochure.pdf");
  });
  it("rejects script and bare addresses", () => {
    expect(brochureLink("https://kpd.ae", "javascript:alert(1)")).toBe("");
    expect(brochureLink("https://kpd.ae", "brochure.pdf")).toBe("");
    expect(brochureLink("https://kpd.ae", "")).toBe("");
  });
});
