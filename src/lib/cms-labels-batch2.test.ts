import { describe, expect, it } from "vitest";
import { mortgageCalculatorHtml, mortgageCalculatorHtmlWith, mortgageCalculatorLabelDefaults } from "./mortgage-calculator-html";
import { investLabel, investLabelDefaults, mergeInvestContent } from "./invest-defaults";
import { sectionEyebrow } from "./development-section-labels";
import { parseProjectChrome } from "./project-chrome";
import { normalizePressItems } from "./press-coverage";
import { contactInquiryDefaults, mergeContactInquiryContent } from "./contact-inquiry-content";

describe("calculator wording (batch 2)", () => {
  it("finds every delivered label in the markup", () => {
    for (const key of Object.keys(mortgageCalculatorLabelDefaults) as (keyof typeof mortgageCalculatorLabelDefaults)[]) {
      const changed = mortgageCalculatorHtmlWith({ [key]: `CHANGED ${key}` });
      expect(changed, key).toContain(`CHANGED ${key}`);
      expect(changed.length - mortgageCalculatorHtml.length, key).toBe(`CHANGED ${key}`.length - mortgageCalculatorLabelDefaults[key].length);
    }
  });
  it("leaves the delivered markup untouched when labels are blank", () => {
    expect(mortgageCalculatorHtmlWith({ estimateLabel: "", submitLabel: "  " })).toBe(mortgageCalculatorHtml);
  });
  it("escapes label text", () => {
    expect(mortgageCalculatorHtmlWith({ formHeading: "<b>x</b>" })).toContain("<h4>&lt;b&gt;x&lt;/b&gt;</h4>");
  });
});

describe("investor guide labels", () => {
  it("keeps saved labels and the calculator wording through sanitising", () => {
    const content = mergeInvestContent({ labels: { benefits: "Why the UAE", junk: "x" }, calculator: { heading: "H", submitLabel: "Apply" } });
    expect(content.labels.benefits).toBe("Why the UAE");
    expect((content.labels as Record<string, string>).junk).toBeUndefined();
    expect(content.calculator.submitLabel).toBe("Apply");
  });
  it("falls back to the approved wording for older saves", () => {
    const content = mergeInvestContent({});
    expect(investLabel(content.labels, "yieldCity")).toBe(investLabelDefaults.yieldCity);
    expect(investLabel(undefined, "featuredCta")).toBe("Explore");
  });
});

describe("development page labels", () => {
  it("uses the saved section caption, an empty one hides it, absent keeps the default", () => {
    expect(sectionEyebrow("amenities", undefined)).toBe("Amenities");
    expect(sectionEyebrow("amenities", "Wellness")).toBe("Wellness");
    expect(sectionEyebrow("amenities", "")).toBe("");
  });
  it("keeps page labels, including hidden ones", () => {
    expect(parseProjectChrome({ labels: { overview: "", driveNote: "From {name}", junk: 1 } }).labels).toEqual({ overview: "", driveNote: "From {name}" });
    expect(parseProjectChrome({}).labels).toBeUndefined();
  });
});

describe("press pictures and contact wording", () => {
  it("keeps a press picture only when it is a site path or a web link", () => {
    const [a, b] = normalizePressItems([{ title: "A", image: "/media/a.jpg" }, { title: "B", image: "javascript:alert(1)" }]);
    expect(a.image).toBe("/media/a.jpg");
    expect(b.image).toBeUndefined();
  });
  it("fills new contact wording for blocks saved before it existed", () => {
    const merged = mergeContactInquiryContent({ salesLabel: "Sales" });
    expect(merged.salesLabel).toBe("Sales");
    expect(merged.submitLabel).toBe(contactInquiryDefaults.submitLabel);
    expect(merged.formHeading).toBe("How can we help?");
  });
});
