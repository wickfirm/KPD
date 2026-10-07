/// The fixed set of pages the CMS offers for editing. Page creation is
/// intentionally not free-form: new page templates require a developer, so
/// the Pages section lists exactly these entries (plus any additional rows
/// an administrator has created previously).
export type EditablePage = {
  key: string;
  title: string;
  description: string;
  href: string;
  publicHref: string;
  /** "home" uses the settings-backed homepage editor; "static" uses the page editor. */
  editor: "home" | "static" | "about";
};

export const editablePages: EditablePage[] = [
  { key: "home", title: "Homepage", description: "Hero video, introduction, developments heading, contact strip, and the Experience Center gallery.", href: "/admin/pages/home", publicHref: "/", editor: "home" },
  { key: "about", title: "About us", description: "Mission, vision, chairman's message, and the executive management team.", href: "/admin/about", publicHref: "/about", editor: "about" },
  { key: "invest-in-dubai", title: "Investor guide", description: "Intro heading and copy for the Invest in Dubai page hero.", href: "/admin/pages/invest-in-dubai", publicHref: "/invest-in-dubai", editor: "static" },
  { key: "contact", title: "Contact", description: "Intro heading and copy for the Contact page hero.", href: "/admin/pages/contact", publicHref: "/contact", editor: "static" },
  { key: "legacy", title: "Legacy", description: "Company story page with the six-part alternating timeline.", href: "/admin/pages/legacy", publicHref: "/legacy", editor: "static" },
  { key: "terms", title: "Terms of Use", description: "Legal hero and body copy for the terms page. Start a body line with “## ” to make it a section heading.", href: "/admin/pages/terms", publicHref: "/terms", editor: "static" },
  { key: "privacy-policy", title: "Privacy Policy", description: "Legal hero and body copy for the privacy page. Start a body line with “## ” to make it a section heading.", href: "/admin/pages/privacy-policy", publicHref: "/privacy-policy", editor: "static" },
  { key: "cookie-policy", title: "Cookie Policy", description: "Legal hero and body copy for the cookie page. Start a body line with “## ” to make it a section heading.", href: "/admin/pages/cookie-policy", publicHref: "/cookie-policy", editor: "static" },
];

export function findEditablePage(key: string) {
  return editablePages.find((page) => page.key === key);
}
