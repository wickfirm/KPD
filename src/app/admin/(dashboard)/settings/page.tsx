import { db } from "@/lib/db";
import { tidyPopupNote } from "@/lib/site-contact";
import { requireRole } from "@/lib/auth";
import SettingsForm, { type Settings } from "./settings-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import { EnglishCopy, LanguageTabs } from "@/components/admin/language-tabs";
import { saveLanguageSwitches } from "../actions";
import { editorLocale, languageNames, type Locale } from "@/lib/locales";
import { getLanguageSettings } from "@/lib/locale";
import { mergeLocale } from "@/lib/translations/merge-locale";
import { settingTranslation, settingTranslationLocales } from "@/lib/translations/store";

export const dynamic = "force-dynamic";

const ENGLISH_COPY = "en-settings";

/// Site-wide contact details — administrator-only because they affect every
/// page of the public site at once.
export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(["ADMIN"]);
  const [rows, flash] = await Promise.all([
    db.siteSetting.findMany({ where: { key: { in: ["global", "home", "news_listing"] } } }),
    searchParams,
  ]);
  const settings: Settings = {};
  for (const row of rows) {
    if (row.key === "global") settings.global = tidyPopupNote(row.value as Settings["global"]);
    if (row.key === "home") settings.home = row.value as Settings["home"];
    if (row.key === "news_listing") settings.newsListing = row.value as Settings["newsListing"];
  }
  const lang = editorLocale(flash.lang);
  // The English tab is the editor as it always was. An Arabic or Japanese tab
  // is the same editor with the wording's translation in it.
  const [translation, translated, languages] = await Promise.all([
    settingTranslation("global", lang),
    lang === "en" ? Promise.resolve([] as Locale[]) : settingTranslationLocales(["global"]).then((map) => map.get("global") ?? []),
    getLanguageSettings(),
  ]);
  const shown: Settings = { ...settings, global: mergeLocale(settings.global ?? {}, translation) };
  const reached = (locale: Locale) => languages.published.includes(locale);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">Administration</span>
        <h1>Site settings</h1>
        <p>The contact details shown across the site and footer. Homepage content lives under <strong>Content → Homepage</strong>.</p>
        <LanguageTabs current={lang} translated={translated} query={flash} english={lang === "en" ? undefined : <EnglishCopy id={ENGLISH_COPY}><SettingsForm settings={settings} /></EnglishCopy>} />
      </div>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <div className="cms-card"><SettingsForm settings={shown} lang={lang} englishId={ENGLISH_COPY} /></div>
      <VersionHistory entityType="GLOBAL_SETTINGS" entityId="global" entityLabel="site settings" locale={lang} />
      <section className="cms-card cms-card--settings" id="languages">
        <div className="cms-card-intro">
          <span className="cms-eyebrow">Languages</span>
          <h2>Arabic and Japanese</h2>
          <p>Which languages can be reached at their addresses, /ar/… and /ja/…. A language that is switched off answers “Page not found”, for visitors and for search engines. English is always on. Where a page has no translation yet, it shows the English text.</p>
        </div>
        <form action={saveLanguageSwitches}>
          {(["ar", "ja"] as const).map((locale) => <label className="cms-check" key={locale}>
            <input type="checkbox" name={locale} defaultChecked={reached(locale)} />
            <span><strong>{languageNames[locale]} can be reached</strong><small>{reached(locale) ? `The pages at /${locale}/… open.` : `/${locale}/… answers “Page not found”.`}</small></span>
          </label>)}
          <p className="cms-muted">The language switcher on the public site is switched {languages.switcher ? "on" : "off"}. Until it is switched on, a language can be opened by its address but is offered nowhere.</p>
          <div className="cms-actions"><button className="cms-btn" type="submit">Save languages</button></div>
        </form>
      </section>
    </EditorShell>
  </>;
}
