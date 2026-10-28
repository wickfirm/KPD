import "./public.css";

/// CMS saves must appear on the next public request rather than after an ISR window.
export const dynamic = "force-dynamic";

/// Shared wrapper for the migrated public routes. Each page renders the
/// unified delivered shell itself (SiteShellHeader/Footer + DeliveredScripts)
/// so every soft navigation replaces the page tree cleanly.
/// No wrapper element: the delivered body classes are applied to <body> itself
/// before first paint (DeliveredBodyClass), so the DOM matches the client's HTML.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
