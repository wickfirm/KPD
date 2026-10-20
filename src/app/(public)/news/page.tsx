import { getNewsPageShell } from "@/lib/news-shell";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { getNavDevelopments, injectNavDevelopments } from "@/lib/nav-developments";
import { DeliveredScripts, DeliveredEarlyScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { db } from "@/lib/db";

function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export const metadata = pageMetadata(pageSeo.news);

/// The news listing page serves the delivered news.html shell + main content
/// verbatim. The delivered live-news.js fetches press items from the RSS feed
/// and populates the news grid exactly as the client intended - external
/// source links, original card design, original styling.
export default async function NewsPage() {
  const shell = getNewsPageShell();
  const [extras, listing] = await Promise.all([getNavDevelopments(), db.siteSetting.findUnique({ where: { key: "news_listing" } }).catch(() => null)]);
  const copy = (listing?.value && typeof listing.value === "object" && !Array.isArray(listing.value) ? listing.value : {}) as { eyebrow?: string; heading?: string; intro?: string };
  const heading = copy.heading?.trim() ?? "";
  const intro = copy.intro?.trim() ?? "";
  const eyebrow = copy.eyebrow?.trim() ?? "";
  const main = shell.main
    .replace("<span>Media</span>", eyebrow ? `<span>${escapeHtml(eyebrow)}</span>` : "")
    .replace("<h1>News and<br>updates</h1>", heading ? `<h1>${escapeHtml(heading).replaceAll("\n", "<br>")}</h1>` : "")
    .replace("<p>Announcements, market observations, and development commentary from Kasumigaseki Properties Development.</p>", intro ? `<p>${escapeHtml(intro)}</p>` : "");
  return <>
    <JsonLd data={webPageJsonLd({ kind: "CollectionPage", name: pageSeo.news.title, description: pageSeo.news.description, path: pageSeo.news.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "News", path: pageSeo.news.path }])} />
    <DeliveredBodyClass bodyClass="home-development-page news-design-page" />
    <div dangerouslySetInnerHTML={{ __html: injectNavDevelopments(shell.beforeMain, extras) }} />
    <div dangerouslySetInnerHTML={{ __html: main }} />
    <div dangerouslySetInnerHTML={{ __html: injectNavDevelopments(shell.afterMain, extras) }} />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page news-design-page" sources={[
      "/legacy/assets/js/live-news.js?v=20261007-internal-links",
      "/legacy/assets/js/site.js?v=20260715-backend-start-1",
    ]} />
  </>;
}
