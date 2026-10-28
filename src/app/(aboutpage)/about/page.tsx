import { AboutView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadFixedPageSeo } from "@/lib/seo-store";
import { loadStaticBlocks } from "@/lib/static-blocks";

export async function generateMetadata() {
  return pageMetadata(await loadFixedPageSeo("about"));
}
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function AboutPage() {
  const seo = await loadFixedPageSeo("about");
  return <>
    <JsonLd data={webPageJsonLd({ kind: "AboutPage", name: seo.title, description: seo.description, path: seo.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: seo.path }])} />
    <AboutView blocks={await loadStaticBlocks("about")} />
  </>;
}
