import { describe, expect, it } from "vitest";
import { legalContact, legalDocuments, legalTabForSlug, termsPageTitle } from "./terms-defaults";

describe("legal document copy", () => {
  it("keeps terms, privacy and cookies as three panels of one page", () => {
    expect(legalDocuments.map((document) => document.title)).toEqual([
      "Terms and Conditions",
      "Privacy Policy",
      "Cookie Policy",
    ]);
    expect(termsPageTitle).toBe("Terms and Conditions");
    const terms = legalDocuments[0].sections.map((section) => section.heading);
    const privacy = legalDocuments[1].sections.map((section) => section.heading);
    const cookies = legalDocuments[2].sections.map((section) => section.heading);
    expect(terms).toContain("Governing law");
    expect(terms).not.toContain("Who this covers");
    expect(privacy).toContain("Who this covers");
    expect(privacy).toContain("Sharing");
    expect(cookies).toEqual(["Overview", "What cookies are", "How we use cookies", "Cookies we set", "Third-party cookies", "Managing cookies"]);
    const privacyText = JSON.stringify(legalDocuments[1]);
    expect(privacyText).toContain("We do not sell personal information.");
    expect(privacyText).toContain("Enquiry preferences");
    const cookieText = JSON.stringify(legalDocuments[2]);
    expect(cookieText).toContain("Can you turn it off?");
    expect(cookieText).toContain("No, the website needs them");
    expect(legalContact.email).toBe("info@kpd.ae");
    expect(legalTabForSlug("privacy-policy")).toBe("privacy");
    expect(legalTabForSlug("cookie-policy")).toBe("cookies");
    expect(legalTabForSlug("terms")).toBe("terms");
  });
});
