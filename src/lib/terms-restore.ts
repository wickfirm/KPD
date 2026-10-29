import { db } from "@/lib/db";
import { termsPageContent, termsPageTitle } from "@/lib/terms-defaults";

const FLAG = "terms_copy_20261029";

type SavedBlock = { type?: string; image?: string; headingStyle?: unknown };

/// Replaces the saved Terms page with the client's terms document once.
/// The database is not updated from the editing machine. The next live request
/// writes the copy, then stops, so a later edit in the CMS is left alone.
export async function applyTermsCopyOnce() {
  try {
    const flag = await db.siteSetting.findUnique({ where: { key: FLAG } });
    if (flag) return;
    const page = await db.staticPage.findUnique({ where: { slug: "terms" } });
    const previous = Array.isArray(page?.content) ? page.content as SavedBlock[] : [];
    const hero = previous.find((block) => block?.type === "hero");
    const content = termsPageContent.map((block) => {
      if (block.type !== "hero" || !hero?.image) return block;
      return { ...block, image: hero.image, ...(hero.headingStyle ? { headingStyle: hero.headingStyle } : {}) };
    });
    if (page) {
      await db.staticPage.update({
        where: { id: page.id },
        data: { title: termsPageTitle, status: "PUBLISHED", content: content as never },
      });
    } else {
      await db.staticPage.create({
        data: { slug: "terms", title: termsPageTitle, status: "PUBLISHED", content: content as never },
      });
    }
    await db.siteSetting.upsert({
      where: { key: FLAG },
      create: { key: FLAG, value: { sections: termsPageContent.filter((block) => block.type === "heading").length } },
      update: { value: { sections: termsPageContent.filter((block) => block.type === "heading").length } },
    });
  } catch {
    // Leave the flag unset so the next request can try again.
  }
}
