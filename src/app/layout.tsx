import type { Metadata } from "next";
import { ORGANIZATION_ID, SITE_URL, WEBSITE_ID, organizationJsonLd } from "@/lib/site";
import { getGlobalSettings } from "@/lib/site-contact";
import "./globals.css";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const contact = await getGlobalSettings();
  const organization = { ...organizationJsonLd, ...(contact.email ? { email: contact.email } : {}) };
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {/* Warm up the third-party icon CDNs used by the public templates. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn-uicons.flaticon.com" crossOrigin="anonymous" />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, websiteJsonLd]) }}
        />
      </body>
    </html>
  );
}

