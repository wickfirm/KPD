import { cache } from "react";
import { db } from "@/lib/db";

/// Site-wide contact details and footer settings (Admin → Site settings). Every
/// field is optional in the database; an empty value falls back to the
/// delivered default so a half-filled settings form can never blank a link.
export type GlobalSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  newsletterNote: string;
  facebook: string;
  x: string;
  instagram: string;
  youtube: string;
};

export const globalDefaults: GlobalSettings = {
  email: "info@kpd.ae",
  phone: "+971 4 388 3099",
  whatsapp: "https://wa.me/97143883099",
  newsletterNote: "By signing up, I agree to receive KPD updates and accept the",
  facebook: "https://www.facebook.com/",
  x: "https://x.com/",
  instagram: "https://www.instagram.com/",
  youtube: "https://www.youtube.com/",
};

/// Non-empty saved values over the delivered defaults.
export function mergeGlobalSettings(saved: unknown): GlobalSettings {
  const merged = { ...globalDefaults };
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    for (const key of Object.keys(globalDefaults) as (keyof GlobalSettings)[]) {
      const value = (saved as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) merged[key] = value.trim();
    }
  }
  return merged;
}

export const getGlobalSettings = cache(async (): Promise<GlobalSettings> => {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "global" } });
    return mergeGlobalSettings(setting?.value);
  } catch {
    return globalDefaults;
  }
});

/// "+971 4 388 3099" -> "tel:+97143883099"
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

/// Accepts a full wa.me / api.whatsapp.com URL or a bare number.
export function whatsappHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}
