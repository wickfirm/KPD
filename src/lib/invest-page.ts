import { db } from "@/lib/db";
import type { InvestHero } from "@/components/public/invest-view";

/// The saved investor-guide content (staticPage "invest-in-dubai": a "hero" block
/// plus an "invest" block). Never throws: with nothing saved, or no database,
/// the page renders the delivered defaults.
export async function loadInvestPage(): Promise<{ hero?: InvestHero; saved?: unknown }> {
  try {
    const page = await db.staticPage.findUnique({ where: { slug: "invest-in-dubai" } });
    if (Array.isArray(page?.content)) {
      const blocks = page.content as (InvestHero & Record<string, unknown>)[];
      return { hero: blocks.find((block) => block.type === "hero"), saved: blocks.find((block) => block.type === "invest") };
    }
  } catch {}
  return {};
}
