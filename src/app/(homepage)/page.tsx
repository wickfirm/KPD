import { HomeView } from "@/components/public/home-view";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadFixedPageSeo } from "@/lib/seo-store";
import { loadHomeSettings } from "@/lib/home-saved";

export const revalidate = 300;
export async function generateMetadata() {
  return pageMetadata(await loadFixedPageSeo("home"));
}

/// Unified delivered shell + React content. CMS-managed sections render as
/// React; the delivered design is the fallback for every field.
export default async function HomePage() {
  const seo = await loadFixedPageSeo("home");
  return <>
    <JsonLd data={webPageJsonLd({ name: seo.title, description: seo.description, path: seo.path })} />
    <HomeView home={await loadHomeSettings()} />
  </>;
}
