import { describe, expect, it } from "vitest";
import { homeNewsGridHtml } from "./home-news";
import type { NewsListItem } from "./news-listing";

const article = (slug: string, extra: Partial<NewsListItem> = {}): NewsListItem => ({
  slug, kind: "NEWS", title: `Title ${slug}`, summary: `Summary ${slug}`, coverImage: `/img/${slug}.jpg`, coverImageAlt: "", publishedAt: "2026-06-01T00:00:00.000Z", minutes: 1, ...extra,
});
const opts = { label: "Explore", ariaLabel: "Latest news" };

describe("homeNewsGridHtml", () => {
  it("renders nothing when no articles are published (no placeholder cards)", () => {
    expect(homeNewsGridHtml([], opts)).toBe("");
  });

  it("shows the first three articles in the given (newest-first) order, linking to each article", () => {
    const html = homeNewsGridHtml(["a", "b", "c", "d"].map((slug) => article(slug)), opts);
    expect(html.match(/<article /g)).toHaveLength(3);
    expect(html.indexOf("/news/a")).toBeLessThan(html.indexOf("/news/b"));
    expect(html).toContain('<a href="/news/c">Explore</a>');
    expect(html).not.toContain("/news/d");
    expect(html).toContain('<img src="/img/a.jpg" alt="Title a" loading="lazy">');
    expect(html).toContain("<p>Summary a</p>");
  });

  it("escapes article text and skips a missing image or summary", () => {
    const html = homeNewsGridHtml([article("x", { title: `<b>"Hi"</b>`, summary: "", coverImage: "" })], { label: "Read", ariaLabel: "News" });
    expect(html).toContain("<h3>&lt;b&gt;&quot;Hi&quot;&lt;/b&gt;</h3>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<p>");
  });
});
