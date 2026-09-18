import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [articles, projects, pages, pendingRss, newSubmissions, failedSyncs] = await Promise.all([
    db.article.count(),
    db.project.count(),
    db.staticPage.count(),
    db.rssItem.count({ where: { status: "PENDING" } }),
    db.contactSubmission.count({ where: { status: "NEW" } }),
    db.contactSubmission.count({ where: { status: "FAILED" } }),
  ]);

  const stats = [
    { label: "Articles (News & Blog)", value: articles },
    { label: "Developments", value: projects },
    { label: "Editorial pages", value: pages },
    { label: "RSS items awaiting review", value: pendingRss },
    { label: "New form submissions", value: newSubmissions },
    { label: "Failed Salesforce syncs", value: failedSyncs },
  ];

  return (
    <>
      <div className="cms-page-heading cms-dashboard-heading"><div><span className="cms-eyebrow">KPD editorial studio</span><h1>Good to see you.</h1><p>A clear view of what needs attention across the site.</p></div></div>
      <div className="cms-grid cms-stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="cms-card cms-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="cms-card cms-quick-actions">
        <span className="cms-eyebrow">Start here</span><h2>Quick actions</h2>
        <div className="cms-actions">
          <Link className="cms-btn" href="/admin/articles/new">
            Write an article
          </Link>
          <Link className="cms-btn cms-btn--ghost" href="/admin/rss">
            Review RSS queue ({pendingRss})
          </Link>
          <Link className="cms-btn cms-btn--ghost" href="/admin/pages">
            Manage pages
          </Link>
          <Link className="cms-btn cms-btn--ghost" href="/" target="_blank">
            View current site
          </Link>
        </div>
      </div>
    </>
  );
}
