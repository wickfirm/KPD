import { cache } from "react";
import { db } from "@/lib/db";
import { parseHiddenSections, sectionVisibilityKey, type HiddenSections } from "@/lib/section-visibility";

/// Every page's hidden sections, read once per request. Never throws: if the
/// database is unavailable every section stays visible.
export const loadAllHiddenSections = cache(async (): Promise<HiddenSections> => {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: sectionVisibilityKey } });
    return parseHiddenSections(setting?.value);
  } catch {
    return {};
  }
});

export async function loadHiddenSections(page: string): Promise<string[]> {
  return (await loadAllHiddenSections())[page] ?? [];
}
