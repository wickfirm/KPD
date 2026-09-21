import { db } from "@/lib/db";
import { getLegacyPage, type LegacyContent, type LegacyMilestone } from "@/lib/legacy-legacy";

type Block = { type?: string; heading?: string; text?: string; image?: string; timeline?: LegacyMilestone[] };

export const metadata = { title: "Legacy", description: "The long-horizon KPD platform, from Tokyo to Dubai." };
export const dynamic = "force-dynamic";

export default async function LegacyPage() {
  let content: LegacyContent = {};
  try {
    const page = await db.staticPage.findUnique({ where: { slug: "legacy" } });
    const blocks = Array.isArray(page?.content) ? page.content as Block[] : [];
    const hero = blocks.find((block) => block.type === "hero");
    const timeline = blocks.find((block) => block.type === "legacy");
    content = { heading: hero?.heading, text: hero?.text, image: hero?.image, timeline: timeline?.timeline };
  } catch {
    // The delivered page stays available if the CMS cannot be read.
  }
  return <div dangerouslySetInnerHTML={{ __html: getLegacyPage(content) }} />;
}
