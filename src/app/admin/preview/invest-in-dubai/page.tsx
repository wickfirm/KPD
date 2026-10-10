import "../../../(public)/public.css";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvestView, type InvestHero } from "@/components/public/invest-view";
import { loadInvestPage } from "@/lib/invest-page";
import { freshSiteDraftData, siteDraftKey } from "@/lib/site-preview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

/// Admin-only preview of the investor guide as it currently looks in the
/// editor, saved or not (?draft=1), otherwise the saved version. The page goes
/// live the moment it is saved, so this is the way to look before saving.
export default async function InvestPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { session } = await requireUser();
  const query = await searchParams;
  if (query.draft) {
    const row = await db.siteSetting.findUnique({ where: { key: siteDraftKey("invest", session.email) } }).catch(() => null);
    const draft = freshSiteDraftData<{ hero?: InvestHero; saved?: unknown }>(row?.value);
    if (draft) return <InvestView hero={draft.hero} saved={draft.saved} previewNote="UNSAVED draft of the investor guide — not saved, not public · visitors cannot see this URL" />;
  }
  const { hero, saved } = await loadInvestPage();
  return <InvestView hero={hero} saved={saved} previewNote="Admin preview · saved investor guide (this is what visitors see) · visitors cannot see this URL" />;
}
