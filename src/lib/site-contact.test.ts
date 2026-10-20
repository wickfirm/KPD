import { describe, expect, it } from "vitest";
import { mergeGlobalSettings, telHref, whatsappHref } from "./site-contact";

describe("site contact settings", () => {
  it("preserves empty CMS values instead of replacing them", () => {
    expect(mergeGlobalSettings({ email: "", phone: "  ", whatsapp: "", newsletterNote: "" })).toEqual({ email: "", phone: "", whatsapp: "", newsletterNote: "" });
  });
  it("lets non-empty saved values win and ignores unknown keys", () => {
    const merged = mergeGlobalSettings({ email: " hello@kpd.ae ", instagram: "https://instagram.com/kpd", other: "x" });
    expect(merged.email).toBe("hello@kpd.ae");
    expect(merged.instagram).toBe("https://instagram.com/kpd");
    expect(merged.phone).toBeUndefined();
  });
  it("tolerates a missing or malformed record", () => {
    expect(mergeGlobalSettings(null)).toEqual({});
    expect(mergeGlobalSettings([1, 2])).toEqual({});
  });
  it("builds tel and whatsapp links from formatted input", () => {
    expect(telHref("+971 4 388 3099")).toBe("tel:+97143883099");
    expect(whatsappHref("+971 4 388 3099")).toBe("https://wa.me/97143883099");
    expect(whatsappHref("https://wa.me/971500000000")).toBe("https://wa.me/971500000000");
  });
});
