import { describe, expect, it } from "vitest";
import { formatDetails, leadDescription, sanitizeDetails } from "./submissions";

describe("submission details", () => {
  it("keeps order, trims, and drops empty or malformed entries", () => {
    expect(sanitizeDetails([{ label: " Budget range ", value: " AED 5-10M " }, { label: "Agency", value: "" }, null, "x", { label: "", value: "y" }, { value: "no label" }]))
      .toEqual([{ label: "Budget range", value: "AED 5-10M" }]);
  });
  it("rejects non-lists and caps size", () => {
    expect(sanitizeDetails("nope")).toEqual([]);
    expect(sanitizeDetails({})).toEqual([]);
    const many = Array.from({ length: 60 }, (_, i) => ({ label: `L${i}`, value: "v" }));
    expect(sanitizeDetails(many)).toHaveLength(40);
    expect(sanitizeDetails([{ label: "L", value: "x".repeat(5000) }])[0].value).toHaveLength(2000);
  });
  it("formats details and builds the Salesforce description", () => {
    const details = [{ label: "Market", value: "UAE" }, { label: "Website", value: "https://x.test" }];
    expect(formatDetails(details)).toBe("Market: UAE\nWebsite: https://x.test");
    expect(leadDescription("Hello", details)).toBe("Hello\n\nMarket: UAE\nWebsite: https://x.test");
    expect(leadDescription("Hello", [])).toBe("Hello");
    expect(leadDescription("", details)).toBe("Market: UAE\nWebsite: https://x.test");
  });
});
