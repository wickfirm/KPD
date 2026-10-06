import { getNewsPageShell } from "@/lib/news-shell";
import { DeliveredScripts } from "@/components/public/delivered-scripts";

export const metadata = { title: "News and updates", description: "Announcements, market observations, and development commentary from KPD." };

/// The news listing page serves the delivered news.html shell + main content
/// verbatim. The delivered live-news.js fetches press items from the RSS feed
/// and populates the news grid exactly as the client intended - external
/// source links, original card design, original styling.
export default async function NewsPage() {
  const shell = getNewsPageShell();
  return <>
    <div dangerouslySetInnerHTML={{ __html: shell.beforeMain }} />
    <div dangerouslySetInnerHTML={{ __html: shell.main }} />
    <div dangerouslySetInnerHTML={{ __html: shell.afterMain }} />
    <DeliveredScripts sources={[
      "/legacy/assets/js/live-news.js?v=20260710-v1-image-style-2",
      "/legacy/assets/js/site.js?v=20260715-backend-start-1",
    ]} />
  </>;
}