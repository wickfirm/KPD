import Link from "next/link";

/// Delivered site chrome â€” a 1:1 port of the header, mega menu, media
/// dropdown and mobile menu panel from the delivered templates. Markup and
/// class names are byte-faithful; only legacy hrefs are routed to Next.js.
/// Interactions (menu, dropdowns, scroll states) stay with the delivered
/// site-cms.js, which binds these elements when it executes per page view.

const developments = [
  { label: "Seven X Seven", href: "/developments/seven-x-seven", className: "mega-project-link mega-project-sxs" },
  { label: "Emerald Villa", href: "/developments/emerald-villa", className: "mega-project-link mega-project-emerald" },
  { label: "Dubai Hills Mansion", href: "/developments/dubai-hills-mansion", className: "mega-project-link mega-project-hills" },
];

const megaPreviews = [
  { className: "mega-preview-image mega-preview-sxs is-default", src: "/legacy/assets/images/project-media/sxs/facade%20front%202.png" },
  { className: "mega-preview-image mega-preview-emerald", src: "/legacy/assets/images/project-media/Emerald%20Villa/13_2.jpg" },
  { className: "mega-preview-image mega-preview-hills", src: "/legacy/assets/images/project-media/Dubai%20Hills%20Mansion/6_plex_front_rev_final_1.jpg" },
];

export function SiteShellHeader() {
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
                  {developments.map((project) => <Link key={project.href} className={project.className} href={project.href} role="menuitem">{project.label}</Link>)}
                </div>
              </div>
              <div className="header-mega-preview" aria-hidden="true">
                {megaPreviews.map((preview) => <img key={preview.src} className={preview.className} src={preview.src} alt="" />)}
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
            <Link href="/legacy">Legacy</Link>
            <div className="header-nav-dropdown header-nav-dropdown--media">
              <button className="header-nav-trigger" type="button" aria-haspopup="true">Media</button>
              <div className="header-nav-menu header-media-menu" role="menu" aria-label="Media">
                <Link className="header-media-link" href="/news" role="menuitem">News</Link>
                <Link className="header-media-link" href="/invest-in-dubai" role="menuitem">Investor Guide</Link>
              </div>
            </div>
            <Link href="/contact">Contact</Link>
          </nav>
          <button className="btn-pill header-book-call" type="button" data-booking-open>Book online call</button>
        </div>
      </div>
    </header>
    <nav className="menu-panel" aria-label="Site menu">
      <button className="menu-close" type="button" data-menu-close aria-label="Close menu" />
      <div className="menu-inner"><ul className="menu-list">
        <li className="menu-item menu-item-main"><Link href="/#top">Home</Link></li>
        <li className="menu-item menu-item-main has-sub"><Link href="/developments/seven-x-seven">Developments</Link>
          <ul className="menu-sublist">
            <li><Link href="/developments/seven-x-seven">Seven X Seven</Link></li>
            <li><Link href="/developments/emerald-villa">Emerald Villa</Link></li>
            <li><Link href="/developments/dubai-hills-mansion">Dubai Hills Mansion</Link></li>
          </ul>
        </li>
        <li className="menu-item menu-item-main has-sub"><Link href="/about">About</Link>
          <ul className="menu-sublist"><li><Link href="/legacy">Our Legacy</Link></li></ul>
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
