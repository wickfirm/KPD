import type { TextStyle } from "@/lib/text-style";
import { legalContact, legalDocuments, legalTabForSlug, type LegalDocument } from "@/lib/terms-defaults";
import { DEFAULT_LOCALE } from "@/lib/locales";
import { getLocale } from "@/lib/locale";
import { legalTranslation } from "@/lib/translations/store";
import { mergeLocale } from "@/lib/translations/merge-locale";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";
import { LegalTabs } from "./legal-tabs";

type Block = { type?: string; image?: string; headingStyle?: TextStyle; heading?: string; text?: string; email?: string };

const legalHeroes: Record<string, string> = {
  terms: "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg",
  "privacy-policy": "/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg",
  "cookie-policy": "/legacy/assets/images/library/dubai-marina-skyscrapers-and-port-in-dubai-united-2026-03-24-00-24-57-utc.jpg",
};

/// Registry only: it defines the CMS-managed legal routes, not page content.
export const legalPages: Record<string, object> = { terms: {}, "privacy-policy": {}, "cookie-policy": {} };

/// The three legal addresses share one document. Terms, Privacy and Cookies
/// switch in place. A saved hero image still replaces the skyline fallback.
export async function LegalPageView({ slug, page, previewNote }: { slug: string; page: { title: string; content?: unknown }; previewNote?: string }) {
  const locale = await getLocale();
  const blocks = Array.isArray(page.content) ? page.content as Block[] : [];
  const hero = blocks.find((block) => block.type === "hero");
  const bodyClass = "home-development-page kpd-page kpd-legal-page kpd-terms-page";
  // English shows the client's document as it is. Another language lays each
  // legal page's translation over its own document, and this page's over the
  // contact block; whatever is not translated stays English.
  const contactBlock = blocks.find((block) => block.type === "legal-contact");
  let documents: LegalDocument[] | undefined;
  let contact = contactBlock;
  if (locale !== DEFAULT_LOCALE) {
    const translated = await Promise.all(Object.keys(legalPages).map(async (legalSlug) => ({ slug: legalSlug, ...await legalTranslation(legalSlug, locale) })));
    documents = legalDocuments.map((document) => {
      const own = translated.find((entry) => legalTabForSlug(entry.slug) === document.id);
      return own?.document ? mergeLocale(document, own.document) : document;
    });
    const own = translated.find((entry) => entry.slug === slug);
    contact = mergeLocale({ ...legalContact, ...contactBlock }, own?.contact);
  }
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass={bodyClass} />
    <SiteShellHeader />
    <main id="top">
      <LegalTabs initialTab={legalTabForSlug(slug)} image={hero?.image || legalHeroes[slug]} headingStyle={hero?.headingStyle} contact={contact} locale={locale} documents={documents} />
    </main>
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass={bodyClass} />
  </>;
}
