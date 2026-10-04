import { db } from "@/lib/db";
import { SavedBanner } from "@/components/admin/flash";
import { retrySubmissionSync } from "./actions";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const flash = await searchParams;
  const submissions = await db.contactSubmission.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Audience</span>
          <h1>Messages</h1>
          <p>Enquiries from the website's contact and booking forms. Every message is stored here first — nothing is lost while Salesforce access is pending. Once credentials are configured, use “Retry sync” to deliver any NEW or FAILED message; SYNCED = delivered.</p>
        </div>
      </div>

      <SavedBanner params={flash} />

      <table className="cms-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Name</th>
            <th>Email</th>
            <th>Interest</th>
            <th>Status</th>
            <th>Salesforce ID</th>
            <th>Sync</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td>{s.createdAt.toLocaleString("en-GB")}</td>
              <td>{s.name}</td>
              <td><a href={`mailto:${s.email}`}>{s.email}</a></td>
              <td>{s.interest ?? "—"}</td>
              <td>
                <span className={`cms-badge cms-badge--${s.status}`} title={s.syncError ?? undefined}>{s.status}</span>
                {s.syncError ? <small className="cms-muted" style={{ display: "block", maxWidth: 260, whiteSpace: "normal" }}>{s.syncError}</small> : null}
              </td>
              <td style={{ fontSize: 12 }}>{s.salesforceId ?? "—"}</td>
              <td>
                {s.status !== "SYNCED" ? (
                  <form action={retrySubmissionSync}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="cms-btn cms-btn--ghost cms-btn--small" type="submit">Retry sync</button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
          {submissions.length === 0 && (
            <tr>
              <td colSpan={7}>No messages yet — new enquiries from the website will appear here.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
