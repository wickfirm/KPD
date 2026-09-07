import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const submissions = await db.contactSubmission.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  return (
    <>
      <h1>Form submissions</h1>
      <p style={{ color: "#5b6675", fontSize: 14 }}>
        Dual-write status of contact / booking submissions. NEW = awaiting Salesforce
        sync, SYNCED = mirrored to Salesforce, FAILED = will retry.
      </p>

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
              <td>{s.email}</td>
              <td>{s.interest ?? "—"}</td>
              <td>
                <span className={`cms-badge cms-badge--${s.status}`}>{s.status}</span>
              </td>
              <td style={{ fontSize: 12 }}>{s.salesforceId ?? "—"}</td>
            </tr>
          ))}
          {submissions.length === 0 && (
            <tr>
              <td colSpan={6}>No submissions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
