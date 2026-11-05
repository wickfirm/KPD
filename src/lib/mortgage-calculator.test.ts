import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mortgageCalculatorDefaultCopy, mortgageCalculatorHtml, mortgageCalculatorHtmlWith, mortgageCalculatorSectionProps } from "./mortgage-calculator-html";

const script = readFileSync(new URL("../../public/legacy/assets/js/mortgage-calculator.js", import.meta.url), "utf8");

/// Every id and data-attribute hook the client's calculator script looks up.
const hooks = {
  ids: [...new Set([...script.matchAll(/["'`]#([a-z][a-z0-9-]*)["'`]/g)].map((m) => m[1]))],
  data: [...new Set([...script.matchAll(/\[(data-[a-z-]+)(?:=[^\]]*)?\]/g)].map((m) => m[1]))],
};

describe("the client's mortgage calculator markup", () => {
  it("contains every id the delivered script queries", () => {
    expect(hooks.ids.length).toBeGreaterThan(8);
    for (const id of hooks.ids) expect(mortgageCalculatorHtml, `#${id}`).toContain(`id="${id}"`);
  });

  it("contains every data attribute the delivered script queries", () => {
    expect(hooks.data.length).toBeGreaterThan(15);
    // The wrapper's own attribute is rendered by the view from mortgageCalculatorSectionProps.
    const everything = `${mortgageCalculatorHtml} ${Object.keys(mortgageCalculatorSectionProps).join(" ")}`;
    for (const name of hooks.data) expect(everything, `[${name}]`).toMatch(new RegExp(`\\b${name}\\b`));
  });

  it("is the section's inner markup only: no script, no wrapper section, a labelled heading", () => {
    expect(mortgageCalculatorHtml).not.toMatch(/<script|<section|<\/section>/i);
    expect(mortgageCalculatorHtml).toContain('id="mortgage-calculator-title"');
  });

  it("starts with the client's defaults: 5,000,000 AED, 40% down, 25 years at 4.54%", () => {
    expect(mortgageCalculatorHtml).toContain('id="mortgage-price" type="text" inputmode="numeric" value="5,000,000"');
    expect(mortgageCalculatorHtml).toContain('id="mortgage-term" type="number" min="1" max="25" step="1" value="25"');
    expect(mortgageCalculatorHtml).toContain('id="mortgage-rate" type="number" min="1" max="10" step="0.01" value="4.54"');
  });

  it("has the eligibility form posting to mailto, so the CMS script routes it to Messages and Salesforce", () => {
    expect(mortgageCalculatorHtml).toContain('class="mortgage-lead-form contact-adaptive-form" action="mailto:');
    expect(mortgageCalculatorHtml).toContain('name="Inquiry Type" value="Mortgage Eligibility Review"');
  });

  it("keeps every script hook when the CMS heading and intro are injected", () => {
    const injected = mortgageCalculatorHtmlWith({ heading: "Test\nheading <1>", text: "Test intro" });
    for (const id of hooks.ids) expect(injected, `#${id}`).toContain(`id="${id}"`);
    const everything = `${injected} ${Object.keys(mortgageCalculatorSectionProps).join(" ")}`;
    for (const name of hooks.data) expect(everything, `[${name}]`).toMatch(new RegExp(`\\b${name}\\b`));
    expect(injected).toContain(`<h2 id="mortgage-calculator-title">Test<br>heading &lt;1&gt;</h2>`);
    expect(injected).toContain(`<p>Test intro</p>`);
  });

  it("falls back to the delivered wording when the CMS values are empty", () => {
    expect(mortgageCalculatorHtmlWith({ heading: "", text: "" })).toBe(mortgageCalculatorHtml);
    expect(mortgageCalculatorHtmlWith()).toBe(mortgageCalculatorHtml);
    expect(mortgageCalculatorDefaultCopy.heading).toContain("Plan the numbers");
  });
});
