import { cache } from "react";
import { db } from "@/lib/db";
import { cleanTextStyle, type TextStyle } from "@/lib/text-style";

export type FormRecipientKey = "enquiry" | "booking" | "floorPlan" | "calculator" | "newsletter" | "contactSales" | "contactCustomer" | "contactChannel" | "contactCareers" | "contactPress";
export type FormRecipients = Partial<Record<FormRecipientKey, string>>;
export type SiteTextStyle = TextStyle;
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
  headerCtaLabel?: string;
  headerCtaVisible?: boolean;
  popupEnabled?: boolean;
  typography?: SiteTypography;
  recipients?: FormRecipients;
  popupTitle?: string;
  popupIntro?: string;
  popupSubmitLabel?: string;
  popupNote?: string;
  /// "every-page" opens on each page view. "session" once a visit. "day" once a day.
  popupFrequency?: "every-page" | "session" | "day";
  popupDelaySeconds?: number;
};

/// Kept as an empty public constant for compatibility with existing callers.
/// Runtime settings never populate missing values from this object.
export const globalDefaults: GlobalSettings = {};

const STRING_KEYS = ["email", "phone", "whatsapp", "newsletterNote", "newsletterHeading", "newsletterSubmitLabel", "facebook", "x", "instagram", "youtube", "linkedin", "enquiryLabel", "callLabel", "whatsappLabel", "headerCtaLabel", "popupTitle", "popupIntro", "popupSubmitLabel", "popupNote"] as const;
const POPUP_FREQUENCIES = ["every-page", "session", "day"] as const;
const BOOLEAN_KEYS = ["enquiryEnabled", "callEnabled", "whatsappEnabled", "popupEnabled", "headerCtaVisible"] as const;
const RECIPIENT_KEYS = ["enquiry", "booking", "floorPlan", "calculator", "newsletter", "contactSales", "contactCustomer", "contactChannel", "contactCareers", "contactPress"] as const;
const TYPE_KEYS = ["headings", "body", "ctas"] as const;

/// Parses the editable global settings without filling any missing values.
/// Switches are booleans. They must not be treated as text: calling trim on
/// one throws, and the public page then discards the entire settings record.
export function mergeGlobalSettings(saved: unknown): GlobalSettings {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const source = saved as Record<string, unknown>;
  const result: GlobalSettings = {};
  for (const key of STRING_KEYS) {
    if (typeof source[key] === "string") result[key] = source[key].trim();
  }
  for (const key of BOOLEAN_KEYS) {
    if (typeof source[key] === "boolean") result[key] = source[key];
  }
  if (typeof source.popupFrequency === "string" && (POPUP_FREQUENCIES as readonly string[]).includes(source.popupFrequency)) {
    result.popupFrequency = source.popupFrequency as GlobalSettings["popupFrequency"];
  }
  const delay = typeof source.popupDelaySeconds === "number" ? source.popupDelaySeconds : Number(source.popupDelaySeconds);
  if (Number.isFinite(delay)) result.popupDelaySeconds = Math.max(0, Math.min(120, Math.round(delay)));
  if (source.recipients && typeof source.recipients === "object" && !Array.isArray(source.recipients)) {
    const recipients: FormRecipients = {};
    for (const key of RECIPIENT_KEYS) {
      const value = (source.recipients as Record<string, unknown>)[key];
      if (typeof value === "string") recipients[key] = value.trim();
    }
    result.recipients = recipients;
  }
  if (source.typography && typeof source.typography === "object" && !Array.isArray(source.typography)) {
    const typography: SiteTypography = {};
    for (const key of TYPE_KEYS) {
      const style = cleanTextStyle((source.typography as Record<string, unknown>)[key]);
      if (style) typography[key] = style;
    }
    result.typography = typography;
  }
  return result;
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
