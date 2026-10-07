// One-shot data fix: the About hero/story heading was saved through the CMS
// without its delivered line break ("Soulful Places<br>Enriched Lives").
// Restores the newline in the stored hero block if it is missing. Run against
// the DIRECT connection:
//
//   DATABASE_URL="<direct url>" npx tsx scripts/fix-about-heading.ts
//
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const page = await db.staticPage.findUnique({ where: { slug: "about" } });
  if (!page) {
    console.error("✖ about page not found.");
    return;
  }
  const blocks = Array.isArray(page.content) ? (page.content as { type?: string; heading?: string; text?: string }[]) : [];
  let fixed = false;
  const next = blocks.map((block) => {
    if (block.type === "hero" && typeof block.heading === "string" && !block.heading.includes("\n")) {
      const restored = block.heading
        .replace(/Soulful Places\s+Enriched Lives/i, "Soulful Places\nEnriched Lives")
        .replace(/Long-horizon\s+value in Dubai/i, "Long-horizon\nvalue in Dubai");
      if (restored !== block.heading) {
        fixed = true;
        return { ...block, heading: restored };
      }
    }
    return block;
  });
  if (!fixed) {
    console.log("Nothing to fix — the about heading already carries its line break.");
    return;
  }
  await db.staticPage.update({ where: { slug: "about" }, data: { content: next as never } });
  console.log("✔ about heading line break restored. Public page re-renders within 5 minutes (ISR).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
