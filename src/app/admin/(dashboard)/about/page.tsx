import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import StaticPageForm from "../pages/page-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import { editorSeoDefaults } from "@/lib/seo-store";
import { seoKey } from "@/lib/seo-overrides";
import { pageSeo } from "@/lib/seo";
import { restoreAboutTeamOnce } from "@/lib/about-team-restore";

export const dynamic = "force-dynamic";

/// A dedicated entry point makes the most frequently edited company page
/// discoverable without requiring editors to search the generic Pages library.
export default async function AdminAboutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  await restoreAboutTeamOnce();
  const [flash] = await Promise.all([searchParams]);
  const [page, seo] = await Promise.all([db.staticPage.findUnique({ where: { slug: "about" } }), editorSeoDefaults(seoKey("page", "about"), pageSeo.about)]);
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
    <EditorShell>
      <div className="cms-card"><StaticPageForm defaults={defaults} lockedSlug seo={seo} /></div>
      {page ? <VersionHistory entityType="STATIC_PAGE" entityId={page.id} entityLabel="About us" /> : null}
    </EditorShell>
  </>;
}
