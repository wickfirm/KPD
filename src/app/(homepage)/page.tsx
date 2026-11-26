import { HomeView } from "@/components/public/home-view";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadHomeSettings } from "@/lib/home-saved";
import { getLocale } from "@/lib/locale";
import { loadLocalizedFixedPageSeo, localizedSetting } from "@/lib/translations/store";
import { pageLanguages } from "@/lib/hreflang";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  // The page's other languages, for hreflang: none while it has no translation.
  const [seo, locale, translated] = await Promise.all([loadLocalizedFixedPageSeo("home"), getLocale(), pageLanguages({ setting: "home" })]);
  return pageMetadata(seo, locale, translated);
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
