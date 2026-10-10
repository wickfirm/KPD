import { ContactView } from "@/components/public/page-views";
import { loadContactDetails, loadStaticBlocks } from "@/lib/static-blocks";
export const metadata = { title: "Contact", description: "Contact KPD and plan a visit to the KPD Experience Center." };
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
  return <ContactView blocks={blocks} contact={contact} />;
}
