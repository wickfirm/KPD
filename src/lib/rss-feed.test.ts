import { describe, expect, it } from "vitest";
import { buildRssFeed } from "./rss-feed";

describe("rss feed", () => {
  const xml = buildRssFeed({
    articles: [{ slug: "forum", kind: "NEWS", title: "Design & Endurance", summary: "A <forum>", publishedAt: new Date("2026-06-10T00:00:00Z"), coverImage: "/img.jpg" }],
    press: [
      { publication: "Zawya", title: "KPD introduces its approach", url: "https://www.zawya.com/en/a?x=1&y=2", date: "2026-10-12", lang: "en" },
      { publication: "Al Bayan", title: "«كاسوميغاسيكي» اليابانية تتوسع في الإمارات", url: "", date: "", lang: "ar" },
    ],
    now: new Date("2026-11-09T00:00:00Z"),
  });

  it("is RSS 2.0 with a self link", () => {
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(xml).toContain('rel="self"');
  });

  it("escapes text and links", () => {
    expect(xml).toContain("<title>Design &amp; Endurance</title>");
    expect(xml).toContain("<description>A &lt;forum&gt;</description>");
    expect(xml).toContain("https://www.zawya.com/en/a?x=1&amp;y=2");
  });

  it("orders newest first, undated last, with publication as source", () => {
    const titles = [...xml.matchAll(/<item>\s*<title>([^<]*)</g)].map((m) => m[1]);
    expect(titles).toEqual(["KPD introduces its approach", "Design &amp; Endurance", "«كاسوميغاسيكي» اليابانية تتوسع في الإمارات"]);
    expect(xml).toContain('<source url="https://www.zawya.com">Zawya</source>');
    expect(xml).toContain("<dc:language>ar</dc:language>");
    expect(xml).toContain("<pubDate>Mon, 12 Oct 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Mon, 12 Oct 2026 00:00:00 GMT</lastBuildDate>");
  });
});
