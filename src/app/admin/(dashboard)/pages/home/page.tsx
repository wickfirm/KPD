import Link from "next/link";
import HomeForm, { type HomeSettings } from "./home-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import { editorSeoDefaults } from "@/lib/seo-store";
import { seoKey } from "@/lib/seo-overrides";
import { pageSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [flash] = await Promise.all([searchParams]);
  let home: HomeSettings = {};
  try {
    const { db } = await import("@/lib/db");
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) home = setting.value as HomeSettings;
  } catch {}
  const seo = await editorSeoDefaults(seoKey("page", "home"), pageSeo.home);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">/ — the first thing visitors see</span>
        <h1>Homepage</h1>
        <p>Swap the hero video, rewrite the introduction, or refresh the gallery. Saving makes it live immediately.</p>
      </div>
      <Link className="cms-btn cms-btn--ghost" href="/" target="_blank">View page</Link>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <div className="cms-card"><HomeForm settings={home} seo={seo} /></div>
      <VersionHistory entityType="HOME_SETTINGS" entityId="home" entityLabel="the homepage" />
    </EditorShell>
  </>;
}
