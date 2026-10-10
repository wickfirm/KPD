import { describe, expect, it } from "vitest";
import { articleDraftKey, isFreshArticleDraft, type ArticleDraft } from "./article-preview";
import { sectionDraftMaxAgeMs } from "./section-preview";

const draft = (patch: Partial<ArticleDraft> = {}): ArticleDraft => ({ kind: "NEWS", slug: "x", title: "T", summary: "S", body: ["a"], coverImage: null, coverImageAlt: null, savedAt: 1_000, ...patch });

describe("articleDraftKey", () => {
  it("keys an existing article by id", () => {
    expect(articleDraftKey("abc", "ed@x.com")).toBe("preview:article:abc");
  });
  it("keys a new article per editor so drafts never collide", () => {
    expect(articleDraftKey("", "Ed@X.com")).toBe("preview:article:new:ed@x.com");
    expect(articleDraftKey("", "a@x.com")).not.toBe(articleDraftKey("", "b@x.com"));
  });
});

describe("isFreshArticleDraft", () => {
  it("accepts a recent well-formed draft", () => {
    expect(isFreshArticleDraft(draft(), 2_000)).toBe(true);
  });
  it("rejects stale, future-dated and malformed drafts", () => {
    expect(isFreshArticleDraft(draft(), 1_000 + sectionDraftMaxAgeMs)).toBe(false);
    expect(isFreshArticleDraft(draft({ savedAt: 9_000 }), 1_000)).toBe(false);
    expect(isFreshArticleDraft(draft({ kind: "OTHER" as never }), 2_000)).toBe(false);
    expect(isFreshArticleDraft({ title: "x", summary: "y", body: "not an array", kind: "NEWS", savedAt: 1_000 }, 2_000)).toBe(false);
    expect(isFreshArticleDraft(null)).toBe(false);
  });
});
