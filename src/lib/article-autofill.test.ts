import { describe, expect, it, vi } from "vitest";
import { altFromTitle, autofillArticle, summaryFromBody, trimTo, visionImageUrl } from "./article-autofill";

const base = {
  title: "KPD hosts design and development forum",
  body: [
    "KPD convened a focused forum around the relationship between design, underwriting, and long-term project relevance. The conversation centered on how early feasibility decisions shape every later layer of a development.",
    "The session treated design as a commercial discipline.",
  ],
  summary: "",
  coverImage: "https://assets.kpd.ae/cms/forum.webp",
  coverImageAlt: "",
};

describe("trimTo / fallbacks", () => {
  it("keeps short text and prefers a sentence end", () => {
    expect(trimTo("Short.", 200)).toBe("Short.");
    const out = summaryFromBody(base.body);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out).toBe("KPD convened a focused forum around the relationship between design, underwriting, and long-term project relevance.");
  });
  it("cuts on a word boundary with an ellipsis when no sentence ends early enough", () => {
    const out = trimTo("word ".repeat(80), 50);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out).not.toMatch(/wor…$/);
  });
  it("uses the title as fallback alt text", () => {
    expect(altFromTitle(base.title)).toBe(base.title);
  });
});

describe("visionImageUrl", () => {
  it("accepts https raster images, resolves site paths, skips SVG", () => {
    expect(visionImageUrl("https://assets.kpd.ae/a.webp")).toBe("https://assets.kpd.ae/a.webp");
    expect(visionImageUrl("/legacy/assets/a.jpg", "https://kpd.ae/")).toBe("https://kpd.ae/legacy/assets/a.jpg");
    expect(visionImageUrl("https://assets.kpd.ae/logo.svg")).toBeNull();
    expect(visionImageUrl(null)).toBeNull();
  });
});

describe("autofillArticle", () => {
  it("never touches values the editor typed", async () => {
    const ask = vi.fn();
    const out = await autofillArticle({ ...base, summary: "Mine", coverImageAlt: "My alt" }, { useAi: true, ask });
    expect(ask).not.toHaveBeenCalled();
    expect(out).toEqual({ summary: "Mine", coverImageAlt: "My alt", generated: {} });
  });
  it("uses Claude's text and sends the cover image", async () => {
    const ask = vi.fn().mockResolvedValue({ summary: "A forum on design.", alt: "Glass towers against a blue sky" });
    const out = await autofillArticle(base, { useAi: true, ask });
    expect(ask).toHaveBeenCalledWith(expect.anything(), base.coverImage);
    expect(out.summary).toBe("A forum on design.");
    expect(out.coverImageAlt).toBe("Glass towers against a blue sky");
    expect(out.generated).toEqual({ summary: "ai", coverImageAlt: "ai" });
  });
  it("retries without the image, keeping Claude's summary but not an unseen alt", async () => {
    const ask = vi.fn().mockRejectedValueOnce(new Error("could not fetch image")).mockResolvedValue({ summary: "A forum.", alt: "Guess" });
    const out = await autofillArticle(base, { useAi: true, ask });
    expect(ask).toHaveBeenLastCalledWith(expect.anything(), null);
    expect(out.summary).toBe("A forum.");
    expect(out.coverImageAlt).toBe(base.title);
    expect(out.generated).toEqual({ summary: "ai", coverImageAlt: "fallback" });
  });
  it("falls back without a key or when the AI fails", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const ask = vi.fn().mockRejectedValue(new Error("down"));
    const failed = await autofillArticle(base, { useAi: true, ask });
    const noKey = await autofillArticle(base, { useAi: false });
    for (const out of [failed, noKey]) {
      expect(out.summary).toBe(summaryFromBody(base.body));
      expect(out.coverImageAlt).toBe(base.title);
      expect(out.generated).toEqual({ summary: "fallback", coverImageAlt: "fallback" });
    }
    quiet.mockRestore();
  });
  it("leaves alt empty when there is no cover image", async () => {
    const out = await autofillArticle({ ...base, coverImage: null }, { useAi: false });
    expect(out.coverImageAlt).toBeNull();
    expect(out.generated.coverImageAlt).toBeUndefined();
  });
});

describe("autofillModel", () => {
  it("defaults to Haiku and can be overridden", async () => {
    const { autofillModel } = await import("./article-autofill");
    const before = process.env.ARTICLE_AUTOFILL_MODEL;
    delete process.env.ARTICLE_AUTOFILL_MODEL;
    expect(autofillModel()).toBe("claude-haiku-5-5");
    process.env.ARTICLE_AUTOFILL_MODEL = "claude-opus-5-5";
    expect(autofillModel()).toBe("claude-opus-5-5");
    if (before === undefined) delete process.env.ARTICLE_AUTOFILL_MODEL; else process.env.ARTICLE_AUTOFILL_MODEL = before;
  });
});
