import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { findEditablePage } from "@/lib/editable-pages";
import { deleteStaticPage } from "../../actions";
import StaticPageForm from "../page-form";
import InvestForm from "../invest-form";
import LegalTranslationForm from "../legal-translation-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { EditorShell } from "@/components/admin/editor-shell";
import { EnglishCopy, LanguageTabs } from "@/components/admin/language-tabs";
import { SectionVisibilityPanel } from "@/components/admin/section-visibility-panel";
import { isFixedSectionPage, pageSections } from "@/lib/section-visibility";
import { editorSeoDefaults } from "@/lib/seo-store";
import { fixedPageSeoDefaults, seoKey } from "@/lib/seo-overrides";
import { applyTermsCopyOnce } from "@/lib/terms-restore";
import { editorLocale } from "@/lib/locales";
import { mergeLocale } from "@/lib/translations/merge-locale";
import { legalTranslation, pageTranslationLocales, pageTranslations, translatedSeoDefaults } from "@/lib/translations/store";
import { legalContact, legalDocuments, legalTabForSlug } from "@/lib/terms-defaults";

export const dynamic = "force-dynamic";

type ContentBlock = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string };

const ENGLISH_COPY = "en-page";
const LEGAL_PAGES = ["terms", "privacy-policy", "cookie-policy"];

/// One editor for both kinds of targets:
/// - a registry key (e.g. /admin/pages/legacy, /admin/pages/contact) which
///   finds or creates its StaticPage row on first open, and
/// - a raw page id (/admin/pages/<id>) for additional rows.
/// The English tab (?lang=en, the default) is the editor as it always was. An
/// Arabic or Japanese tab is the same editor with the page's translation in it;
/// for a legal page it is the client's document shown line by line.
export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, flash] = await Promise.all([params, searchParams]);
  const entry = findEditablePage(id);
  if (entry?.key === "terms") await applyTermsCopyOnce();

  let page = await db.staticPage.findUnique({ where: entry ? { slug: entry.key } : { id } });
  if (!page && entry) {
    // The registry entry is edited for the first time — create its row.
    // Only the legal pages gate on status (they serve the delivered static file until
    // published); every other registry page is live from its code defaults, so its
    // row starts as PUBLISHED and the editor does not offer a misleading status.
    const legal = LEGAL_PAGES.includes(entry.key);
    page = await db.staticPage.create({ data: { slug: entry.key, title: entry.title, status: legal ? "DRAFT" : "PUBLISHED", content: [] } });
  }
  if (!page) notFound();
  const autoSeo = fixedPageSeoDefaults(page.slug);
  const seo = autoSeo ? await editorSeoDefaults(seoKey("page", page.slug), autoSeo) : undefined;

  const lang = editorLocale(flash.lang);
  const isLegal = LEGAL_PAGES.includes(page.slug);
  const returnTo = entry?.href ?? `/admin/pages/${page.id}`;
  const blocks = Array.isArray(page.content) ? page.content as ContentBlock[] : [];
  // What a legal page shows in English: the client's document, and the
  // "Questions" block with the standard wording where nothing is saved.
  const englishDocument = legalDocuments.find((document) => document.id === legalTabForSlug(page.slug));
  const savedContact = blocks.find((block) => block.type === "legal-contact");
  const englishContact = { ...legalContact, ...(savedContact ?? {}) };
  let shownBlocks: ContentBlock[] = blocks;
  let shownTitle = page.title;
  let shownDocument = englishDocument;
  let shownContact = englishContact;
  if (lang !== "en") {
    if (isLegal) {
      const own = await legalTranslation(page.slug, lang);
      if (englishDocument) shownDocument = mergeLocale(englishDocument, own.document);
      shownContact = mergeLocale(englishContact, own.contact);
    } else {
      const translation = (await pageTranslations([page.slug], lang)).get(page.slug);
      shownBlocks = mergeLocale(blocks, translation?.content) as ContentBlock[];
      shownTitle = mergeLocale(page.title, translation?.title);
    }
  }
  const [translated, seoInLang] = await Promise.all([
    lang === "en" ? [] : pageTranslationLocales([page.id]).then((map) => map.get(page.id) ?? []),
    seo ? translatedSeoDefaults(seoKey("page", page.slug), seo, lang) : undefined,
  ]);

  /// The editor of this page, in English (`reference`) or in the tab's language.
  const editor = (reference: boolean) => {
    if (isLegal) {
      if (lang === "en") return <StaticPageForm defaults={{ ...page, content: blocks }} lockedSlug={Boolean(entry)} seo={seo} />;
      const document = reference ? englishDocument : shownDocument;
      // No document to show line by line (it should not happen): the ordinary editor.
      if (!document) return <StaticPageForm defaults={{ ...page, content: blocks }} lockedSlug={Boolean(entry)} seo={seo} />;
      return <LegalTranslationForm pageId={page.id} returnTo={returnTo} document={document} contact={reference ? englishContact : shownContact} lang={lang} englishId={ENGLISH_COPY} />;
    }
    if (page.slug === "invest-in-dubai") {
      return <InvestForm defaults={{ id: page.id, slug: page.slug, title: reference ? page.title : shownTitle, content: reference ? blocks : shownBlocks }} seo={reference ? seo : seoInLang} lang={reference ? "en" : lang} englishId={ENGLISH_COPY} returnTo={returnTo} />;
    }
    return <StaticPageForm defaults={{ ...page, title: reference ? page.title : shownTitle, content: reference ? blocks : shownBlocks }} lockedSlug={Boolean(entry)} seo={reference ? seo : seoInLang} lang={reference ? "en" : lang} englishId={ENGLISH_COPY} returnTo={returnTo} />;
  };

  const title = entry ? `Edit ${entry.title}` : "Edit page";
  const publicHref = entry?.publicHref ?? `/${page.slug}`;
  const previewHref = entry && LEGAL_PAGES.includes(entry.key) ? (lang === "en" ? `/admin/preview/pages/${entry.key}` : `/admin/preview/pages/${entry.key}?lang=${lang}`) : null;
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">{publicHref}</span>
          <h1>{title}</h1>
          <p>{entry ? "This page is part of the fixed site structure — the editor covers its introduction and body copy." : "Update the copy, then save. Drafts stay private."}</p>
          <LanguageTabs current={lang} translated={translated} query={flash} english={lang === "en" ? undefined : <EnglishCopy id={ENGLISH_COPY}>{editor(true)}</EnglishCopy>} />
        </div>
        <div className="cms-actions">
          <Link className="cms-btn cms-btn--ghost" href="/admin/pages">Back</Link>
          {previewHref ? <Link className="cms-btn cms-btn--ghost" href={previewHref} target="_blank">Preview saved text</Link> : null}
          <Link className="cms-btn cms-btn--ghost" href={publicHref} target="_blank">View page</Link>
          {!entry ? (
            <form data-requires="delete" action={deleteStaticPage}>
              <input type="hidden" name="id" value={page.id} />
              <ConfirmButton className="cms-btn cms-btn--danger" message={`Delete the page “${page.title}” permanently?`}>Delete</ConfirmButton>
            </form>
          ) : null}
        </div>
      </div>
      <SavedBanner params={flash} />
      <EditorShell>
      {entry && isFixedSectionPage(entry.key) ? <SectionVisibilityPanel page={entry.key} sections={pageSections[entry.key]} returnTo={entry.href} /> : null}
      <div className="cms-card">
        {editor(lang === "en")}
      </div>
      <VersionHistory entityType="STATIC_PAGE" entityId={page.id} entityLabel={page.title} locale={lang} />
      </EditorShell>
    </>
  );
}
