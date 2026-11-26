import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ORGANIZATION_ID, SITE_URL, WEBSITE_ID, organizationJsonLd } from "@/lib/site";
import { getGlobalSettings } from "@/lib/site-contact";
import { getIsLocalePreview, getLocale, getPublishedLocales, getSwitcherShown } from "@/lib/locale";
import { DEFAULT_LOCALE, isRtl, type Locale } from "@/lib/locales";
import "./globals.css";

/// Root-level CMS typography and organisation details must not be frozen into
/// a static parent layout while public pages update underneath it.
export const dynamic = "force-dynamic";

/// The base metadata of every page; pageMetadata() (src/lib/seo.ts) adds each
/// page's own on top of it.
const baseMetadata: Metadata = {
  /// Anchors every relative OG/Twitter/canonical URL to the canonical host.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kasumigaseki Properties Development",
    template: "%s | Kasumigaseki Properties Development",
  },
  description:
    "Kasumigaseki Properties Development creates disciplined, long-horizon real estate destinations in Dubai.",
  openGraph: {
    type: "website",
    siteName: "Kasumigaseki Properties Development",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  /// Lets browsers and feed readers discover /rss.xml from any page.
  alternates: { types: { "application/rss+xml": [{ url: "/rss.xml", title: "KPD news and press" }] } },
};

/// A language that can be reached but is not offered in the switcher is there
/// to be looked at by address, not to be found: its pages are kept out of
/// search until the switcher is switched on with them. English, and an admin
/// preview, get the base metadata exactly as it is.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  if (locale === DEFAULT_LOCALE || (await getIsLocalePreview()) || (await getSwitcherShown())) return baseMetadata;
  return { ...baseMetadata, robots: { index: false, follow: true } };
}

const websiteJsonLd = (locale: Locale) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Kasumigaseki Properties Development",
  url: SITE_URL,
  inLanguage: locale,
  publisher: { "@id": ORGANIZATION_ID },
});

/// CMS typography accepts only CSS length values; keeping this narrow prevents
/// saved editorial values from becoming arbitrary CSS in the public document.
function safeLength(value?: string) {
  const trimmed = value?.trim() ?? "";
  return /^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em|%|vw|vh)|clamp\([0-9.%\sremvw,()+-]+\))$/i.test(trimmed) ? trimmed : "";
}

function typographyCss(typography: Awaited<ReturnType<typeof getGlobalSettings>>["typography"]) {
  const declarations = (style?: { fontSize?: string; fontWeight?: string; fontStyle?: string }) => [
    safeLength(style?.fontSize) ? `font-size:${safeLength(style?.fontSize)}` : "",
    style?.fontWeight === "bold" || style?.fontWeight === "normal" ? `font-weight:${style.fontWeight}` : "",
    style?.fontStyle === "italic" || style?.fontStyle === "normal" ? `font-style:${style.fontStyle}` : "",
  ].filter(Boolean).join(";");
  const headings = declarations(typography?.headings);
  const body = declarations(typography?.body);
  const ctas = declarations(typography?.ctas);
  if (!headings && !body && !ctas) return "";
  const scope = "body.home-development-page,body.single-project-page,body.invest-dubai-page,body.news-design-page,body.kpd-page,body.about-design-page,body.legacy-design-page";
  return `${headings ? `${scope} :is(h1,h2,h3,h4,h5,h6){${headings}}` : ""}${body ? `${scope} :is(p,li,figcaption,blockquote,.footer_link,.footer_links_title,.footer_legal_text,.form-label){${body}}` : ""}${ctas ? `${scope} :is(button,.btn-pill,.pdf-development-button,.pdf-dev-card span,.pdf-contact-copy a,.footer_form input[type=submit],.contact-submit){${ctas}}` : ""}`;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [contact, locale, preview] = await Promise.all([getGlobalSettings(), getLocale(), getIsLocalePreview()]);
  // A language the client has not switched on is not reachable. Only an admin
  // preview may show it, and only an unpublished language needs the lookup.
  if (locale !== DEFAULT_LOCALE && !preview && !(await getPublishedLocales()).includes(locale)) notFound();
  const organization = { ...organizationJsonLd, ...(contact.email ? { email: contact.email } : {}) };
  const cmsTypography = typographyCss(contact.typography);
  return (
    // English is marked up exactly as before; only a right-to-left page gets a dir.
    <html lang={locale} {...(isRtl(locale) ? { dir: "rtl" } : {})}>
      <head>
        {/* A language's own stylesheet comes after every other one. English pages load none of them. */}
        {locale === "ar" ? <link rel="stylesheet" href="/locales/ar.css" /> : null}
        {locale === "ja" ? <>
          <link rel="stylesheet" href="/fonts/noto-sans-jp/wght.css" />
          <link rel="stylesheet" href="/locales/ja.css" />
        </> : null}
      </head>
      <body suppressHydrationWarning>
        {/* Warm up the third-party icon CDNs used by the public templates. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn-uicons.flaticon.com" crossOrigin="anonymous" />
        {cmsTypography ? <style dangerouslySetInnerHTML={{ __html: cmsTypography }} /> : null}
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, websiteJsonLd(locale)]) }}
        />
      </body>
    </html>
  );
}

