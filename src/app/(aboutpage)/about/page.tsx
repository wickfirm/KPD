import { AboutView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { loadStaticBlocks } from "@/lib/static-blocks";

export const metadata = pageMetadata(pageSeo.about);
export const revalidate = 300;

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function AboutPage() {
  return <>
    <JsonLd data={webPageJsonLd({ kind: "AboutPage", name: pageSeo.about.title, description: pageSeo.about.description, path: pageSeo.about.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: pageSeo.about.path }])} />
    <AboutView blocks={await loadStaticBlocks("about")} />
  </>;
}
