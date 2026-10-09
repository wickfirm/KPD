import { db } from "@/lib/db";
import { reviewRssItem } from "../actions";

export const dynamic = "force-dynamic";

export default async function RssQueuePage() {
  const items = await db.rssItem.findMany({
    where: { status: "PENDING" },
    orderBy: [{ publishedAt: "desc" }],
    take: 100,
  });

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Audience</span>
          <h1>News inbox{items.length ? <span className="cms-section-count">{items.length} to review</span> : null}</h1>
          <p>Press mentions found automatically (Google News &amp; GDELT, checked every 30 minutes). Approve to publish as a News article, or reject to file away.</p>
        </div>
      </div>

      {items.length === 0 && (
        <div className="cms-card cms-empty">
          <h2>No items pending review</h2>
          <p>New press mentions land here automatically. You will see them the next time something is found.</p>
        </div>
      )}

      <div className="cms-row-list">
        {items.map((item) => (
          <article key={item.id} className="cms-review-card">
            <div className="cms-row-card__meta">
              <span className="cms-badge cms-badge--type">{item.source}</span>
              <span className="cms-muted">{item.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) ?? "unknown date"}</span>
            </div>
            <h2><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title} ↗</a></h2>
            {item.snippet ? <p className="cms-row-card__summary">{item.snippet}</p> : null}
            <div className="cms-actions">
              <form action={reviewRssItem}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="decision" value="APPROVE" />
                <button className="cms-btn cms-btn--small" type="submit">Approve &amp; publish</button>
              </form>
              <form action={reviewRssItem}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="decision" value="REJECT" />
                <button className="cms-btn cms-btn--ghost cms-btn--small" type="submit">Reject</button>
              </form>
              <a className="cms-btn cms-btn--outline cms-btn--small" href={item.url} target="_blank" rel="noopener noreferrer">Read original ↗</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
