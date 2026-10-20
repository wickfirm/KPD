/// One-time CMS recovery for the Investor Guide. It persists the complete
/// canonical guide into the static-page record; the public page remains
/// CMS-only and does not read this object at runtime.
import { db } from "../src/lib/db";
import { investDefaults } from "../src/lib/invest-defaults";

async function main() {
  const current = await db.staticPage.findUnique({ where: { slug: "invest-in-dubai" } });
  const blocks = Array.isArray(current?.content) ? current.content as Record<string, unknown>[] : [];
  const content = [
    ...blocks.filter((block) => block.type !== "invest"),
    { type: "invest", ...investDefaults },
  ];

  await db.staticPage.upsert({
    where: { slug: "invest-in-dubai" },
    update: { content, status: "PUBLISHED", title: current?.title || "Invest in Dubai" },
    create: { slug: "invest-in-dubai", title: "Invest in Dubai", status: "PUBLISHED", content },
  });
  console.log("Investor Guide restored to CMS.");
}

main().finally(() => db.$disconnect());
