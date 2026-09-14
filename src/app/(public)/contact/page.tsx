import { ContactInquiry } from "@/components/public/contact-inquiry";
import { db } from "@/lib/db";

export const metadata = { title: "Contact", description: "Contact KPD and plan a visit to the KPD Experience Center." };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  let contact = { email: "info@kpd.ae", phone: "+971 4 388 3099" };
  try { const setting = await db.siteSetting.findUnique({ where: { key: "global" } }); if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) contact = { ...contact, ...(setting.value as { email?: string; phone?: string }) }; } catch {}
  return <div className="contact-page"><section className="page-reference-hero" aria-label="Contact"><img src="/legacy/assets/images/experience-center/hq/10.jpg" alt="KPD Experience Center reception lounge" /><div className="page-reference-hero-copy motion-reveal"><span>Contact</span><h1>Plan a visit,<br />or start a conversation.</h1><p>Tell us what you&apos;re looking for and the right person will respond. Previews, walkthroughs, and advisory conversations are handled through the KPD Experience Center.</p></div></section><section className="contact-inquiry" id="experience-center" aria-label="Contact inquiry"><div className="contact-inquiry-shell"><div className="contact-inquiry-grid"><div className="contact-map-column"><figure className="contact-map-card"><img src="/legacy/assets/images/contact/pdf/contact-pdf-01.png" alt="Experience Center location map" /></figure><address className="contact-address"><strong>Experience Center Address</strong><span>Bay Gate Tower,</span><span>Floor 36,</span><span>Business Bay, Dubai, AE</span><a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></address></div><ContactInquiry /></div></div></section></div>;
}
