import { ContactView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadFixedPageSeo } from "@/lib/seo-store";
import { loadContactDetails, loadStaticBlocks } from "@/lib/static-blocks";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
export async function generateMetadata() {
  return pageMetadata(await loadFixedPageSeo("contact"), await getLocale());
}
export const revalidate = 300;

/// Unified delivered shell + React content, ported 1:1 from the delivered
/// public/legacy/contact.html (body class "home-development-page kpd-page
/// contact-page", main.contact-main.page-reference-main). The hero copy and
/// contact details are CMS-managed (staticPage "contact" hero block +
/// siteSetting "global"), with the delivered copy as fallback. The inquiry
/// form keeps the delivered DOM but submits to /api/contact (dual-write to
/// the local store + Salesforce) instead of the delivered mailto action.
export default async function ContactPage() {
  // The two CMS reads are independent — run them in parallel.
  const [contact, blocks] = await Promise.all([loadContactDetails(), loadStaticBlocks("contact")]);
  const [seo, locale] = await Promise.all([loadFixedPageSeo("contact"), getLocale()]);
  return <>
    <JsonLd data={webPageJsonLd({ kind: "ContactPage", name: seo.title, description: seo.description, path: seo.path }, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "nav.contact"), path: seo.path }], locale)} />
    <ContactView blocks={blocks} contact={contact} />
  </>;
}
