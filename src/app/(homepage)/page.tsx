import { HomeView } from "@/components/public/home-view";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { loadHomeSettings } from "@/lib/home-saved";

export const revalidate = 300;
export const metadata = pageMetadata(pageSeo.home);

/// Unified delivered shell + React content. CMS-managed sections render as
/// React; the delivered design is the fallback for every field.
export default async function HomePage() {
  return <>
    <JsonLd data={webPageJsonLd({ name: pageSeo.home.title, description: pageSeo.home.description, path: pageSeo.home.path })} />
    <HomeView home={await loadHomeSettings()} />
  </>;
}
