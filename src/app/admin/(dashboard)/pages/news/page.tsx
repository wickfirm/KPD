import Link from "next/link";
import NewsForm from "./news-form";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import { EnglishCopy, LanguageTabs } from "@/components/admin/language-tabs";
import { SectionVisibilityPanel } from "@/components/admin/section-visibility-panel";
import { pageSections } from "@/lib/section-visibility";
import { loadNewsListingCopy } from "@/lib/news-listing";
import { resolvePressItems } from "@/lib/press-coverage";
import { editorLocale } from "@/lib/locales";
import { mergeLocale } from "@/lib/translations/merge-locale";
import { settingTranslation, settingTranslationLocales } from "@/lib/translations/store";

export const dynamic = "force-dynamic";

const ENGLISH_COPY = "en-news";

/// Pages → News: the copy around the article list on /news. The articles
/// themselves are written under News & Blog.
export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [flash, copy] = await Promise.all([searchParams, loadNewsListingCopy()]);
  const lang = editorLocale(flash.lang);
  // The English tab is the editor as it always was. An Arabic or Japanese tab
  // is the same editor with the page copy's translation in it.
  const [translation, translated] = await Promise.all([
    settingTranslation("news_listing", lang),
    lang === "en" ? Promise.resolve([]) : settingTranslationLocales(["news_listing"]).then((map) => map.get("news_listing") ?? []),
  ]);
  const shown = mergeLocale(copy, translation);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">/news</span>
        <h1>News</h1>
        <p>The hero, button labels, press coverage and press band around the article list. Articles are written under <Link href="/admin/articles">News &amp; Blog</Link>. Saving makes it live immediately.</p>
        <LanguageTabs current={lang} translated={translated} query={flash} english={lang === "en" ? undefined : <EnglishCopy id={ENGLISH_COPY}><NewsForm copy={copy} coverage={resolvePressItems(copy.coverage)} /></EnglishCopy>} />
      </div>
      <Link className="cms-btn cms-btn--ghost" href="/news" target="_blank">View page</Link>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <SectionVisibilityPanel page="news" sections={pageSections.news} returnTo="/admin/pages/news" />
      <div className="cms-card"><NewsForm copy={shown} coverage={resolvePressItems(shown.coverage)} lang={lang} englishId={ENGLISH_COPY} /></div>
    </EditorShell>
  </>;
}
