import { cache } from "react";
import { db } from "@/lib/db";

export type FormRecipientKey = "enquiry" | "booking" | "floorPlan" | "calculator" | "newsletter" | "contactSales" | "contactCustomer" | "contactChannel" | "contactCareers" | "contactPress";
export type FormRecipients = Partial<Record<FormRecipientKey, string>>;
export type SiteTextStyle = { fontSize?: string; fontWeight?: "normal" | "bold"; fontStyle?: "normal" | "italic" };
export type SiteTypography = { headings?: SiteTextStyle; body?: SiteTextStyle; ctas?: SiteTextStyle };

/// Site-wide contact details and footer settings (Admin → Site settings).
/// The CMS is the only content source; omitted values intentionally stay blank.
export type GlobalSettings = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  newsletterNote?: string;
  newsletterHeading?: string;
  newsletterSubmitLabel?: string;
  facebook?: string;
  x?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  enquiryEnabled?: boolean;
  callEnabled?: boolean;
  whatsappEnabled?: boolean;
  enquiryLabel?: string;
  callLabel?: string;
  whatsappLabel?: string;
  popupEnabled?: boolean;
  typography?: SiteTypography;
  recipients?: FormRecipients;
  popupTitle?: string;
  popupIntro?: string;
  popupSubmitLabel?: string;
  popupNote?: string;
};

/// Kept as an empty public constant for compatibility with existing callers.
/// Runtime settings never populate missing values from this object.
export const globalDefaults: GlobalSettings = {};

/// Parses the editable global settings without filling any missing values.
export function mergeGlobalSettings(saved: unknown): GlobalSettings {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  return Object.fromEntries(Object.entries(saved as Record<string, unknown>)
    .filter(([key, value]) => (key in ({ email: true, phone: true, whatsapp: true, newsletterNote: true, newsletterHeading: true, newsletterSubmitLabel: true, facebook: true, x: true, instagram: true, youtube: true, linkedin: true, enquiryLabel: true, callLabel: true, whatsappLabel: true, popupTitle: true, popupIntro: true, popupSubmitLabel: true, popupNote: true }) && typeof value === "string") || (key in ({ enquiryEnabled: true, callEnabled: true, whatsappEnabled: true, popupEnabled: true }) && typeof value === "boolean") || ((key === "recipients" || key === "typography") && typeof value === "object" && value !== null && !Array.isArray(value)))
    .map(([key, value]) => key === "recipients"
      ? [key, Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([recipientKey, recipient]) => recipientKey in ({ enquiry: true, booking: true, floorPlan: true, calculator: true, newsletter: true, contactSales: true, contactCustomer: true, contactChannel: true, contactCareers: true, contactPress: true }) && typeof recipient === "string").map(([recipientKey, recipient]) => [recipientKey, (recipient as string).trim()]))]
      : key === "typography"
        ? [key, Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([styleKey, style]) => styleKey in ({ headings: true, body: true, ctas: true }) && style && typeof style === "object" && !Array.isArray(style)).map(([styleKey, style]) => [styleKey, Object.fromEntries(Object.entries(style as Record<string, unknown>).filter(([styleProperty, styleValue]) => styleProperty in ({ fontSize: true, fontWeight: true, fontStyle: true }) && typeof styleValue === "string").map(([styleProperty, styleValue]) => [styleProperty, (styleValue as string).trim()]))]))]
      : [key, (value as string).trim()])) as GlobalSettings;
}

/// Returns the recipient configured for a form, falling back to the shared address.
export function recipientFor(settings: GlobalSettings, key: FormRecipientKey): string {
  return settings.recipients?.[key]?.trim() || settings.email?.trim() || "";
}

export const getGlobalSettings = cache(async (): Promise<GlobalSettings> => {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "global" } });
    return mergeGlobalSettings(setting?.value);
  } catch {
    return {};
  }
});

/// "+971 4 388 3099" -> "tel:+97143883099"
export function telHref(phone = "") {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

/// Accepts a full wa.me / api.whatsapp.com URL or a bare number.
export function whatsappHref(value = "") {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}
