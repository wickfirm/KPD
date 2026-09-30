import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import SettingsForm, { type Settings } from "./settings-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";

export const dynamic = "force-dynamic";

/// Site-wide contact details — administrator-only because they affect every
/// page of the public site at once.
export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(["ADMIN"]);
  const [rows, flash] = await Promise.all([
    db.siteSetting.findMany({ where: { key: { in: ["global", "home"] } } }),
    searchParams,
  ]);
  const settings: Settings = {};
  for (const row of rows) {
    if (row.key === "global") settings.global = row.value as Settings["global"];
    if (row.key === "home") settings.home = row.value as Settings["home"];
  }
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">Administration</span>
        <h1>Site settings</h1>
        <p>The contact details shown across the site and footer. Homepage content lives under <strong>Content → Homepage</strong>.</p>
      </div>
    </div>
    <SavedBanner params={flash} />
    <div className="cms-card"><SettingsForm settings={settings} /></div>
    <VersionHistory entityType="GLOBAL_SETTINGS" entityId="global" entityLabel="site settings" />
  </>;
}
