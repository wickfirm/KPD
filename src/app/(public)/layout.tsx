import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { db } from "@/lib/db";
import "./public.css";

/// Shared chrome for every migrated public route. The legacy directory is a
/// temporary static fallback and intentionally does not use this layout.
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let global: { email?: string; newsletterNote?: string } = {};
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "global" } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) global = setting.value as { email?: string; newsletterNote?: string };
  } catch {
    // A missing database must not make the static fallback unavailable.
  }
  return <div className="home-development-page"><SiteHeader /><main>{children}</main><SiteFooter email={global.email} newsletterNote={global.newsletterNote} /></div>;
}
