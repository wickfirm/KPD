import Link from "next/link";
import { getNavDevelopments } from "@/lib/nav-developments";
import { getGlobalSettings } from "@/lib/site-contact";
import { getLocale, getSwitcherLocales } from "@/lib/locale";
import { localeHref } from "@/lib/locales";
import { t } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

/// Delivered site chrome â€” a 1:1 port of the header, mega menu, media
/// dropdown and mobile menu panel from the delivered templates. Markup and
/// class names are byte-faithful; only legacy hrefs are routed to Next.js.
/// Interactions (menu, dropdowns, scroll states) stay with the delivered
/// site-cms.js, which binds these elements when it executes per page view.
/// Links and labels follow the page's language; English is unchanged.

export async function SiteShellHeader() {
  const [developments, contact, locale, switcherLocales] = await Promise.all([getNavDevelopments(), getGlobalSettings(), getLocale(), getSwitcherLocales()]);
  const href = (path: string) => localeHref(path, locale);
  // Nothing to offer until the client switches the switcher on.
  const switcher = (variant: "header" | "menu") => (switcherLocales.length ? <LanguageSwitcher locale={locale} published={switcherLocales} variant={variant} /> : null);
  return <>
    <header className="site-header development-site-header is-delayed-nav">
      <div className="header-wrap">
        <button className="menu-toggle" type="button" data-menu-open aria-label={t(locale, "nav.openMenu")}><span /><span /></button>
        <nav className="header-nav header-nav-left" aria-label={t(locale, "nav.navigationLeft")}>
          <Link href={href("/#top")}>{t(locale, "nav.home")}</Link>
          {/* With nothing published (every development drafted or archived) the
              mega menu would open onto an empty panel, so the item is left out. */}
          {developments.length ? <div className="header-nav-dropdown">
            <button className="header-nav-trigger" type="button" aria-haspopup="true">{t(locale, "nav.developments")}</button>
            <div className="header-nav-menu header-mega-menu" role="menu" aria-label={t(locale, "nav.developments")}>
              <div className="header-mega-copy">
                <div className="header-mega-list">
                  {developments.map((project, index) => <Link key={project.slug} className={`mega-project-link mega-project-extra mega-project-extra-${index + 1}`} href={href(`/developments/${project.slug}`)} role="menuitem">{project.name}</Link>)}
                </div>
              </div>
              <div className="header-mega-preview" aria-hidden="true">
                {developments.map((project, index) => project.heroImage ? <img key={project.slug} className={`mega-preview-image mega-preview-extra-${index + 1}${index === 0 ? " is-default" : ""}`} src={project.heroImage} alt="" /> : null)}
              </div>
            </div>
          </div> : null}
          <Link href={href("/about")}>{t(locale, "nav.about")}</Link>
          {/* Last item of the left group: the delivered header has no room for it beside the button on the right. */}
          {switcher("header")}
        </nav>
        <Link href={href("/#top")} className="brand-link" aria-label={t(locale, "nav.homeLink")}>
          <img className="brand-logo brand-logo-dark" src="/legacy/assets/images/brand/kasumigaseki-logo-horizontal-black-text.svg" alt={t(locale, "footer.companyName")} />
          <img className="brand-logo brand-logo-light" src="/legacy/assets/images/brand/kasumigaseki-logo-horizontal-all-white.svg" alt={t(locale, "footer.companyName")} />
        </Link>
        <div className="header-right-cluster">
          <nav className="header-nav header-nav-right" aria-label={t(locale, "nav.navigationRight")}>
            <Link href={href("/legacy")}>{t(locale, "nav.history")}</Link>
            <div className="header-nav-dropdown header-nav-dropdown--media">
              <button className="header-nav-trigger" type="button" aria-haspopup="true">{t(locale, "nav.media")}</button>
              <div className="header-nav-menu header-media-menu" role="menu" aria-label={t(locale, "nav.media")}>
                <Link className="header-media-link" href={href("/news")} role="menuitem">{t(locale, "nav.news")}</Link>
                <Link className="header-media-link" href={href("/invest-in-dubai")} role="menuitem">{t(locale, "nav.investorGuide")}</Link>
              </div>
            </div>
            <Link href={href("/contact")}>{t(locale, "nav.contact")}</Link>
          </nav>
          {contact.headerCtaVisible === false ? null : <button className="btn-pill header-book-call" type="button" data-booking-open>{contact.headerCtaLabel || t(locale, "nav.enquireNow")}</button>}
        </div>
      </div>
    </header>
    <nav className="menu-panel" aria-label={t(locale, "nav.siteMenu")}>
      <button className="menu-close" type="button" data-menu-close aria-label={t(locale, "nav.closeMenu")} />
      <div className="menu-inner"><ul className="menu-list">
        <li className="menu-item menu-item-main"><Link href={href("/#top")}>{t(locale, "nav.home")}</Link></li>
        {developments.length ? <li className="menu-item menu-item-main has-sub"><Link href={href(`/developments/${developments[0].slug}`)}>{t(locale, "nav.developments")}</Link>
          <ul className="menu-sublist">
            {developments.map((project) => <li key={project.slug}><Link href={href(`/developments/${project.slug}`)}>{project.name}</Link></li>)}
          </ul>
        </li> : null}
        <li className="menu-item menu-item-main has-sub"><Link href={href("/about")}>{t(locale, "nav.about")}</Link>
          <ul className="menu-sublist"><li><Link href={href("/legacy")}>{t(locale, "nav.history")}</Link></li></ul>
        </li>
        <li className="menu-item menu-item-main has-sub"><Link href={href("/news")}>{t(locale, "nav.media")}</Link>
          <ul className="menu-sublist">
            <li><Link href={href("/news")}>{t(locale, "nav.news")}</Link></li>
            <li><Link href={href("/invest-in-dubai")}>{t(locale, "nav.investorGuide")}</Link></li>
          </ul>
        </li>
        <li className="menu-item menu-item-main"><Link href={href("/contact")}>{t(locale, "nav.contact")}</Link></li>
      </ul>
      {/* Outside the delivered list, so the delivered menu styles are untouched. */}
      {switcher("menu")}
      </div>
    </nav>
  </>;
}
