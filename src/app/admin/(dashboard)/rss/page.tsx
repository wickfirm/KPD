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
      <h1>RSS moderation queue</h1>
      <p style={{ color: "#5b6675", fontSize: 14 }}>
        Matching items from Google News &amp; GDELT arrive here (Vercel Cron ingests
        every 30 minutes). Approve to publish as a News article, or reject.
      </p>

      {items.length === 0 && (
        <div className="cms-card">Queue is empty. Nothing awaiting review.</div>
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
