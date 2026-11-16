import { describe, expect, it, vi } from "vitest";
import { articleAiModel, generateArticleField, isMetaSummary, summaryFromBody, tidy, trimTo, visionImageUrl } from "./article-ai";

const base = {
  title: "Quiet Architecture",
  body: [
    "Quiet architecture does not mean passive architecture. It means design that knows when to hold back, when to frame, and when to let daily life take priority.",
    "For KPD, the aim is not to make buildings that shout at first glance.",
  ],
  coverImage: "https://assets.kpd.ae/cms/forum.webp",
  current: "",
};

describe("text helpers", () => {
  it("trims on sentence or word boundaries", () => {
    expect(trimTo("Short.", 200)).toBe("Short.");
    expect(summaryFromBody(base.body)).toBe("Quiet architecture does not mean passive architecture. It means design that knows when to hold back, when to frame, and when to let daily life take priority.");
    const cut = trimTo("word ".repeat(80), 50);
    expect(cut.endsWith("…")).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(50);
  });
  it("strips quotes and labels", () => {
    expect(tidy('"Quiet Architecture"')).toBe("Quiet Architecture");
    expect(tidy("Title: Quiet Architecture")).toBe("Quiet Architecture");
  });
  it("spots 'The article…' summaries", () => {
    expect(isMetaSummary("The article argues that quiet architecture is deliberate.")).toBe(true);
    expect(isMetaSummary("This post explores yield.")).toBe(true);
    expect(isMetaSummary("Discover how restraint shapes homes.")).toBe(true);
    expect(isMetaSummary("Restraint in materials and light makes homes that last.")).toBe(false);
    expect(isMetaSummary("The story of Dubai's skyline continues.")).toBe(false);
  });
  it("only sends public raster images to the AI", () => {
    expect(visionImageUrl("https://assets.kpd.ae/a.webp")).toBe("https://assets.kpd.ae/a.webp");
    expect(visionImageUrl("/legacy/assets/a.jpg", "https://kpd.ae/")).toBe("https://kpd.ae/legacy/assets/a.jpg");
    expect(visionImageUrl("https://assets.kpd.ae/logo.svg")).toBeNull();
  });
  it("defaults to Haiku", () => {
    const saved = { a: process.env.ARTICLE_AI_MODEL, b: process.env.ARTICLE_AUTOFILL_MODEL };
    delete process.env.ARTICLE_AI_MODEL; delete process.env.ARTICLE_AUTOFILL_MODEL;
    expect(articleAiModel()).toBe("claude-haiku-5-5");
    process.env.ARTICLE_AI_MODEL = "claude-opus-5-5";
    expect(articleAiModel()).toBe("claude-opus-5-5");
    if (saved.a === undefined) delete process.env.ARTICLE_AI_MODEL; else process.env.ARTICLE_AI_MODEL = saved.a;
    if (saved.b !== undefined) process.env.ARTICLE_AUTOFILL_MODEL = saved.b;
  });
});

describe("generateArticleField", () => {
  it("needs the body before calling the AI", async () => {
    const ask = vi.fn();
    for (const field of ["title", "summary", "alt"] as const) {
      const out = await generateArticleField(field, { ...base, body: ["  "] }, { ask, hasKey: true });
      expect(out.error).toMatch(/body section is empty/);
    }
    expect(ask).not.toHaveBeenCalled();
  });
  it("explains a missing key, missing cover and unreadable cover", async () => {
    const ask = vi.fn();
    expect((await generateArticleField("title", base, { ask, hasKey: false })).error).toMatch(/not set up/);
    expect((await generateArticleField("alt", { ...base, coverImage: null }, { ask, hasKey: true })).error).toMatch(/Add a cover image/);
    expect((await generateArticleField("alt", { ...base, coverImage: "https://x.test/a.svg" }, { ask, hasKey: true })).error).toMatch(/cannot be read/);
    expect(ask).not.toHaveBeenCalled();
  });
  it("generates each field, sending the cover only for alt text", async () => {
    const ask = vi.fn().mockResolvedValue('"Calm towers at dusk"');
    expect(await generateArticleField("title", base, { ask, hasKey: true })).toEqual({ text: "Calm towers at dusk" });
    expect(ask.mock.calls[0][0].imageUrl).toBeNull();
    await generateArticleField("alt", base, { ask, hasKey: true });
    expect(ask.mock.calls[1][0].imageUrl).toBe(base.coverImage);
  });
  it("asks for a different version when the field already has text", async () => {
    const ask = vi.fn().mockResolvedValue("Another headline");
    await generateArticleField("title", { ...base, current: "Quiet Architecture" }, { ask, hasKey: true });
    expect(ask.mock.calls[0][0].text).toMatch(/currently says: "Quiet Architecture"\. Write a different version/);
  });
  it("retries a 'The article…' summary once, then gives up with a message", async () => {
    const fixed = vi.fn().mockResolvedValueOnce("The article argues X.").mockResolvedValueOnce("Restraint makes better homes.");
    expect(await generateArticleField("summary", base, { ask: fixed, hasKey: true })).toEqual({ text: "Restraint makes better homes." });
    const stubborn = vi.fn().mockResolvedValue("This article explores X.");
    expect((await generateArticleField("summary", base, { ask: stubborn, hasKey: true })).error).toMatch(/try again/);
  });
  it("turns API failures into a message", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const ask = vi.fn().mockRejectedValue(new Error("down"));
    expect((await generateArticleField("summary", base, { ask, hasKey: true })).error).toMatch(/could not write/);
    quiet.mockRestore();
  });
});
