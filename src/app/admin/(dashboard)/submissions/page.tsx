import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
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
          <p>Enquiries from the website's contact and booking forms. Every message is stored here and mirrored to Salesforce (NEW = awaiting sync, SYNCED = delivered, FAILED = needs a look).</p>
        </div>
      </div>

      <table className="cms-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Name</th>
            <th>Email</th>
            <th>Interest</th>
            <th>Status</th>
            <th>Salesforce ID</th>
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
                <span className={`cms-badge cms-badge--${s.status}`}>{s.status}</span>
              </td>
              <td style={{ fontSize: 12 }}>{s.salesforceId ?? "—"}</td>
            </tr>
          ))}
          {submissions.length === 0 && (
            <tr>
              <td colSpan={6}>No messages yet — new enquiries from the website will appear here.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
