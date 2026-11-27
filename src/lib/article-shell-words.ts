import type { Locale } from "@/lib/locales";
import type { GlobalSettings } from "@/lib/site-contact";
import { t } from "@/lib/i18n";
import { newsletterEmailLabel, type ShellWord } from "@/lib/shell-words";

type ShellContact = Pick<GlobalSettings, "headerCtaLabel" | "newsletterHeading" | "newsletterSubmitLabel" | "newsletterNote" | "footerTermsLabel" | "footerPrivacyLabel" | "footerCookiesLabel" | "footerCopyright">;

/// The words of the delivered article shell (public/legacy/news-article.html),
/// each as the localized shell shows it on every other page: the dictionary's,
/// or what the editor saved in Site settings where the localized shell follows
/// a saved value. The delivered article page shows its own fixed words whatever
/// the settings hold, so where nothing is saved the word is left as delivered.
export function articleShellWords(locale: Locale, contact: ShellContact): ShellWord[] {
  const savedOr = (value: string | undefined, delivered: string) => value?.trim() || delivered;
  return [
    { english: "Open menu", text: t(locale, "nav.openMenu") },
    { english: "Primary navigation left", text: t(locale, "nav.navigationLeft") },
    { english: "Primary navigation right", text: t(locale, "nav.navigationRight") },
    { english: "Site menu", text: t(locale, "nav.siteMenu") },
    { english: "Close menu", text: t(locale, "nav.closeMenu") },
    { english: "Kasumigaseki Properties Development home", text: t(locale, "nav.homeLink") },
    { english: "Kasumigaseki Properties Development", text: t(locale, "footer.companyName") },
    { english: "Home", text: t(locale, "nav.home") },
    { english: "Developments", text: t(locale, "nav.developments") },
    { english: "About", text: t(locale, "nav.about") },
    { english: "Our Legacy", text: t(locale, "nav.history") },
    { english: "Legacy", text: t(locale, "nav.history") },
    { english: "Media", text: t(locale, "nav.media") },
    { english: "News", text: t(locale, "nav.news") },
    { english: "Investor Guide", text: t(locale, "nav.investorGuide") },
    { english: "Contact", text: t(locale, "nav.contact") },
    { english: "Book online call", text: savedOr(contact.headerCtaLabel, "Book online call") },
    { english: "Development", text: t(locale, "footer.developments") },
    { english: "Company", text: t(locale, "footer.company") },
    { english: "About Us", text: t(locale, "footer.about") },
    { english: "News & Updates", text: t(locale, "footer.news") },
    { english: "Contact Us", text: t(locale, "footer.contact") },
    { english: "Stay in the know", text: savedOr(contact.newsletterHeading, t(locale, "footer.newsletterHeading")) },
    { english: "Email Address", text: newsletterEmailLabel(locale) },
    { english: "Submit", text: savedOr(contact.newsletterSubmitLabel, "Submit") },
    { english: "By signing up, I agree to receive KPD updates and accept the", text: savedOr(contact.newsletterNote, "By signing up, I agree to receive KPD updates and accept the") },
    { english: "privacy policy.", text: t(locale, "footer.privacyPolicy") },
    { english: "Terms of Use", text: savedOr(contact.footerTermsLabel, t(locale, "footer.terms")) },
    { english: "Privacy", text: savedOr(contact.footerPrivacyLabel, t(locale, "footer.privacyLink")) },
    { english: "Cookie Policy", text: savedOr(contact.footerCookiesLabel, t(locale, "footer.cookies")) },
    { english: "Kasumigaseki Properties Development © 2026", text: savedOr(contact.footerCopyright, t(locale, "footer.copyright")) },
  ];
}
