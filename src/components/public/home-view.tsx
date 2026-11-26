import { HomeMain } from "./home-page";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";
import { getHomeStaticTail } from "@/lib/legacy-home";
import type { HomeSettings } from "@/lib/home-defaults";
import { getPublishedDevelopmentCards } from "@/lib/nav-developments";
import { loadHiddenSections } from "@/lib/section-visibility-store";
import { loadNewsArticles } from "@/lib/news-listing";
import { HOME_NEWS_LIMIT } from "@/lib/home-news";
import { getLocale } from "@/lib/locale";
import { localizedArticles, localizedDevelopmentCards } from "@/lib/translations/store";

/// The homepage: delivered shell + React content. Shared by the public route
/// and the admin unsaved-changes preview so both render identically.
export async function HomeView({ home, previewNote }: { home: HomeSettings; previewNote?: string }) {
  const [englishCards, hidden, englishNews, locale] = await Promise.all([getPublishedDevelopmentCards(), loadHiddenSections("home"), loadNewsArticles(HOME_NEWS_LIMIT), getLocale()]);
  // The development cards and the news cards carry their own English text; in
  // another language each takes its translation. English keeps the same lists.
  const [developmentCards, newsArticles] = await Promise.all([localizedDevelopmentCards(englishCards, locale), localizedArticles(englishNews, locale)]);
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page" />
    <SiteShellHeader />
    <HomeMain settings={home} staticTail={getHomeStaticTail()} developmentCards={developmentCards} hidden={hidden} newsArticles={newsArticles} locale={locale} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page" sources={["/legacy/assets/js/live-news.js?v=20261007-internal-links"]} />
  </>;
}
