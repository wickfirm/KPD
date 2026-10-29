import Link from "next/link";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import VersionHistory from "@/components/admin/version-history";
import { loadSxsContent } from "@/lib/sxs-content";
import SxsForm from "./sxs-form";

export const dynamic = "force-dynamic";

export default async function SevenXSevenEditor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [content, flash] = await Promise.all([loadSxsContent(), searchParams]);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">/seven-x-seven</span>
        <h1>seven x seven</h1>
        <p>Text, buttons, images and lists for the residence page. Uploads are stored in the media library. The development page at /developments/seven-x-seven is separate.</p>
      </div>
      <div className="cms-actions">
        <Link className="cms-btn cms-btn--ghost" href="/seven-x-seven" target="_blank">View page</Link>
      </div>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <div className="cms-card"><SxsForm content={content} /></div>
      <VersionHistory entityType="SXS_PAGE" entityId="sxs" entityLabel="seven x seven" />
    </EditorShell>
  </>;
}
