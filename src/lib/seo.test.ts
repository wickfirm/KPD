import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_MAX, TITLE_MAX, breadcrumbJsonLd, clampDescription, developmentDescription, developmentTitle,
  legalSeo, mediaUrl, pageMetadata, pageSeo, residenceJsonLd, webPageJsonLd, withBrand,
} from "./seo";
import { absoluteUrl } from "./site";

describe("fixed page copy fits what search engines show", () => {
  const all = [...Object.entries(pageSeo), ...Object.entries(legalSeo)];
  it.each(all)("%s has a title within the limit", (_name, seo) => {
    expect(seo.title.length).toBeGreaterThan(10);
    expect(seo.title.length).toBeLessThanOrEqual(TITLE_MAX + 2);
  });
  it.each(all)("%s has a description of a useful length", (_name, seo) => {
    expect(seo.description.length).toBeGreaterThanOrEqual(70);
    expect(seo.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });
  it("gives every page a different title and description", () => {
    expect(new Set(all.map(([, seo]) => seo.title)).size).toBe(all.length);
    expect(new Set(all.map(([, seo]) => seo.description)).size).toBe(all.length);
  });
  it("names the brand in every title", () => {
    for (const [, seo] of all) expect(/KPD|Kasumigaseki/.test(seo.title)).toBe(true);
  });
});

describe("clampDescription", () => {
  it("leaves short text alone and collapses whitespace", () => {
    expect(clampDescription("  A  short\n text. ")).toBe("A short text.");
    expect(clampDescription(null)).toBe("");
  });
  it("cuts at the end of a sentence when there is one", () => {
    const text = `${"Word ".repeat(22).trim()}. And then a second sentence that carries on for quite a while longer than allowed.`;
    const out = clampDescription(text, 120);
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out.endsWith(".")).toBe(true);
  });
  it("otherwise cuts at a word with an ellipsis", () => {
    const out = clampDescription("alpha ".repeat(60), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/alph…$/);
  });
});

describe("titles", () => {
  it("adds the brand only when it still fits", () => {
    expect(withBrand("Short title")).toBe("Short title | KPD");
    const long = "x".repeat(TITLE_MAX - 3);
    expect(withBrand(long)).toBe(long);
  });
  it("builds a development title and shortens it when needed", () => {
    expect(developmentTitle("Seven X Seven", "Dubai")).toBe("Seven X Seven | Development in Dubai | KPD");
    expect(developmentTitle("Seven X Seven", null)).toBe("Seven X Seven | Development in Dubai | KPD");
    expect(developmentTitle("Dubai Hills Mansion", "Dubai Hills Estate").length).toBeLessThanOrEqual(TITLE_MAX);
    const veryLong = developmentTitle("A Remarkably Long Development Name Residences", "Dubai Hills Estate");
    expect(veryLong.length).toBeLessThanOrEqual(TITLE_MAX + 10);
    expect(veryLong).toContain("A Remarkably Long");
  });
});

