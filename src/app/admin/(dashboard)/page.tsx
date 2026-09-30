import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SavedBanner } from "@/components/admin/flash";

export const dynamic = "force-dynamic";

function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/// Friendly home screen: what needs attention, what you can start right away,
/// and a plain-language peek at the latest team activity.
export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);
  const isAdmin = user.role === "ADMIN";

  const [publishedArticles, draftArticles, projects, pendingRss, newSubmissions, failedSyncs, recentActivity] = await Promise.all([
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "DRAFT" } }),
    db.project.count(),
    db.rssItem.count({ where: { status: "PENDING" } }),
    db.contactSubmission.count({ where: { status: "NEW" } }),
    db.contactSubmission.count({ where: { status: "FAILED" } }),
    isAdmin ? db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }) : Promise.resolve([]),
  ]);

  const attention = [
    ...(newSubmissions ? [{ label: `${newSubmissions} new message${newSubmissions === 1 ? "" : "s"} from the website`, href: "/admin/submissions", cta: "Open messages" }] : []),
    ...(pendingRss ? [{ label: `${pendingRss} press item${pendingRss === 1 ? "" : "s"} waiting for review`, href: "/admin/rss", cta: "Review news" }] : []),
    ...(failedSyncs ? [{ label: `${failedSyncs} submission${failedSyncs === 1 ? "" : "s"} could not reach Salesforce`, href: "/admin/submissions", cta: "Inspect" }] : []),
  ];

  const quickActions = [
    { title: "Write a news post", description: "Share an update, award or milestone on the site.", href: "/admin/articles/new" },
    { title: "Edit the homepage", description: "Hero video, introduction and gallery — live right away.", href: "/admin/pages/home" },
    { title: "Upload photos", description: "Add images to the library, then copy links into any page.", href: "/admin/media" },
    { title: "Update a development", description: "Copy, galleries and floor plans per project.", href: "/admin/projects" },
  ];

  return (
    <>
      <div className="cms-page-heading cms-dashboard-heading">
        <div>
          <span className="cms-eyebrow">KPD editorial studio</span>
          <h1>{greeting(new Date())}, {user.name.split(" ")[0]}.</h1>
          <p>Here is where the website stands today — and what you can do next.</p>
        </div>
      </div>
      <SavedBanner params={params} />

      {attention.length ? (
        <div className="cms-card cms-attention">
          <span className="cms-eyebrow">Needs attention</span>
          <ul>
            {attention.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <Link className="cms-btn cms-btn--ghost cms-btn--small" href={item.href}>{item.cta}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="cms-grid cms-stat-grid">
        <div className="cms-card cms-stat"><strong>{publishedArticles}</strong><span>Published articles</span>{draftArticles ? <small>{draftArticles} draft{draftArticles === 1 ? "" : "s"} waiting</small> : null}</div>
        <div className="cms-card cms-stat"><strong>{projects}</strong><span>Developments</span></div>
        <div className="cms-card cms-stat"><strong>{pendingRss}</strong><span>Press items to review</span></div>
        <div className="cms-card cms-stat"><strong>{newSubmissions}</strong><span>New messages</span></div>
        {failedSyncs ? <div className="cms-card cms-stat cms-stat--warn"><strong>{failedSyncs}</strong><span>Failed Salesforce syncs</span></div> : null}
      </div>

      <div className="cms-card cms-quick-actions">
        <span className="cms-eyebrow">Start here</span>
        <h2>Quick actions</h2>
        <div className="cms-quick-grid">
          {quickActions.map((action) => (
            <Link className="cms-quick-card" key={action.href} href={action.href}>
              <strong>{action.title}</strong>
              <span>{action.description}</span>
              <em aria-hidden="true">→</em>
            </Link>
          ))}
        </div>
      </div>

      {isAdmin ? (
        <div className="cms-card cms-recent-activity">
          <span className="cms-eyebrow">Latest team activity</span>
          <h2>Recently in the CMS</h2>
          {recentActivity.length ? (
            <ul className="cms-activity-mini">
              {recentActivity.map((entry) => (
                <li key={entry.id}>
                  <span className="cms-activity-mini__who">{entry.actorName || entry.actorEmail || "System"}</span>
                  <span>{entry.summary}</span>
                  <time>{entry.createdAt.toLocaleString("en-GB")}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cms-muted">Nothing logged yet — changes you make will appear here.</p>
          )}
          <p className="cms-muted"><Link href="/admin/activity">See the full activity log →</Link></p>
        </div>
      ) : null}

      <div className="cms-card cms-help">
        <span className="cms-eyebrow">Good to know</span>
        <h2>Nothing here can break the website</h2>
        <ul>
          <li><strong>Drafts are private.</strong> Only “Published” content appears on the public site.</li>
          <li><strong>Every save keeps a snapshot.</strong> Open “Version history” on any page to roll back.</li>
          <li><strong>Pictures first.</strong> Upload once in Media, then reuse the link anywhere.</li>
        </ul>
      </div>
    </>
  );
}

