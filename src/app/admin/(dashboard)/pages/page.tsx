import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const pages = await db.staticPage.findMany({ orderBy: { updatedAt: "desc" } });
  return <>
    <div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}><div><h1 style={{ margin: 0 }}>Pages</h1><p className="cms-muted">Editorial content for template-backed company, investor, and legal pages.</p></div><Link className="cms-btn" href="/admin/pages/new">Create page</Link></div>
    {pages.length ? <table className="cms-table"><thead><tr><th>Page</th><th>URL</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{pages.map((page) => <tr key={page.id}><td>{page.title}</td><td>/{page.slug}</td><td><span className={`cms-badge cms-badge--${page.status}`}>{page.status}</span></td><td>{page.updatedAt.toLocaleDateString()}</td><td><Link className="cms-btn cms-btn--ghost" href={`/admin/pages/${page.id}`}>Edit</Link></td></tr>)}</tbody></table> : <div className="cms-card"><p>No pages have been created yet.</p></div>}
  </>;
}