describe("developmentDescription", () => {
  it("prefers the description, then the tagline, then a sentence about the development", () => {
    expect(developmentDescription({ name: "X", description: "Real description.", tagline: "Tag" })).toBe("Real description.");
    expect(developmentDescription({ name: "X", description: "", tagline: "An address shaped\nby restraint" })).toBe("An address shaped by restraint");
    expect(developmentDescription({ name: "X" })).toContain("residential development");
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({ title: "T", description: "D ".repeat(100), path: "/about", image: "/img.jpg" });
  it("uses the exact title and a canonical link", () => {
    expect(meta.title).toEqual({ absolute: "T" });
    expect(meta.alternates?.canonical).toMatch(/\/about$/);
  });
  it("repeats the title and description for Open Graph and Twitter", () => {
    expect(meta.openGraph).toMatchObject({ type: "website", title: "T", siteName: "Kasumigaseki Properties Development" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "T" });
    expect((meta.description ?? "").length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });
  it("uses the page's own image when given one, otherwise the branded default card", () => {
    const own = pageMetadata({ title: "T", description: "D", path: "/x", image: "/hero.jpg" });
    expect(JSON.stringify(own.openGraph)).toContain("/hero.jpg");
    expect(JSON.stringify(own.openGraph)).not.toContain("opengraph-image");
    const plain = pageMetadata({ title: "T", description: "D", path: "/" });
    expect(JSON.stringify(plain.openGraph)).toContain("/opengraph-image");
    expect(JSON.stringify(plain.twitter)).toContain("/opengraph-image");
  });
  it("adds article times only for articles", () => {
    const plain = pageMetadata({ title: "T", description: "D", path: "/" });
    const article = pageMetadata({ title: "T", description: "D", path: "/news/x", type: "article", publishedTime: "2026-10-01T00:00:00.000Z" });
    expect(article.openGraph).toMatchObject({ type: "article", publishedTime: "2026-10-01T00:00:00.000Z" });
    expect(JSON.stringify(plain.openGraph)).not.toContain("publishedTime");
  });
  it("can ask search engines not to index a page", () => {
    expect(pageMetadata({ title: "T", description: "D", path: "/x", noindex: true }).robots).toEqual({ index: false, follow: true });
    expect(pageMetadata({ title: "T", description: "D", path: "/x" }).robots).toBeUndefined();
  });
});

describe("structured data", () => {
  it("keeps absolute media URLs and absolutises relative ones", () => {
    expect(mediaUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(mediaUrl("/legacy/a.jpg")).toMatch(/^https?:\/\/.+\/legacy\/a\.jpg$/);
  });
  it("numbers breadcrumb items from 1 with absolute links", () => {
    const data = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "News", path: "/news" }]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(data.itemListElement[1].item).toMatch(/\/news$/);
  });
  it("describes a page and links it to the site and organisation", () => {
    const data = webPageJsonLd({ kind: "AboutPage", name: "About", description: "D", path: "/about" });
    expect(data["@type"]).toBe("AboutPage");
    expect(data.isPartOf["@id"]).toMatch(/#website$/);
    expect(data.about["@id"]).toMatch(/#organization$/);
  });
  it("describes a development as a residence without inventing price or availability", () => {
    const data = residenceJsonLd({ slug: "emerald-villa", name: "Emerald Villa", description: "D", heroImage: "/img.jpg", location: "Dubai" });
    expect(data["@type"]).toBe("Residence");
    expect(data.address.addressCountry).toBe("AE");
    expect(Object.keys(data)).not.toContain("offers");
    expect(Object.keys(data)).not.toContain("priceRange");
  });
  it("produces JSON that parses back", () => {
    const text = JSON.stringify(residenceJsonLd({ slug: "x", name: "X" }));
    expect(JSON.parse(text).name).toBe("X");
  });
});

describe("languages", () => {
  const base = { title: "T", description: "D", path: "/about" };
  const page = { name: "About", description: "D", path: "/about" };
  const development = { slug: "emerald-villa", name: "Emerald Villa", description: "D" };
  const openGraph = (metadata: ReturnType<typeof pageMetadata>) => metadata.openGraph as { url?: string; locale?: string };

  it("gives English exactly what it had before languages existed", () => {
    expect(pageMetadata(base, "en")).toEqual(pageMetadata(base));
    expect(webPageJsonLd(page, "en")).toEqual(webPageJsonLd(page));
    expect(breadcrumbJsonLd([{ name: "Home", path: "/" }], "en")).toEqual(breadcrumbJsonLd([{ name: "Home", path: "/" }]));
    expect(residenceJsonLd(development, "en")).toEqual(residenceJsonLd(development));
  });

  it("points a page's canonical and social URL at its own language address", () => {
    const metadata = pageMetadata(base, "ar");
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/ar/about"));
    expect(openGraph(metadata).url).toBe(absoluteUrl("/ar/about"));
    expect(openGraph(metadata).locale).toBe("ar_AE");
  });

  it("names og:locale on the other languages only, so English pages do not change", () => {
    expect(openGraph(pageMetadata(base)).locale).toBeUndefined();
    expect(openGraph(pageMetadata(base, "ja")).locale).toBe("ja_JP");
  });

  it("keeps the title, description, image and feed link as they are in every language", () => {
    const english = pageMetadata({ ...base, image: "/img.jpg", type: "article" });
    const arabic = pageMetadata({ ...base, image: "/img.jpg", type: "article" }, "ar");
    expect(arabic.title).toEqual(english.title);
    expect(arabic.description).toBe(english.description);
    expect(arabic.openGraph?.images).toEqual(english.openGraph?.images);
    expect(arabic.alternates?.types).toEqual(english.alternates?.types);
  });

  it("gives structured data the page's own address and language", () => {
    const data = webPageJsonLd({ ...page, kind: "AboutPage" }, "ja");
    expect(data.url).toBe(absoluteUrl("/ja/about"));
    expect(data["@id"]).toBe(`${absoluteUrl("/ja/about")}#webpage`);
    expect(data.inLanguage).toBe("ja");
    expect(webPageJsonLd(page).inLanguage).toBe("en");
  });

  it("links breadcrumb items to the pages in the same language", () => {
    const crumbs = [{ name: "Home", path: "/" }, { name: "News", path: "/news" }];
    expect(breadcrumbJsonLd(crumbs, "ar").itemListElement.map((item) => item.item)).toEqual([absoluteUrl("/ar"), absoluteUrl("/ar/news")]);
  });

  it("names a residence's language on the other languages only", () => {
    expect(residenceJsonLd(development, "ar").url).toBe(absoluteUrl("/ar/developments/emerald-villa"));
    expect(residenceJsonLd(development, "ar").inLanguage).toBe("ar");
    expect(residenceJsonLd(development)).not.toHaveProperty("inLanguage");
  });
});
