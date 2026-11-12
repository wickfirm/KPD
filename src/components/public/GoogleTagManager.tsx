import Script from "next/script";

/// KPD's Google Tag Manager container. NEXT_PUBLIC_GTM_ID can override it
/// (or set it to "off" to disable tracking) without a code change.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-W463GNF5";

/// Only real visitor traffic is sent: local dev and Vercel preview
/// deployments are skipped so they don't pollute the analytics data.
function gtmEnabled() {
  if (GTM_ID.toLowerCase() === "off" || !/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.VERCEL_ENV === "preview") return false;
  return true;
}

/// Standard GTM install: the loader script plus the <noscript> iframe fallback.
/// Rendered by every public route-group layout; the /admin CMS is not tracked.
export default function GoogleTagManager() {
  if (!gtmEnabled()) return null;
  return (
    <>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      <Script id="gtm-loader" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
    </>
  );
}
