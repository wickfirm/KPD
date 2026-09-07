import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [articles, projects, pendingRss, newSubmissions, failedSyncs] = await Promise.all([
    db.article.count(),
    db.project.count(),
    db.rssItem.count({ where: { status: "PENDING" } }),
    db.contactSubmission.count({ where: { status: "NEW" } }),
    db.contactSubmission.count({ where: { status: "FAILED" } }),
  ]);

  const stats = [
    { label: "Articles (News & Blog)", value: articles },
    { label: "Developments", value: projects },
    { label: "RSS items awaiting review", value: pendingRss },
    { label: "New form submissions", value: newSubmissions },
    { label: "Failed Salesforce syncs", value: failedSyncs },
  ];

  return (
    <>
      <h1>Dashboard</h1>
      <div className="cms-grid">
        {stats.map((s) => (
          <div key={s.label} className="cms-card cms-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="cms-card">
        <h2>Quick actions</h2>
        <div className="cms-actions">
          <Link className="cms-btn" href="/admin/articles/new">
            Write an article
          </Link>
          <Link className="cms-btn cms-btn--ghost" href="/admin/rss">
            Review RSS queue ({pendingRss})
          </Link>
          <Link className="cms-btn cms-btn--ghost" href="/legacy/index.html" target="_blank">
            View current site
          </Link>
        </div>
      </div>
    </>
  );
}
