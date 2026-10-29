import { aboutDefaults } from "@/lib/about-defaults";
import { db } from "@/lib/db";

const FLAG = "about_team_restored_20261029";

/// Puts the recovered executive roster back on the saved About page once.
/// The database was not reachable from the editing machine, so this runs on
/// the next live request and then stops, leaving later CMS edits alone.
export async function restoreAboutTeamOnce() {
  try {
    const flag = await db.siteSetting.findUnique({ where: { key: FLAG } });
    if (flag) return;
    const page = await db.staticPage.findUnique({ where: { slug: "about" } });
    if (!page || !Array.isArray(page.content)) return;
    let found = false;
    const content = page.content.map((block) => {
      if (!block || typeof block !== "object" || Array.isArray(block)) return block;
      const record = block as Record<string, unknown>;
      if (record.type !== "about") return block;
      found = true;
      return { ...record, management: aboutDefaults.management };
    });
    if (!found) content.push({ type: "about", management: aboutDefaults.management });
    await db.staticPage.update({ where: { id: page.id }, data: { content: content as never } });
    await db.siteSetting.upsert({
      where: { key: FLAG },
      create: { key: FLAG, value: { restored: aboutDefaults.management?.length ?? 0 } },
      update: { value: { restored: aboutDefaults.management?.length ?? 0 } },
    });
  } catch {
    // Leave the flag unset so the next request can try again.
  }
}
