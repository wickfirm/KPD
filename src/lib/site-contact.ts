import { cache } from "react";
import { db } from "@/lib/db";

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
    .filter(([key, value]) => (key in ({ email: true, phone: true, whatsapp: true, newsletterNote: true, newsletterHeading: true, newsletterSubmitLabel: true, facebook: true, x: true, instagram: true, youtube: true, linkedin: true, popupTitle: true, popupIntro: true, popupSubmitLabel: true, popupNote: true }) && typeof value === "string") || (key in ({ enquiryEnabled: true, callEnabled: true, whatsappEnabled: true }) && typeof value === "boolean"))
    .map(([key, value]) => [key, (value as string).trim()])) as GlobalSettings;
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
