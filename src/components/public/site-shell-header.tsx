import Link from "next/link";
import { getNavDevelopments } from "@/lib/nav-developments";
import { getGlobalSettings } from "@/lib/site-contact";

/// Delivered site chrome â€” a 1:1 port of the header, mega menu, media
/// dropdown and mobile menu panel from the delivered templates. Markup and
/// class names are byte-faithful; only legacy hrefs are routed to Next.js.
/// Interactions (menu, dropdowns, scroll states) stay with the delivered
/// site-cms.js, which binds these elements when it executes per page view.

export async function SiteShellHeader() {
  const [developments, contact] = await Promise.all([getNavDevelopments(), getGlobalSettings()]);
  return <>
    <header className="site-header development-site-header is-delayed-nav">
      <div className="header-wrap">
        <button className="menu-toggle" type="button" data-menu-open aria-label="Open menu"><span /><span /></button>
        <nav className="header-nav header-nav-left" aria-label="Primary navigation left">
          <Link href="/#top">Home</Link>
          <div className="header-nav-dropdown">
            <button className="header-nav-trigger" type="button" aria-haspopup="true">Developments</button>
            <div className="header-nav-menu header-mega-menu" role="menu" aria-label="Developments">
              <div className="header-mega-copy">
                <div className="header-mega-list">
                  {developments.map((project, index) => <Link key={project.slug} className={`mega-project-link mega-project-extra mega-project-extra-${index + 1}`} href={`/developments/${project.slug}`} role="menuitem">{project.name}</Link>)}
                </div>
              </div>
              <div className="header-mega-preview" aria-hidden="true">
                {developments.map((project, index) => project.heroImage ? <img key={project.slug} className={`mega-preview-image mega-preview-extra-${index + 1}${index === 0 ? " is-default" : ""}`} src={project.heroImage} alt="" /> : null)}
              </div>
            </div>
          </div>
          <Link href="/about">About</Link>
        </nav>
        <Link href="/#top" className="brand-link" aria-label="Kasumigaseki Properties Development home">
          <img className="brand-logo brand-logo-dark" src="/legacy/assets/images/brand/kasumigaseki-logo-horizontal-black-text.svg" alt="Kasumigaseki Properties Development" />
          <img className="brand-logo brand-logo-light" src="/legacy/assets/images/brand/kasumigaseki-logo-horizontal-all-white.svg" alt="Kasumigaseki Properties Development" />
        </Link>
        <div className="header-right-cluster">
          <nav className="header-nav header-nav-right" aria-label="Primary navigation right">
            <Link href="/legacy">History</Link>
            <div className="header-nav-dropdown header-nav-dropdown--media">
              <button className="header-nav-trigger" type="button" aria-haspopup="true">Media</button>
              <div className="header-nav-menu header-media-menu" role="menu" aria-label="Media">
                <Link className="header-media-link" href="/news" role="menuitem">News</Link>
                <Link className="header-media-link" href="/invest-in-dubai" role="menuitem">Investor Guide</Link>
              </div>
            </div>
            <Link href="/contact">Contact</Link>
          </nav>
          {contact.headerCtaVisible === false ? null : <button className="btn-pill header-book-call" type="button" data-booking-open>{contact.headerCtaLabel || "Enquire now"}</button>}
        </div>
      </div>
    </header>
    <nav className="menu-panel" aria-label="Site menu">
      <button className="menu-close" type="button" data-menu-close aria-label="Close menu" />
      <div className="menu-inner"><ul className="menu-list">
        <li className="menu-item menu-item-main"><Link href="/#top">Home</Link></li>
        <li className="menu-item menu-item-main has-sub"><Link href={developments[0] ? `/developments/${developments[0].slug}` : "/#developments"}>Developments</Link>
          <ul className="menu-sublist">
            {developments.map((project) => <li key={project.slug}><Link href={`/developments/${project.slug}`}>{project.name}</Link></li>)}
          </ul>
        </li>
        <li className="menu-item menu-item-main has-sub"><Link href="/about">About</Link>
          <ul className="menu-sublist"><li><Link href="/legacy">History</Link></li></ul>
        </li>
        <li className="menu-item menu-item-main has-sub"><Link href="/news">Media</Link>
          <ul className="menu-sublist">
            <li><Link href="/news">News</Link></li>
            <li><Link href="/invest-in-dubai">Investor Guide</Link></li>
          </ul>
        </li>
        <li className="menu-item menu-item-main"><Link href="/contact">Contact</Link></li>
      </ul></div>
    </nav>
  </>;
}
