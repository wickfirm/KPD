import { describe, expect, it } from "vitest";
import { investDefaults, mergeInvestContent, sanitizeInvestContent } from "./invest-defaults";

describe("mergeInvestContent", () => {
  it("returns an empty CMS shape when nothing is saved", () => {
    expect(mergeInvestContent(undefined).metrics).toEqual([]);
    expect(mergeInvestContent(null).benefits).toEqual({ heading: "", text: "", items: [] });
    expect(mergeInvestContent([]).faq.items).toEqual([]);
  });
  it("uses only saved fields and preserves blank CMS values", () => {
    const merged = mergeInvestContent({ benefits: { heading: "Why invest", text: "" }, contact: { primaryLabel: "Talk to us" } });
    expect(merged.benefits.heading).toBe("Why invest");
    expect(merged.benefits.text).toBe("");
    expect(merged.benefits.items).toEqual([]);
    expect(merged.contact.primaryLabel).toBe("Talk to us");
    expect(merged.contact.secondaryLabel).toBe("");
  });
  it("replaces a list as a whole, including an intentionally empty list", () => {
    expect(mergeInvestContent({ faq: { items: [{ question: "Q?", answer: "A." }] } }).faq.items).toEqual([{ question: "Q?", answer: "A." }]);
    expect(mergeInvestContent({ faq: { items: [] } }).faq.items).toEqual([]);
  });
});

describe("sanitizeInvestContent", () => {
  it("round-trips the defaults unchanged", () => {
    expect(sanitizeInvestContent(investDefaults)).toEqual(investDefaults);
  });
  it("drops unknown keys, trims values, drops blank list entries and coerces trend", () => {
    const out = sanitizeInvestContent({
      evil: "<script>", faq: { heading: "  Hello  ", items: [{ question: " Q ", answer: " A ", extra: 1 }, { question: "", answer: "" }] },
      market: { rows: [{ code: "ae", city: "Dubai", yieldLabel: "7%", yieldBar: "100%", trend: "sideways", gainLabel: "+1%", gainBar: "50%" }] },
    });
    expect(out).not.toHaveProperty("evil");
    expect(out.faq.heading).toBe("Hello");
    expect(out.faq.items).toEqual([{ question: "Q", answer: "A" }]);
    expect(out.market.rows[0].trend).toBe("up");
  });
  it("survives garbage input", () => {
    expect(sanitizeInvestContent("nope").faq.items).toEqual([]);
    expect(sanitizeInvestContent(null).benefits.items).toEqual([]);
  });
});
