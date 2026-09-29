import Link from "next/link";
import { db } from "@/lib/db";
import HomeForm, { type HomeSettings } from "./home-form";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  let home: HomeSettings = {};
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) home = setting.value as HomeSettings;
  } catch {}
  return <>
    <div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}>
      <div><span className="cms-eyebrow">/</span><h1 style={{ margin: "7px 0 0" }}>Homepage</h1></div>
      <Link className="cms-btn cms-btn--ghost" href="/" target="_blank">View page</Link>
    </div>
    <div className="cms-card"><HomeForm settings={home} /></div>
  </>;
}
