import { describe, expect, it } from "vitest";
import { brochureFileName, brochureLink, r2KeyFromPublicUrl } from "./brochure-download";

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
  it("finds the R2 key behind a public CMS file link", () => {
    const base = "https://pub-1.r2.dev";
    expect(r2KeyFromPublicUrl("https://pub-1.r2.dev/cms/2026-11-12/a%20b.pdf", base)).toBe("cms/2026-11-12/a b.pdf");
    expect(r2KeyFromPublicUrl("https://pub-1.r2.dev/cms/x.pdf?v=2", `${base}/`)).toBe("cms/x.pdf");
    expect(r2KeyFromPublicUrl("https://kpd.ae/legacy/assets/x.pdf", base)).toBe("");
    expect(r2KeyFromPublicUrl("https://pub-1.r2.dev.evil.com/x.pdf", base)).toBe("");
    expect(r2KeyFromPublicUrl("https://pub-1.r2.dev/x.pdf", "")).toBe("");
  });
  it("names the saved file after the development", () => {
    expect(brochureFileName("seven-x-seven", "https://cdn/x/abc.PDF")).toBe("seven-x-seven-brochure.pdf");
    expect(brochureFileName("Villa 174", "https://cdn/x/abc")).toBe("villa-174-brochure.pdf");
  });
});
