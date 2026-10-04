import Image from "next/image";
import { ContactInquiry } from "@/components/public/contact-inquiry";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts } from "@/components/public/delivered-scripts";
import { db } from "@/lib/db";

export const metadata = { title: "Contact", description: "Contact KPD and plan a visit to the KPD Experience Center." };
export const revalidate = 300;

export default async function ContactPage() {
  // The two CMS reads are independent — run them in parallel.
  const [setting, page] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "global" } }).catch(() => null),
    db.staticPage.findUnique({ where: { slug: "contact" } }).catch(() => null),
  ]);
  let contact = { email: "info@kpd.ae", phone: "+971 4 388 3099" };
  if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) contact = { ...contact, ...(setting.value as { email?: string; phone?: string }) };
  let hero: { heading?: string; text?: string; image?: string } = {};
  if (Array.isArray(page?.content)) { const block = (page.content as { type?: string; heading?: string; text?: string; image?: string }[]).find((item) => item.type === "hero"); if (block) hero = block; }
  return <><SiteShellHeader /><div className="contact-page"><section className="page-reference-hero" aria-label="Contact"><Image src={hero.image || "/legacy/assets/images/experience-center/hq/10.jpg"} alt="KPD Experience Center reception lounge" fill priority sizes="100vw" /><div className="page-reference-hero-copy motion-reveal"><span>Contact</span><h1>{hero.heading || <>Plan a visit,<br />or start a conversation.</>}</h1><p>{hero.text || "Tell us what you're looking for and the right person will respond. Previews, walkthroughs, and advisory conversations are handled through the KPD Experience Center."}</p></div></section><section className="contact-inquiry" id="experience-center" aria-label="Contact inquiry"><div className="contact-inquiry-shell"><div className="contact-inquiry-grid"><div className="contact-map-column"><figure className="contact-map-card"><Image src="/legacy/assets/images/contact/pdf/contact-pdf-01.png" alt="Experience Center location map" width={1024} height={1024} style={{ width: "100%", height: "auto" }} /></figure><address className="contact-address"><strong>Experience Center Address</strong><span>Bay Gate Tower,</span><span>Floor 36,</span><span>Business Bay, Dubai, AE</span><a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></address></div><ContactInquiry /></div></div></section></div><SiteShellFooter /><DeliveredScripts /></>;
}
