import Link from "next/link";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import VersionHistory from "@/components/admin/version-history";
import { EnglishCopy, LanguageTabs } from "@/components/admin/language-tabs";
import { loadSxsContent } from "@/lib/sxs-content";
import { editorLocale, type Locale } from "@/lib/locales";
import { mergeLocale } from "@/lib/translations/merge-locale";
import { settingTranslation, settingTranslationLocales } from "@/lib/translations/store";
import SxsForm from "./sxs-form";

export const dynamic = "force-dynamic";

const ENGLISH_COPY = "en-sxs";

export default async function SevenXSevenEditor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [content, flash] = await Promise.all([loadSxsContent(), searchParams]);
  const lang = editorLocale(flash.lang);
  // The English tab is the editor as it always was. An Arabic or Japanese tab
  // is the same editor with the page's translation in it.
  const [translation, translated] = await Promise.all([
    settingTranslation("sxs", lang),
    lang === "en" ? Promise.resolve([] as Locale[]) : settingTranslationLocales(["sxs"]).then((map) => map.get("sxs") ?? []),
  ]);
  const shown = mergeLocale(content, translation);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">/seven-x-seven</span>
        <h1>seven x seven</h1>
        <p>Text, buttons, images and lists for the residence page. Uploads are stored in the media library. The development page at /developments/seven-x-seven is separate.</p>
        <LanguageTabs current={lang} translated={translated} query={flash} english={lang === "en" ? undefined : <EnglishCopy id={ENGLISH_COPY}><SxsForm content={content} /></EnglishCopy>} />
      </div>
      <div className="cms-actions">
        <Link className="cms-btn cms-btn--ghost" href="/seven-x-seven" target="_blank">View page</Link>
      </div>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <div className="cms-card"><SxsForm content={shown} lang={lang} englishId={ENGLISH_COPY} /></div>
      <VersionHistory entityType="SXS_PAGE" entityId="sxs" entityLabel="seven x seven" locale={lang} />
    </EditorShell>
  </>;
}
