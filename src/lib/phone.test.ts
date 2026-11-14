import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dialCodeLabel, looksLikePhone, PHONE_COUNTRIES, withDialCode } from "./phone";

describe("withDialCode", () => {
  it("prefixes the selected country's dial code and drops the trunk zero", () => {
    expect(withDialCode("050 123 4567", "United Arab Emirates (+971)")).toBe("+971 50 123 4567");
    expect(withDialCode("7700 900123", "United Kingdom (+44)")).toBe("+44 7700 900123");
  });
  it("keeps numbers already in international form", () => {
    expect(withDialCode("+966 50 000 0000", "United Arab Emirates (+971)")).toBe("+966 50 000 0000");
    expect(withDialCode("00971501234567", "United Arab Emirates (+971)")).toBe("+971501234567");
    expect(withDialCode("971501234567", "United Arab Emirates (+971)")).toBe("+971501234567");
  });
  it("leaves the number alone when no dial code is known", () => {
    expect(withDialCode("12345678", "Other")).toBe("12345678");
    expect(withDialCode("  ", "Qatar (+974)")).toBe("");
  });
});

describe("country code lists", () => {
  it("the pop-up script offers the same countries, in the same order", () => {
    const script = readFileSync(join(process.cwd(), "public/legacy/assets/js/site-cms.js"), "utf8");
    const match = /const phoneCountries = (\[[^\]]*\]);/.exec(script);
    expect(match).not.toBeNull();
    expect(JSON.parse(match![1])).toEqual([...PHONE_COUNTRIES]);
  });
  it("shows only the code for the selected country", () => {
    expect(dialCodeLabel("United Arab Emirates (+971)")).toBe("+971");
    expect(dialCodeLabel("Other")).toBe("+");
  });
  it("needs at least 7 digits", () => {
    expect(looksLikePhone("050 123")).toBe(false);
    expect(looksLikePhone("050 123 4567")).toBe(true);
  });
});
