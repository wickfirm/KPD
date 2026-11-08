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
  it("labels journal pieces and news", () => {
    expect(newsCaption({ kind: "BLOG", minutes: 2, publishedAt: null })).toBe("Perspective · 2 min read");
    expect(newsCaption({ kind: "NEWS", minutes: 1, publishedAt: "2026-06-10T00:00:00.000Z" })).toBe("Announcement · Jun 2026");
    expect(newsCaption({ kind: "NEWS", minutes: 1, publishedAt: null })).toBe("Announcement");
  });
});
