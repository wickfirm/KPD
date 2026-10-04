import "./public.css";

/// Shared wrapper for the migrated public routes. Each page renders the
/// unified delivered shell itself (SiteShellHeader/Footer + DeliveredScripts)
/// so every soft navigation replaces the page tree cleanly.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-development-page">{children}</div>;
}
