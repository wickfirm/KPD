import "@/app/(sxs-page)/sxs.css";
import type { Metadata } from "next";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { SevenXSevenFresh } from "@/components/public/sxs/SevenXSevenFresh";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadSxsContent, mergeSxsContent, sxsPreviewKey } from "@/lib/sxs-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "seven x seven preview", robots: { index: false, follow: false } };

export default async function SevenXSevenPreview() {
  await requireUser();
  const row = await db.siteSetting.findUnique({ where: { key: sxsPreviewKey } }).catch(() => null);
  const draft = row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? row.value as { content?: unknown; savedAt?: number } : null;
  const fresh = typeof draft?.savedAt === "number" && Date.now() - draft.savedAt < 2 * 60 * 60 * 1000;
  const content = fresh ? mergeSxsContent(draft?.content) : await loadSxsContent();
  return <>
    <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>Admin preview of seven x seven. Visitors cannot see this address.</div>
    <DeliveredBodyClass bodyClass="sxs-residence" />
    <SevenXSevenFresh content={content} preview />
  </>;
}
