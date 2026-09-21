import Link from "next/link";
import { db } from "@/lib/db";
import StaticPageForm from "../pages/page-form";

export const dynamic = "force-dynamic";

/// A dedicated entry point makes the most frequently edited company page
/// discoverable without requiring editors to search the generic Pages library.
export default async function AdminAboutPage() {
  const page = await db.staticPage.findUnique({ where: { slug: "about" } });
  const defaults = page
    ? { ...page, content: page.content as { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string }[] }
    : { title: "About us", slug: "about", status: "PUBLISHED", content: [] };
  return <><div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}><div><span className="cms-eyebrow">Company profile</span><h1 style={{ margin: "7px 0 0" }}>About us</h1></div><Link className="cms-btn cms-btn--ghost" href="/about" target="_blank">View page</Link></div><div className="cms-card"><StaticPageForm defaults={defaults} /></div></>;
}
