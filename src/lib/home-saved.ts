import { db } from "@/lib/db";
import type { HomeSettings } from "@/lib/home-defaults";

/// The saved homepage settings. Never throws: the delivered page must remain
/// visible even if the CMS database is unavailable.
export async function loadHomeSettings(): Promise<HomeSettings> {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) return setting.value as HomeSettings;
  } catch {}
  return {};
}
