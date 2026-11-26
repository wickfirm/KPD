import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import { languageAlternates, pageMetadata } from "@/lib/seo";

// A page declares its other languages only where it has a translation in a
// language that is published (the brief's rule). An English page with none is
// exactly what it was.

describe("hreflang alternates", () => {
  it("an English page with no translation declares none, and is exactly what it was", () => {
    const withNone = pageMetadata({ title: "A", description: "B", path: "/about" }, "en", []);
    const asBefore = pageMetadata({ title: "A", description: "B", path: "/about" }, "en");
    expect(withNone).toEqual(asBefore);
    expect((withNone.alternates as NonNullable<Metadata["alternates"]>).languages).toBeUndefined();
  });

  it("declares each language the page has a translation in, English included, and English again as the default", () => {
    expect(languageAlternates({ locale: "en", path: "/about", translated: ["ar"] })).toEqual({
      en: "https://kpd.ae/about",
      ar: "https://kpd.ae/ar/about",
      "x-default": "https://kpd.ae/about",
    });
    expect(languageAlternates({ locale: "ar", path: "/news/x", translated: ["ar", "ja"] })).toEqual({
      en: "https://kpd.ae/news/x",
      ar: "https://kpd.ae/ar/news/x",
      ja: "https://kpd.ae/ja/news/x",
      "x-default": "https://kpd.ae/news/x",
    });
  });

  it("a language's own page that is only the English under another address declares none", () => {
    expect(languageAlternates({ locale: "ja", path: "/about", translated: ["ar"] })).toBeUndefined();
    expect(languageAlternates({ locale: "ar", path: "/about", translated: [] })).toBeUndefined();
  });

  it("keeps the canonical address, the feed link and og:locale as they were", () => {
    const meta = pageMetadata({ title: "A", description: "B", path: "/about" }, "ar", ["ar"]);
    expect(meta.alternates?.canonical).toBe("https://kpd.ae/ar/about");
    expect(meta.openGraph?.locale).toBe("ar_AE");
    expect(meta.alternates?.types?.["application/rss+xml"]).toHaveLength(1);
  });
});
