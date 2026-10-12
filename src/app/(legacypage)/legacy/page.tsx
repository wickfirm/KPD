import { LegacyView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadFixedPageSeo } from "@/lib/seo-store";
import { loadStaticBlocks } from "@/lib/static-blocks";

export async function generateMetadata() {
  return pageMetadata(await loadFixedPageSeo("legacy"));
}
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function LegacyPage() {
  const seo = await loadFixedPageSeo("legacy");
  return <>
    <JsonLd data={webPageJsonLd({ name: seo.title, description: seo.description, path: seo.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Legacy", path: seo.path }])} />
    <LegacyView blocks={await loadStaticBlocks("legacy")} />
  </>;
}
