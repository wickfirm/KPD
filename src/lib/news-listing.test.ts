import { describe, expect, it } from "vitest";
import { newsCaption, readingMinutes } from "./news-listing";

describe("readingMinutes", () => {
  it("counts words across paragraphs, minimum one minute", () => {
    expect(readingMinutes(["one two three"])).toBe(1);
    expect(readingMinutes([Array(660).fill("word").join(" ")])).toBe(3);
    expect(readingMinutes(null)).toBe(1);
  });
});

describe("newsCaption", () => {
  const news = { kind: "NEWS", minutes: 1, publishedAt: "2026-06-10T00:00:00.000Z" } as const;
  const journal = { kind: "BLOG", minutes: 2, publishedAt: null } as const;

  it("labels journal pieces and news", () => {
    expect(newsCaption({ kind: "BLOG", minutes: 2, publishedAt: null })).toBe("Perspective · 2 min read");
    expect(newsCaption({ kind: "NEWS", minutes: 1, publishedAt: "2026-06-10T00:00:00.000Z" })).toBe("Announcement · Jun 2026");
    expect(newsCaption({ kind: "NEWS", minutes: 1, publishedAt: null })).toBe("Announcement");
    // Named or not, an English page has the caption it always had.
    expect(newsCaption(news, "en", { announcement: "Announcements" })).toBe("Announcement · Jun 2026");
    expect(newsCaption(journal, "en", { perspective: "Perspectives" })).toBe("Perspective · 2 min read");
  });

  it("in another language names the kind as the page's filter does, and writes the month and the reading time in it", () => {
    expect(newsCaption(news, "ja", { announcement: "お知らせ" })).toBe("お知らせ · 2026年6月");
    expect(newsCaption(journal, "ja", { perspective: "視点" })).toBe("視点 · 2分");
    // With no name saved, the kind is the page's own word for news.
    expect(newsCaption({ ...news, publishedAt: null }, "ja", {})).toBe("ニュース");
    const arabic = newsCaption(news, "ar", { announcement: "الإعلانات" });
    expect(arabic).toMatch(/^الإعلانات · .* 2026$/);
    expect(arabic).not.toMatch(/[A-Za-z]/);
  });
});
