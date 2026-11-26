import { HomeView } from "@/components/public/home-view";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadHomeSettings } from "@/lib/home-saved";
import { getLocale } from "@/lib/locale";
import { loadLocalizedFixedPageSeo, localizedSetting } from "@/lib/translations/store";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata(await loadLocalizedFixedPageSeo("home"), await getLocale());
}

/// Unified delivered shell + React content. CMS-managed sections render as
/// React; the delivered design is the fallback for every field.
export default async function HomePage() {
  const locale = await getLocale();
  const seo = await loadLocalizedFixedPageSeo("home");
  return <>
    <JsonLd data={webPageJsonLd({ name: seo.title, description: seo.description, path: seo.path }, locale)} />
    <HomeView home={await localizedSetting("home", await loadHomeSettings(), locale)} />
  </>;
}
