import { LegacyHomeScripts } from "@/components/public/legacy-home-scripts";
import { HomeMain } from "@/components/public/home-page";
import { getHomePageShell } from "@/lib/legacy-home";
import type { HomeSettings } from "@/lib/home-defaults";
import { db } from "@/lib/db";

export const revalidate = 300;

/// Pixel-identical shell (header, menu, booking dialog, footer) served from the
/// delivered file; every CMS-managed section renders as React components. The
/// delivered design is the fallback for every field.
export default async function HomePage() {
  let home: HomeSettings = {};
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) home = setting.value as HomeSettings;
  } catch {
    // The delivered page must remain visible even if the CMS database is unavailable.
  }

  const shell = getHomePageShell();
  return <>
    <div dangerouslySetInnerHTML={{ __html: shell.beforeMain }} />
    <HomeMain settings={home} staticTail={shell.staticTail} />
    <div dangerouslySetInnerHTML={{ __html: shell.afterMain }} />
    <LegacyHomeScripts />
  </>;
}

