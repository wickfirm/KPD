import { db } from "@/lib/db";
import { getLegacyPageShell } from "@/lib/legacy-legacy";
import type { LegacyContent, LegacyMilestone } from "@/lib/legacy-defaults";
import { LegacyMain } from "@/components/public/legacy-page";
import { LegacyPageScripts } from "@/components/public/legacy-page-scripts";

type Block = { type?: string; heading?: string; text?: string; image?: string; timeline?: LegacyMilestone[] };

export const metadata = { title: "Legacy", description: "The long-horizon KPD platform, from Tokyo to Dubai." };
export const dynamic = "force-dynamic";

/// Pixel-identical shell (header, menu, booking dialog, footer) served from the
/// delivered file; the hero and timeline render as React components from CMS
/// content. The delivered design is the fallback for every field.
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
  const shell = getLegacyPageShell();
  return <>
    <div dangerouslySetInnerHTML={{ __html: shell.beforeMain }} />
    <LegacyMain content={content} />
    <div dangerouslySetInnerHTML={{ __html: shell.afterMain }} />
    <LegacyPageScripts />
  </>;
}
