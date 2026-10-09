import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import StaticPageForm from "../pages/page-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";

export const dynamic = "force-dynamic";

/// A dedicated entry point makes the most frequently edited company page
/// discoverable without requiring editors to search the generic Pages library.
export default async function AdminAboutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const [flash] = await Promise.all([searchParams]);
  const page = await db.staticPage.findUnique({ where: { slug: "about" } });
  const defaults = page
    ? { ...page, content: page.content as { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string }[] }
    : { title: "About us", slug: "about", status: "PUBLISHED", content: [] };
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">Company profile · /about</span>
        <h1>About us</h1>
        <p>Mission, vision, the chairman's message and the executive team — the page investors read first.</p>
      </div>
      <Link className="cms-btn cms-btn--ghost" href="/about" target="_blank">View page</Link>
    </div>
    <SavedBanner params={flash} />
    <div className="cms-card"><StaticPageForm defaults={defaults} lockedSlug /></div>
    {page ? <VersionHistory entityType="STATIC_PAGE" entityId={page.id} entityLabel="About us" /> : null}
  </>;
}
