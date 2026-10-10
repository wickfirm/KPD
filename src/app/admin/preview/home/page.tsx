import "../../../(public)/public.css";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { HomeView } from "@/components/public/home-view";
import { loadHomeSettings } from "@/lib/home-saved";
import { freshSiteDraftData, siteDraftKey } from "@/lib/site-preview";
import type { HomeSettings } from "@/lib/home-defaults";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of the homepage as it currently looks in the editor,
/// saved or not (?draft=1), otherwise the saved version. The homepage goes live
/// the moment it is saved, so this is the way to look before saving.
export default async function HomePreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { session } = await requireUser();
  const query = await searchParams;
  if (query.draft) {
    const row = await db.siteSetting.findUnique({ where: { key: siteDraftKey("home", session.email) } }).catch(() => null);
    const draft = freshSiteDraftData<HomeSettings>(row?.value);
    if (draft) return <HomeView home={draft} previewNote="UNSAVED draft of the homepage — not saved, not public · visitors cannot see this URL" />;
  }
  return <HomeView home={await loadHomeSettings()} previewNote="Admin preview · saved homepage (this is what visitors see) · visitors cannot see this URL" />;
}
