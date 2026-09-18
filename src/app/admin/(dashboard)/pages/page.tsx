import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const pages = await db.staticPage.findMany({ orderBy: { updatedAt: "desc" } });
  return <>
    <div className="cms-page-heading"><div><span className="cms-eyebrow">Editorial library</span><h1>Pages</h1><p>Company, investor, and legal pages managed from one calm editorial workspace.</p></div><Link className="cms-btn" href="/admin/pages/new">Create page</Link></div>
    {pages.length ? <div className="cms-collection">{pages.map((page) => <article className="cms-collection-card cms-collection-card--compact" key={page.id}><div className="cms-collection-card__main"><div><span className="cms-eyebrow">/{page.slug}</span><h2>{page.title}</h2><p>Last updated {page.updatedAt.toLocaleDateString("en-GB")}</p></div><span className={`cms-badge cms-badge--${page.status}`}>{page.status}</span></div><div className="cms-collection-card__actions"><Link className="cms-btn cms-btn--ghost" href={`/admin/pages/${page.id}`}>Open editor</Link></div></article>)}</div> : <div className="cms-card"><p>No pages have been created yet.</p></div>}
  </>;
}
