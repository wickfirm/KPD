import { describe, expect, it } from "vitest";
import { globalDefaults, mergeGlobalSettings, telHref, whatsappHref } from "./site-contact";

describe("site contact settings", () => {
  it("keeps the delivered defaults when saved values are empty", () => {
    expect(mergeGlobalSettings({ email: "", phone: "  ", whatsapp: "", newsletterNote: "" })).toEqual(globalDefaults);
  });
  it("lets non-empty saved values win and ignores unknown keys", () => {
    const merged = mergeGlobalSettings({ email: " hello@kpd.ae ", instagram: "https://instagram.com/kpd", other: "x" });
    expect(merged.email).toBe("hello@kpd.ae");
    expect(merged.instagram).toBe("https://instagram.com/kpd");
    expect(merged.phone).toBe(globalDefaults.phone);
  });
  it("tolerates a missing or malformed record", () => {
    expect(mergeGlobalSettings(null)).toEqual(globalDefaults);
    expect(mergeGlobalSettings([1, 2])).toEqual(globalDefaults);
  });
  it("builds tel and whatsapp links from formatted input", () => {
    expect(telHref("+971 4 388 3099")).toBe("tel:+97143883099");
    expect(whatsappHref("+971 4 388 3099")).toBe("https://wa.me/97143883099");
    expect(whatsappHref("https://wa.me/971500000000")).toBe("https://wa.me/971500000000");
  });
});
