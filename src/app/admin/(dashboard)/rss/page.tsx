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
          <h1>News inbox</h1>
          <p>Press mentions found automatically (Google News &amp; GDELT, checked every 30 minutes). Approve to publish as a News article, or reject to file away.</p>
        </div>
      </div>

      {items.length === 0 && (
        <div className="cms-card cms-empty">
          <h2>No items pending review</h2>
          <p>New press mentions land here automatically. You will see them the next time something is found.</p>
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="cms-card">
          <strong>{item.title}</strong>
          <p style={{ fontSize: 13, color: "#5b6675" }}>
            {item.source} · {item.publishedAt?.toLocaleDateString("en-GB") ?? "unknown date"}
            {" · "}
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              open original
            </a>
          </p>
          {item.snippet ? <p style={{ fontSize: 14 }}>{item.snippet}</p> : null}
          <div className="cms-actions">
            <form action={reviewRssItem}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="decision" value="APPROVE" />
              <button className="cms-btn" type="submit">
                Approve &amp; publish
              </button>
            </form>
            <form action={reviewRssItem}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="decision" value="REJECT" />
              <button className="cms-btn cms-btn--ghost" type="submit">
                Reject
              </button>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
