import { ContactInquiry } from "@/components/public/contact-inquiry";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";
import { db } from "@/lib/db";

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
  const [setting, page] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "global" } }).catch(() => null),
    db.staticPage.findUnique({ where: { slug: "contact" } }).catch(() => null),
  ]);
  let contact = { email: "info@kpd.ae", phone: "+971 4 388 3099", website: "https://kpd.ae" };
  if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) contact = { ...contact, ...(setting.value as { email?: string; phone?: string; website?: string }) };
  let hero: { heading?: string; text?: string; image?: string } = {};
  if (Array.isArray(page?.content)) { const block = (page.content as { type?: string; heading?: string; text?: string; image?: string }[]).find((item) => item.type === "hero"); if (block) hero = block; }
  return <><SiteShellHeader /><main id="top" className="contact-main page-reference-main"><section className="page-reference-hero" aria-label="Contact"><img src={hero.image || "/legacy/assets/images/experience-center/hq/10.jpg"} alt="KPD Experience Center reception lounge" /><div className="page-reference-hero-copy motion-reveal"><span>Contact</span><h1>{hero.heading || <>Plan a visit,<br />or start a conversation.</>}</h1><p>{hero.text || "Tell us what you're looking for and the right person will respond. Previews, walkthroughs, and advisory conversations are handled through the KPD Experience Center."}</p></div></section><section className="contact-inquiry" id="experience-center" aria-label="Contact inquiry"><div className="contact-inquiry-shell"><ContactInquiry email={contact.email} phone={contact.phone} website={contact.website} /></div></section></main><SiteShellFooter /><DeliveredScripts bodyClass="home-development-page kpd-page contact-page" /></>;
}
