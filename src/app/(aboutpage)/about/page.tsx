import { type AboutContent } from "@/lib/about-defaults";
import { AboutMain } from "@/components/public/about-page";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";
import { db } from "@/lib/db";

type Block = { type?: string; heading?: string; text?: string; image?: string; [key: string]: unknown };

export const metadata = { title: "About", description: "Learn about Kasumigaseki Properties Development and its Dubai platform." };
export const revalidate = 300;

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function AboutPage() {
  let content: AboutContent = {};
  try {
    const page = await db.staticPage.findUnique({ where: { slug: "about" } });
    const blocks = Array.isArray(page?.content) ? page.content as Block[] : [];
    const hero = blocks.find((block) => block.type === "hero");
    const about = blocks.find((block) => block.type === "about") as (Block & AboutContent) | undefined;
    content = {
      heading: hero?.heading,
      heroText: hero?.text,
      heroImage: hero?.image,
      story: blocks.filter((block) => block.type === "paragraph").map((block) => block.text).filter((text): text is string => Boolean(text)),
      ...(about ?? {}),
    };
  } catch {
    // The delivered client page stays available if the CMS database is unavailable.
  }
  return <>
    <SiteShellHeader />
    <AboutMain content={content} />
    <SiteShellFooter />
    <DeliveredScripts />
  </>;
}


