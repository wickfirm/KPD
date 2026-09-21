import { LegacyHomeScripts } from "@/components/public/legacy-home-scripts";
import { getLegacyHomepage } from "@/lib/legacy-home";
import { db } from "@/lib/db";

type HomeContent = {
  heroVideo?: string;
  introHeading?: string;
  introParagraphs?: string[];
  developmentHeading?: string;
  contactHeading?: string;
  contactText?: string;
  experienceImages?: string[];
};

export const dynamic = "force-dynamic";

/// The original homepage remains the visual source of truth. CMS fields
/// replace its corresponding content only when an editor has supplied a value.
export default async function HomePage() {
  let home: HomeContent = {};
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) home = setting.value as HomeContent;
  } catch {
    // The delivered page must remain visible even if the CMS database is unavailable.
  }

  return <><div dangerouslySetInnerHTML={{ __html: getLegacyHomepage(home) }} /><LegacyHomeScripts /></>;
}
