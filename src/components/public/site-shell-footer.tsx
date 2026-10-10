import Link from "next/link";
import { getGlobalSettings } from "@/lib/site-contact";
import { getNavDevelopments } from "@/lib/nav-developments";

/// Delivered footer â€” 1:1 port of the delivered markup (link columns,
/// newsletter signup, legal row and social icons). The newsletter posts via
/// mailto exactly as delivered.
export async function SiteShellFooter() {
  const contact = await getGlobalSettings();
  const extras = await getNavDevelopments();
  // The delivered interaction script (site-cms.js) builds the floating Call /
  // WhatsApp / Enquiry buttons and the booking form; it reads these details.
  const contactScript = `window.__KPD_CONTACT=${JSON.stringify({ email: contact.email, phone: contact.phone, whatsapp: contact.whatsapp }).replace(/</g, "\u003c")};`;
  return <><script dangerouslySetInnerHTML={{ __html: contactScript }} /><footer className="section_footer" id="footer">
    <div className="footer_container">
      <div className="footer_header">
        <Link href="/#top" aria-label="Kasumigaseki Properties Development home" className="footer_logo_link">
          <img src="/legacy/assets/images/brand/kasumigaseki-logo-horizontal-all-white.svg" loading="lazy" width="358" alt="Kasumigaseki Properties Development" className="footer_logo" />
        </Link>
      </div>
      <div className="footer_links">
        <div className="footer_links_col_container">
          <div className="footer_links_col">
            <h3 className="footer_links_title text-size-footer">Development</h3>
            <ul role="list" className="footer_links_list">
              <li className="footer_links_item"><Link href="/developments/seven-x-seven" className="footer_link text-size-footer">Seven X Seven Residences</Link></li>
              <li className="footer_links_item"><Link href="/developments/emerald-villa" className="footer_link text-size-footer">Emerald Villa</Link></li>
              <li className="footer_links_item"><Link href="/developments/dubai-hills-mansion" className="footer_link text-size-footer">Dubai Hills Mansion</Link></li>
              {extras.map((project) => <li className="footer_links_item" key={project.slug}><Link href={`/developments/${project.slug}`} className="footer_link text-size-footer">{project.name}</Link></li>)}
            </ul>
          </div>
          <div className="footer_links_col">
            <h3 className="footer_links_title text-size-footer">Company</h3>
            <ul role="list" className="footer_links_list">
              <li className="footer_links_item"><Link href="/about" className="footer_link text-size-footer">About Us</Link></li>
              <li className="footer_links_item"><Link href="/legacy" className="footer_link text-size-footer">Legacy</Link></li>
              <li className="footer_links_item"><Link href="/invest-in-dubai" className="footer_link text-size-footer">Investor Guide</Link></li>
            </ul>
          </div>
          <div className="footer_links_col">
            <h3 className="footer_links_title text-size-footer">Media</h3>
            <ul role="list" className="footer_links_list">
              <li className="footer_links_item"><Link href="/news" className="footer_link text-size-footer">News &amp; Updates</Link></li>
              <li className="footer_links_item"><Link href="/contact" className="footer_link text-size-footer">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer_links_newsletter">
          <h3 className="footer_links_title text-size-footer">Stay in the know</h3>
          <div className="footer_form_block">
            <form id="footer-email-form" name="footer-email-form" method="post" action={`mailto:${contact.email}?subject=KPD%20Newsletter%20Signup`} encType="text/plain" className="footer_form" aria-label="Email Form">
              <label htmlFor="footerEmail" className="form-label hide">Email Address</label>
              <input className="input-text text-size-footer" maxLength={256} name="Email" placeholder="Email Address" type="email" id="footerEmail" required />
              <input type="submit" className="button_submit" value="Submit" />
            </form>
          </div>
          <div className="footer_newsletter_terms text-size-small">{contact.newsletterNote} <Link href="/privacy-policy" className="link">privacy policy.</Link></div>
        </div>
      </div>
      <div className="footer_legal_social footer_links">
        <div className="footer_legal_left">
          <ul role="list" className="footer_links_row">
            <li className="footer_links_item footer_links_legal_item"><Link href="/terms" className="footer_link text-size-footer">Terms of Use</Link></li>
            <li className="footer_links_item footer_links_legal_item"><Link href="/privacy-policy" className="footer_link text-size-footer">Privacy</Link></li>
            <li className="footer_links_item footer_links_legal_item"><Link href="/cookie-policy" className="footer_link text-size-footer">Cookie Policy</Link></li>
          </ul>
          <div className="footer_links_social" aria-label="Social links">
            <a aria-label="Facebook" href={contact.facebook} target="_blank" rel="noreferrer" className="icon-social-link-block"><div className="icon-socials">f</div></a>
            <a aria-label="X" href={contact.x} target="_blank" rel="noreferrer" className="icon-social-link-block"><div className="icon-socials"><svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m.031 0 4.95 6.619L0 12h1.121l4.361-4.711L9.006 12h3.815L7.592 5.009 12.23 0h-1.121L7.092 4.34 3.846 0H.031ZM1.68.826h1.753l7.74 10.348H9.418L1.68.826Z" fill="currentColor" /></svg></div></a>
            <a aria-label="Instagram" href={contact.instagram} target="_blank" rel="noreferrer" className="icon-social-link-block"><div className="icon-socials"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M6.48 1.168c1.73 0 1.934.006 2.617.039.631.027.976.135 1.204.223.303.118.518.259.744.485.226.226.367.443.485.744.088.228.196.57.223 1.204.03.683.039.887.039 2.617s-.006 1.934-.039 2.617c-.027.631-.135.976-.223 1.204a2.016 2.016 0 0 1-.485.744 2.038 2.038 0 0 1-.744.485c-.228.088-.57.196-1.204.223-.683.03-.887.039-2.617.039s-1.934-.006-2.617-.039c-.631-.027-.976-.135-1.204-.223a2.014 2.014 0 0 1-.744-.485 2.037 2.037 0 0 1-.485-.744c-.088-.228-.196-.57-.223-1.204-.03-.683-.039-.887-.039-2.617s.006-1.934.039-2.617c.027-.631.135-.976.223-1.204.118-.303.259-.518.485-.744.226-.226.443-.367.744-.485.228-.088.57-.196 1.204-.223.683-.03.887-.039 2.617-.039ZM6.48 0C4.72 0 4.5.008 3.808.039c-.69.03-1.16.14-1.574.3a3.2 3.2 0 0 0-1.148.747c-.361.36-.582.721-.747 1.148-.16.414-.27.885-.3 1.574C.009 4.499 0 4.719 0 6.48c0 1.76.008 1.98.039 2.672.03.69.14 1.16.3 1.574a3.2 3.2 0 0 0 .747 1.148 3.14 3.14 0 0 0 1.148.747c.414.16.885.27 1.574.3.691.03.911.039 2.672.039 1.76 0 1.98-.008 2.672-.039.69-.03 1.16-.14 1.574-.3a3.2 3.2 0 0 0 1.148-.747c.361-.36.582-.721.747-1.148.16-.414.27-.885.3-1.574.03-.691.039-.912.039-2.672 0-1.76-.008-1.98-.039-2.672-.03-.69-.14-1.16-.3-1.574a3.2 3.2 0 0 0-.747-1.148 3.163 3.163 0 0 0-1.148-.747c-.414-.16-.885-.27-1.574-.3C8.461.009 8.24 0 6.48 0Zm4.24 3.138a.776.776 0 1 1-1.553 0 .776.776 0 1 1 1.553 0ZM3.156 6.48a3.329 3.329 0 1 1 6.658.002 3.329 3.329 0 0 1-6.658-.002Zm1.168 0a2.16 2.16 0 1 0 4.32 0 2.16 2.16 0 0 0-4.32 0Z" fill="currentColor" /></svg></div></a>
            <a aria-label="YouTube" href={contact.youtube} target="_blank" rel="noreferrer" className="icon-social-link-block"><div className="icon-socials"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.66 2.02c-.18-.7-.72-1.24-1.4-1.43C13.02.25 8 .25 8 .25S2.98.25 1.74.59C1.06.78.52 1.32.34 2.02.01 3.29.01 5.94.01 5.94s0 2.65.33 3.92c.18.7.72 1.24 1.4 1.43 1.24.34 6.26.34 6.26.34s5.02 0 6.26-.34c.68-.19 1.22-.73 1.4-1.43.33-1.27.33-3.92.33-3.92s0-2.65-.33-3.92ZM6.41 8.38V3.5l4.17 2.44-4.17 2.44Z" fill="currentColor" /></svg></div></a>
          </div>
        </div>
        <div className="footer_legal_text text-size-footer">Kasumigaseki Properties Development &copy; 2026</div>
      </div>
    </div>
  </footer></>;
}
