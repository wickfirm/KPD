"use client";

import Link from "next/link";
import { useState } from "react";

const developments = [
  { label: "Seven X Seven", href: "/developments/seven-x-seven" },
  { label: "Emerald Villa", href: "/developments/emerald-villa" },
  { label: "Dubai Hills Mansion", href: "/developments/dubai-hills-mansion" },
];

/// The single public navigation source. Legacy URLs remain only for templates
/// which have not yet been migrated into the Next.js application.
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [developmentsOpen, setDevelopmentsOpen] = useState(false);

  return <>
    <header className="site-header development-site-header is-past-hero">
      <div className="header-wrap">
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><span /><span /></button>
        <nav className="header-nav header-nav-left" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <div className="header-nav-dropdown">
            <button className="header-nav-trigger" type="button" aria-expanded={developmentsOpen} onClick={() => setDevelopmentsOpen((value) => !value)}>Developments</button>
            {developmentsOpen ? <div className="header-nav-menu header-media-menu" role="menu">{developments.map((item) => <Link key={item.href} className="header-media-link" href={item.href} role="menuitem" onClick={() => setDevelopmentsOpen(false)}>{item.label}</Link>)}</div> : null}
          </div>
          <Link href="/legacy/about-us.html">About</Link>
        </nav>
        <Link href="/" className="brand-link" aria-label="Kasumigaseki Properties Development home"><img className="brand-logo brand-logo-dark" src="/legacy/assets/images/brand/kasumigaseki-logo-horizontal-black-text.svg" alt="Kasumigaseki Properties Development" /></Link>
        <div className="header-right-cluster">
          <nav className="header-nav header-nav-right" aria-label="Secondary navigation"><Link href="/legacy/legacy.html">Legacy</Link><Link href="/legacy/news.html">Media</Link><Link href="/legacy/contact.html">Contact</Link></nav>
          <Link className="btn-pill header-book-call" href="/legacy/contact.html">Book online call</Link>
        </div>
      </div>
    </header>
    <nav className={`menu-panel${menuOpen ? " open" : ""}`} aria-label="Site menu">
      <button className="menu-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
      <div className="menu-inner"><ul className="menu-list"><li className="menu-item menu-item-main"><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link></li><li className="menu-item menu-item-main has-sub"><span>Developments</span><ul className="menu-sublist">{developments.map((item) => <li key={item.href}><Link href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link></li>)}</ul></li><li className="menu-item menu-item-main"><Link href="/legacy/about-us.html" onClick={() => setMenuOpen(false)}>About</Link></li><li className="menu-item menu-item-main"><Link href="/legacy/news.html" onClick={() => setMenuOpen(false)}>Media</Link></li><li className="menu-item menu-item-main"><Link href="/legacy/contact.html" onClick={() => setMenuOpen(false)}>Contact</Link></li></ul></div>
    </nav>
  </>;
}
