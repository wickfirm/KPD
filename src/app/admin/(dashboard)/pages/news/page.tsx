import Link from "next/link";
import NewsForm from "./news-form";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";
import { SectionVisibilityPanel } from "@/components/admin/section-visibility-panel";
import { pageSections } from "@/lib/section-visibility";
import { loadNewsListingCopy } from "@/lib/news-listing";
import { resolvePressItems } from "@/lib/press-coverage";

export const dynamic = "force-dynamic";

/// Pages → News: the copy around the article list on /news. The articles
/// themselves are written under News & Blog.
export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [flash, copy] = await Promise.all([searchParams, loadNewsListingCopy()]);
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">/news</span>
        <h1>News</h1>
        <p>The hero, button labels, press coverage and press band around the article list. Articles are written under <Link href="/admin/articles">News &amp; Blog</Link>. Saving makes it live immediately.</p>
      </div>
      <Link className="cms-btn cms-btn--ghost" href="/news" target="_blank">View page</Link>
    </div>
    <SavedBanner params={flash} />
    <EditorShell>
      <SectionVisibilityPanel page="news" sections={pageSections.news} returnTo="/admin/pages/news" />
      <div className="cms-card"><NewsForm copy={copy} coverage={resolvePressItems(copy.coverage)} /></div>
    </EditorShell>
  </>;
}
