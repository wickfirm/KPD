import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { activityActions, activityActionLabels } from "@/lib/activity";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/// Read-only audit trail (ADMIN only). Filterable by action, paged 50 at a time.
export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const actionParam = typeof params.action === "string" && (activityActions as readonly string[]).includes(params.action) ? params.action : null;
  const page = Math.max(1, Number(params.page) || 1);

  const where = actionParam ? { action: actionParam } : {};
  const [entries, total] = await Promise.all([
    db.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.activityLog.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageLink = (target: { action?: string | null; page?: number }) => {
    const query = new URLSearchParams();
    if (target.action) query.set("action", target.action);
    if (target.page && target.page > 1) query.set("page", String(target.page));
    const qs = query.toString();
    return `/admin/activity${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Administration</span>
          <h1>Activity log</h1>
          <p>Every change made in the CMS — who did it and when. Entries can never be edited or removed from here.</p>
        </div>
        <span className="cms-section-count">{total} entries</span>
      </div>

      <div className="cms-filter-row" role="navigation" aria-label="Filter by type">
        <Link className={`cms-chip${!actionParam ? " is-active" : ""}`} href={pageLink({})}>Everything</Link>
        {(Object.keys(activityActionLabels) as (keyof typeof activityActionLabels)[]).map((key) => (
          <Link key={key} className={`cms-chip${actionParam === key ? " is-active" : ""}`} href={pageLink({ action: key })}>
            {activityActionLabels[key]}
          </Link>
        ))}
      </div>

      {entries.length ? (
        <table className="cms-table">
          <thead>
            <tr><th>When</th><th>Who</th><th>What</th></tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="cms-nowrap">{entry.createdAt.toLocaleString("en-GB")}</td>
                <td>{entry.actorName || entry.actorEmail || <span className="cms-muted">System</span>}</td>
                <td>
                  <span className={`cms-badge cms-action--${entry.action.split(".")[0]}`}>{entry.action}</span>
                  <span className="cms-activity-summary">{entry.summary}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="cms-card cms-empty">
          <h2>Nothing logged here yet</h2>
          <p>Once you or your team save pages, upload media or sign in, the history shows up here.</p>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="cms-pagination">
          {page > 1 ? <Link className="cms-btn cms-btn--ghost cms-btn--small" href={pageLink({ action: actionParam, page: page - 1 })}>← Newer</Link> : null}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages ? <Link className="cms-btn cms-btn--ghost cms-btn--small" href={pageLink({ action: actionParam, page: page + 1 })}>Older →</Link> : null}
        </div>
      ) : null}
    </>
  );
}
