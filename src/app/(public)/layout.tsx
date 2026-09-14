import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import "./public.css";

/// Shared chrome for every migrated public route. The legacy directory is a
/// temporary static fallback and intentionally does not use this layout.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-development-page"><SiteHeader /><main>{children}</main><SiteFooter /></div>;
}
