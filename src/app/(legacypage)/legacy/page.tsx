import { LegacyView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { loadStaticBlocks } from "@/lib/static-blocks";

export const metadata = pageMetadata(pageSeo.legacy);
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function LegacyPage() {
  return <>
    <JsonLd data={webPageJsonLd({ name: pageSeo.legacy.title, description: pageSeo.legacy.description, path: pageSeo.legacy.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Legacy", path: pageSeo.legacy.path }])} />
    <LegacyView blocks={await loadStaticBlocks("legacy")} />
  </>;
}
