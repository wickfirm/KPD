import { db } from "@/lib/db";

export type StaticBlock = { type?: string; heading?: string; text?: string; image?: string; [key: string]: unknown };

/// The saved content blocks of a managed page (staticPage by slug). Never
/// throws: with nothing saved, the managed page remains intentionally empty.
export async function loadStaticBlocks(slug: string): Promise<StaticBlock[]> {
  try {
    const page = await db.staticPage.findUnique({ where: { slug } });
    return Array.isArray(page?.content) ? page.content as StaticBlock[] : [];
  } catch {
    return [];
  }
}

export type ContactDetails = { email?: string; phone?: string; website?: string };

/// The contact details shown on the Contact page (siteSetting "global").
/// There are no delivered-value fallbacks: the CMS record is authoritative.
export async function loadContactDetails(): Promise<ContactDetails> {
  const setting = await db.siteSetting.findUnique({ where: { key: "global" } }).catch(() => null);
  if (!setting?.value || typeof setting.value !== "object" || Array.isArray(setting.value)) return {};
  return Object.fromEntries(Object.entries(setting.value as { email?: string; phone?: string; website?: string }).filter(([, value]) => typeof value === "string")) as ContactDetails;
}
