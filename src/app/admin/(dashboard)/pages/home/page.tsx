import Link from "next/link";
import { db } from "@/lib/db";
import HomeForm, { type HomeSettings } from "./home-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [flash] = await Promise.all([searchParams]);
  let home: HomeSettings = {};
  let projectLinks: { href: string; name: string }[] = [];
  try {
    const projects = await db.project.findMany({ where: { status: "PUBLISHED", profile: "FULL" }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } });
    projectLinks = projects.map((project) => ({ href: `/developments/${project.slug}`, name: project.name }));
  } catch {}
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) home = setting.value as HomeSettings;
  } catch {}
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
    <div className="cms-card"><HomeForm settings={home} projectLinks={projectLinks} /></div>
    <VersionHistory entityType="HOME_SETTINGS" entityId="home" entityLabel="the homepage" />
  </>;
}
