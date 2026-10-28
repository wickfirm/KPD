import type { Metadata } from "next";
import { ORGANIZATION_ID, SITE_URL, WEBSITE_ID, organizationJsonLd } from "@/lib/site";
import { getGlobalSettings } from "@/lib/site-contact";
import "./globals.css";

/// Root-level CMS typography and organisation details must not be frozen into
/// a static parent layout while public pages update underneath it.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
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
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Kasumigaseki Properties Development",
  url: SITE_URL,
  inLanguage: "en",
  publisher: { "@id": ORGANIZATION_ID },
};

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
  const contact = await getGlobalSettings();
  const organization = { ...organizationJsonLd, ...(contact.email ? { email: contact.email } : {}) };
  const cmsTypography = typographyCss(contact.typography);
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {/* Warm up the third-party icon CDNs used by the public templates. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn-uicons.flaticon.com" crossOrigin="anonymous" />
        {cmsTypography ? <style dangerouslySetInnerHTML={{ __html: cmsTypography }} /> : null}
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, websiteJsonLd]) }}
        />
      </body>
    </html>
  );
}

