import "@/app/(sxs-page)/sxs.css";
import type { Metadata } from "next";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { SevenXSevenFresh } from "@/components/public/sxs/SevenXSevenFresh";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadSxsContent, mergeSxsContent, sxsPreviewKey } from "@/lib/sxs-content";
import { getLocale, getSwitcherLocales } from "@/lib/locale";
import { editorLocale, languageNames } from "@/lib/locales";
import { translationDraftKey } from "@/lib/translations/form-translation";
import { localizedSetting } from "@/lib/translations/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "seven x seven preview", robots: { index: false, follow: false } };

/// Admin-only preview of the seven x seven landing: the unsaved version from
/// the editor when there is a fresh one, otherwise the saved page. With
/// ?lang=ar or ?lang=ja it shows the page's translation.
export default async function SevenXSevenPreview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const query = await searchParams;
  const lang = editorLocale(query.lang);
  const row = await db.siteSetting.findUnique({ where: { key: translationDraftKey(sxsPreviewKey, lang) } }).catch(() => null);
  const draft = row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? row.value as { content?: unknown; savedAt?: number } : null;
  const fresh = typeof draft?.savedAt === "number" && Date.now() - draft.savedAt < 2 * 60 * 60 * 1000;
  const [content, locale, switcherLocales] = await Promise.all([fresh ? mergeSxsContent(draft?.content) : localizedSetting("sxs", await loadSxsContent(), lang), getLocale(), getSwitcherLocales()]);
  const language = lang === "en" ? "" : `${languageNames[lang]}${fresh ? " translation, unsaved" : " translation"} · `;
  return <>
    <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{language}Admin preview of seven x seven. Visitors cannot see this address.</div>
    <DeliveredBodyClass bodyClass="sxs-residence" />
    <SevenXSevenFresh content={content} preview locale={locale} switcherLocales={switcherLocales} />
  </>;
}
