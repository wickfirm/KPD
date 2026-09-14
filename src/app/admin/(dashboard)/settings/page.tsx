import { db } from "@/lib/db";
import SettingsForm, { type Settings } from "./settings-form";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const rows = await db.siteSetting.findMany({ where: { key: { in: ["global", "home"] } } });
  const settings: Settings = {};
  for (const row of rows) {
    if (row.key === "global") settings.global = row.value as Settings["global"];
    if (row.key === "home") settings.home = row.value as Settings["home"];
  }
  return <div className="cms-card"><SettingsForm settings={settings} /></div>;
}
