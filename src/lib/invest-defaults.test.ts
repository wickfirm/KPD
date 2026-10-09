import { describe, expect, it } from "vitest";
import { investDefaults, mergeInvestContent, sanitizeInvestContent } from "./invest-defaults";

describe("mergeInvestContent", () => {
  it("returns the delivered content when nothing is saved", () => {
    expect(mergeInvestContent(undefined)).toEqual(investDefaults);
    expect(mergeInvestContent(null)).toEqual(investDefaults);
    expect(mergeInvestContent([])).toEqual(investDefaults);
  });
  it("overrides field by field and falls back for empty strings", () => {
    const merged = mergeInvestContent({ benefits: { heading: "Why invest", text: "" }, contact: { primaryLabel: "Talk to us" } });
    expect(merged.benefits.heading).toBe("Why invest");
    expect(merged.benefits.text).toBe(investDefaults.benefits.text);
    expect(merged.benefits.items).toEqual(investDefaults.benefits.items);
    expect(merged.contact.primaryLabel).toBe("Talk to us");
    expect(merged.contact.secondaryLabel).toBe(investDefaults.contact.secondaryLabel);
  });
  it("replaces a list as a whole, but an empty list keeps the default", () => {
    expect(mergeInvestContent({ faq: { items: [{ question: "Q?", answer: "A." }] } }).faq.items).toEqual([{ question: "Q?", answer: "A." }]);
    expect(mergeInvestContent({ faq: { items: [] } }).faq.items).toEqual(investDefaults.faq.items);
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
