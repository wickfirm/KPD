import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { NewsListingMain } from "@/components/public/news-listing";
import { loadNewsArticles, loadNewsListingCopy } from "@/lib/news-listing";
import { loadContactDetails } from "@/lib/static-blocks";
import { resolvePressItems, sortPressItems } from "@/lib/press-coverage";
import { loadHiddenSections } from "@/lib/section-visibility-store";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { localizedArticles, localizedSetting } from "@/lib/translations/store";
import { pageLanguages } from "@/lib/hreflang";

/// Resolved per request, so the canonical and og:locale follow the page's language.
export async function generateMetadata() {
  const [locale, translated] = await Promise.all([getLocale(), pageLanguages({ setting: "news_listing" })]);
  return pageMetadata(pageSeo.news, locale, translated);
}

/// The news listing in the client-approved Option 2.1 "Gallery light" layout,
/// rendered on the server from the published CMS articles (the delivered
/// live-news.js only ever showed these whenever any were published). Hero copy
/// comes from Site settings → News listing; the delivered header/footer and
/// site-cms.js stay as on every other page.
export default async function NewsPage() {
  const locale = await getLocale();
  // The page waits for what its metadata reads, so that its metadata can never
  // resolve after the page (Next would stream it to the end of the HTML).
  const [englishArticles, englishCopy, contact, hidden] = await Promise.all([loadNewsArticles(), loadNewsListingCopy(), loadContactDetails(), loadHiddenSections("news"), pageLanguages({ setting: "news_listing" })]);
  // The page's own copy and the articles take their translations in another
  // language; English keeps the lists it loaded.
  const [articles, copy] = await Promise.all([localizedArticles(englishArticles, locale), localizedSetting("news_listing", englishCopy, locale)]);
  return <>
    <JsonLd data={webPageJsonLd({ kind: "CollectionPage", name: pageSeo.news.title, description: pageSeo.news.description, path: pageSeo.news.path }, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "nav.news"), path: pageSeo.news.path }], locale)} />
    <DeliveredBodyClass bodyClass="home-development-page news-design-page" />
    <SiteShellHeader />
    <NewsListingMain articles={articles} copy={copy} email={contact.email} coverage={sortPressItems(resolvePressItems(copy.coverage))} hidden={hidden} locale={locale} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page news-design-page" />
  </>;
}
