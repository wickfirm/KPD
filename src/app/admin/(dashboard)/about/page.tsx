import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import StaticPageForm from "../pages/page-form";
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
import { pageTranslationLocales, pageTranslations, translatedSeoDefaults } from "@/lib/translations/store";
import { restoreAboutTeamOnce } from "@/lib/about-team-restore";

export const dynamic = "force-dynamic";

const ENGLISH_COPY = "en-about";

/// A dedicated entry point makes the most frequently edited company page
/// discoverable without requiring editors to search the generic Pages library.
export default async function AdminAboutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  await restoreAboutTeamOnce();
  const [flash] = await Promise.all([searchParams]);
  const [page, seo] = await Promise.all([db.staticPage.findUnique({ where: { slug: "about" } }), editorSeoDefaults(seoKey("page", "about"), pageSeo.about)]);
  const lang = editorLocale(flash.lang);
  const defaults = page
    ? { ...page, content: page.content as { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string }[] }
    : { title: "About us", slug: "about", status: "PUBLISHED", content: [] };
  // The English tab is the editor as it always was. An Arabic or Japanese tab
  // is the same editor with the page's translation in it.
  const translation = page && lang !== "en" ? (await pageTranslations(["about"], lang)).get("about") : undefined;
  const shown = page && translation
    ? { ...defaults, title: mergeLocale(page.title, translation.title), content: mergeLocale(page.content as unknown[], translation.content) as typeof defaults.content }
    : defaults;
  const [translated, seoInLang] = await Promise.all([
    page && lang !== "en" ? pageTranslationLocales([page.id]).then((map) => map.get(page.id) ?? []) : [],
    translatedSeoDefaults(seoKey("page", "about"), seo, lang),
  ]);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">Company profile · /about</span>
        <h1>About us</h1>
        <p>Mission, vision, the chairman's message and the executive team — the page investors read first.</p>
        <LanguageTabs current={lang} translated={translated} query={flash} english={lang === "en" ? undefined : <EnglishCopy id={ENGLISH_COPY}><StaticPageForm defaults={defaults} lockedSlug seo={seo} /></EnglishCopy>} />
      </div>
      <Link className="cms-btn cms-btn--ghost" href="/about" target="_blank">View page</Link>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <SectionVisibilityPanel page="about" sections={pageSections.about} returnTo="/admin/about" />
      <div className="cms-card"><StaticPageForm defaults={shown} lockedSlug seo={seoInLang} lang={lang} englishId={ENGLISH_COPY} returnTo="/admin/about" /></div>
      {page ? <VersionHistory entityType="STATIC_PAGE" entityId={page.id} entityLabel="About us" locale={lang} /> : null}
    </EditorShell>
  </>;
}
