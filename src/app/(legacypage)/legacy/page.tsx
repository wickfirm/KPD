import { db } from "@/lib/db";
import type { LegacyContent, LegacyMilestone } from "@/lib/legacy-defaults";
import { LegacyMain } from "@/components/public/legacy-page";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";

type Block = { type?: string; heading?: string; text?: string; image?: string; timeline?: LegacyMilestone[] };

export const metadata = { title: "Legacy", description: "The long-horizon KPD platform, from Tokyo to Dubai." };
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
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
  return <>
    <DeliveredBodyClass bodyClass="home-development-page legacy-design-page" />
    <SiteShellHeader />
    <LegacyMain content={content} />
    <SiteShellFooter />
    <DeliveredScripts bodyClass="home-development-page legacy-design-page" />
  </>;
}

