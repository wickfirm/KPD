import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ArticleForm from "../article-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import { EnglishCopy, LanguageTabs } from "@/components/admin/language-tabs";
import { editorSeoDefaults } from "@/lib/seo-store";
import { seoKey } from "@/lib/seo-overrides";
import { withBrand } from "@/lib/seo";
import { editorLocale } from "@/lib/locales";
import { mergeLocale } from "@/lib/translations/merge-locale";
import { articleTranslation, articleTranslationLocales, translatedSeoDefaults } from "@/lib/translations/store";

export const dynamic = "force-dynamic";

const ENGLISH_COPY = "en-article";

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, flash] = await Promise.all([params, searchParams]);
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();
  const automatic = { title: withBrand(article.title), description: article.summary || article.title };
  const seo = await editorSeoDefaults(seoKey("article", article.id), automatic);
  const lang = editorLocale(flash.lang);
  // The English tab is the editor as it always was. An Arabic or Japanese tab
  // is the same editor with the article's translation in it.
  const english = {
    id: article.id,
    kind: article.kind,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    body: JSON.stringify(article.body),
    coverImage: article.coverImage,
    coverImageAlt: article.coverImageAlt,
    status: article.status,
  };
  const translation = lang === "en" ? null : await articleTranslation(article.id, lang);
  const shown = translation
    ? mergeLocale({ title: article.title, summary: article.summary, body: article.body, coverImageAlt: article.coverImageAlt }, translation)
    : { title: article.title, summary: article.summary, body: article.body, coverImageAlt: article.coverImageAlt };
  const [translated, seoInLang] = await Promise.all([
    lang === "en" ? Promise.resolve([]) : articleTranslationLocales([article.id]).then((map) => map.get(article.id) ?? []),
    translatedSeoDefaults(seoKey("article", article.id), seo, lang),
  ]);

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">{article.kind === "BLOG" ? "Blog post" : "News article"} · /{article.slug}</span>
          <h1>{article.title || "Edit article"}</h1>
          <p>Update the words and pictures, then save. Use “Draft” while you work — visitors only see “Published” articles.</p>
          <LanguageTabs current={lang} translated={translated} query={flash} english={lang === "en" ? undefined : <EnglishCopy id={ENGLISH_COPY}><ArticleForm defaults={english} seo={seo} /></EnglishCopy>} />
        </div>
        <div className="cms-actions">
          <Link className="cms-btn cms-btn--outline" href={lang === "en" ? `/admin/preview/articles/${article.id}` : `/admin/preview/articles/${article.id}?lang=${lang}`} target="_blank">Preview saved version ↗</Link>
          <span className={`cms-badge cms-badge--${article.status}`}>{article.status}</span>
        </div>
      </div>
      <SavedBanner params={flash} />
      <EditorShell>
      <div className="cms-card">
        <ArticleForm
          seo={seoInLang}
          lang={lang}
          englishId={ENGLISH_COPY}
          defaults={{ ...english, title: shown.title, summary: shown.summary, body: JSON.stringify(shown.body), coverImageAlt: shown.coverImageAlt ?? null }}
        />
      </div>
      <VersionHistory entityType="ARTICLE" entityId={article.id} entityLabel={article.title} locale={lang} />
      </EditorShell>
    </>
  );
}
