import { describe, expect, it } from "vitest";
import { contactError, languageDetail, submissionLanguage } from "@/lib/submission-language";
import { buildNotificationEmail } from "@/lib/form-notify";
import { leadDescription } from "@/lib/submissions";

describe("the language a form was filled in", () => {
  it.each([
    [{ visitorLanguage: "ar", sourcePage: "/contact" }, "ar"],
    [{ visitorLanguage: "ja" }, "ja"],
    [{ sourcePage: "/ar/about" }, "ar"],
    [{ sourcePage: "/ja" }, "ja"],
    // The delivered forms send their address; an English one reads as English.
    [{ sourcePage: "/contact" }, "en"],
    [{ sourcePage: "/archive" }, "en"],
    [{ sourcePage: "/art" }, "en"],
    [{ sourcePage: "ar/about" }, "en"],
    [{ sourcePage: "https://example.com/ar" }, "en"],
    [{ visitorLanguage: "fr", sourcePage: "/contact" }, "en"],
    [{ visitorLanguage: ["ar"], sourcePage: "/contact" }, "en"],
    [{}, "en"],
  ])("%j → %s", (payload, expected) => {
    expect(submissionLanguage(payload)).toBe(expected);
  });

  it("is one entry in the details for Arabic and Japanese, and nothing for English", () => {
    expect(languageDetail("en")).toBeNull();
    expect(languageDetail("ar")).toEqual({ label: "Visitor language", value: "Arabic" });
    expect(languageDetail("ja")).toEqual({ label: "Visitor language", value: "Japanese" });
  });

  it("reaches the team's email and the Salesforce description, which carry the details", () => {
    const details = [{ label: "Project of interest", value: "seven x seven" }, languageDetail("ar")!];
    const mail = buildNotificationEmail({ inquiryType: "Booking request", name: "A", email: "a@example.com", phone: null, message: "Hello", interest: null, sourcePage: "/ar/about", details, submissionId: "s1" });
    expect(mail.text).toContain("Visitor language: Arabic");
    expect(mail.html).toContain("Visitor language");
    expect(leadDescription("Hello", details)).toContain("Visitor language: Arabic");
    // The team's copy stays in English.
    expect(buildNotificationEmail({ inquiryType: "Booking request", name: "A", email: "a@example.com", phone: null, message: "مرحبا", interest: null, sourcePage: "/ar/about", details: [], submissionId: "s1" }).subject).toBe("New Booking request from A");
  });

  it("keeps every English refusal word for word", () => {
    expect(contactError("en", "required")).toBe("name, email and message are required.");
    expect(contactError("en", "email")).toBe("Invalid email address.");
    expect(contactError("en", "save")).toBe("We could not save your enquiry right now. Please try again shortly.");
  });

  it("answers in the form's language, with the sheet's wording for the same situation", () => {
    expect(contactError("ar", "required")).toBe("هذا الحقل مطلوب.");
    expect(contactError("ar", "email")).toBe("يُرجى إدخال بريد إلكتروني صحيح.");
    expect(contactError("ja", "save")).toBe("お問い合わせを送信できませんでした。もう一度お試しください。");
    for (const problem of ["required", "email", "save"] as const) {
      expect(contactError("ar", problem)).not.toBe(contactError("en", problem));
    }
  });
});
