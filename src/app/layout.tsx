import type { Metadata } from "next";
import { SITE_URL, organizationJsonLd } from "@/lib/site";
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
  name: "Kasumigaseki Properties Development",
  url: SITE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd]) }}
        />
      </body>
    </html>
  );
}

