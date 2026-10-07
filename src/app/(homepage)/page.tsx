import { HomeMain } from "@/components/public/home-page";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";
import { getHomeStaticTail } from "@/lib/legacy-home";
import type { HomeSettings } from "@/lib/home-defaults";
import { db } from "@/lib/db";

export const revalidate = 300;

/// Unified delivered shell + React content. CMS-managed sections render as
/// React; the delivered design is the fallback for every field.
export default async function HomePage() {
  let home: HomeSettings = {};
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) home = setting.value as HomeSettings;
  } catch {
    // The delivered page must remain visible even if the CMS database is unavailable.
  }

  return <>
    <SiteShellHeader />
    <HomeMain settings={home} staticTail={getHomeStaticTail()} />
    <SiteShellFooter />
    <DeliveredScripts bodyClass="home-development-page" sources={["/legacy/assets/js/live-news.js?v=20261007-internal-links"]} />
  </>;
}


