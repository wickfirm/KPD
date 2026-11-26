import Link from "next/link";
import HomeForm, { type HomeSettings } from "./home-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import { EnglishCopy, LanguageTabs } from "@/components/admin/language-tabs";
import { SectionVisibilityPanel } from "@/components/admin/section-visibility-panel";
import { pageSections } from "@/lib/section-visibility";
import { editorSeoDefaults } from "@/lib/seo-store";
import { seoKey } from "@/lib/seo-overrides";
import { pageSeo } from "@/lib/seo";
import { editorLocale } from "@/lib/locales";
import { mergeLocale } from "@/lib/translations/merge-locale";
import { settingTranslation, settingTranslationLocales, translatedSeoDefaults } from "@/lib/translations/store";

export const dynamic = "force-dynamic";

const ENGLISH_COPY = "en-home";

export default async function AdminHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [flash] = await Promise.all([searchParams]);
  let home: HomeSettings = {};
  try {
    const { db } = await import("@/lib/db");
    const setting = await db.siteSetting.findUnique({ where: { key: "home" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) home = setting.value as HomeSettings;
  } catch {}
  const seo = await editorSeoDefaults(seoKey("page", "home"), pageSeo.home);
  const lang = editorLocale(flash.lang);
  // The English tab is the editor as it always was. An Arabic or Japanese tab
  // is the same editor with the homepage's translation in it.
  const [translation, translated, seoInLang] = await Promise.all([
    settingTranslation("home", lang),
    lang === "en" ? Promise.resolve([]) : settingTranslationLocales(["home"]).then((map) => map.get("home") ?? []),
    translatedSeoDefaults(seoKey("page", "home"), seo, lang),
  ]);
  const shown = mergeLocale(home, translation);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">/ — the first thing visitors see</span>
        <h1>Homepage</h1>
        <p>Swap the hero video, rewrite the introduction, or refresh the gallery. Saving makes it live immediately.</p>
        <LanguageTabs current={lang} translated={translated} query={flash} english={lang === "en" ? undefined : <EnglishCopy id={ENGLISH_COPY}><HomeForm settings={home} seo={seo} /></EnglishCopy>} />
      </div>
      <Link className="cms-btn cms-btn--ghost" href="/" target="_blank">View page</Link>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <SectionVisibilityPanel page="home" sections={pageSections.home} returnTo="/admin/pages/home" />
      <div className="cms-card"><HomeForm settings={shown} seo={seoInLang} lang={lang} englishId={ENGLISH_COPY} /></div>
      <VersionHistory entityType="HOME_SETTINGS" entityId="home" entityLabel="the homepage" locale={lang} />
    </EditorShell>
  </>;
}
