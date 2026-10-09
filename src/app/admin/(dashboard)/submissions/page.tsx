import Link from "next/link";
import { db } from "@/lib/db";
import { SavedBanner } from "@/components/admin/flash";
import { readDetails, type SubmissionDetail } from "@/lib/submissions";
import { retrySubmissionSync } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  interest: string | null;
  sourcePage: string | null;
  inquiryType: string | null;
  details: SubmissionDetail[];
  status: string;
  salesforceId: string | null;
  syncError: string | null;
  createdAt: Date;
};

/// Rows with the structured columns; if the database has not been migrated yet
/// (inquiryType / details), fall back to the original columns so the screen
/// keeps working and older enquiries stay readable.
async function loadSubmissions(): Promise<Row[]> {
  try {
    const rows = await db.contactSubmission.findMany({ orderBy: [{ createdAt: "desc" }], take: 200 });
    return rows.map((row) => ({ ...row, details: readDetails(row.details) }));
  } catch {
    const rows = await db.contactSubmission.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      select: { id: true, name: true, email: true, phone: true, message: true, interest: true, sourcePage: true, status: true, salesforceId: true, syncError: true, createdAt: true },
    });
    return rows.map((row) => ({ ...row, inquiryType: null, details: [] }));
  }
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const flash = await searchParams;
  const all = await loadSubmissions();
  const typeFilter = first(flash.type);
  const statusFilter = first(flash.status);
  const types = [...new Set(all.map((row) => row.inquiryType).filter((type): type is string => Boolean(type)))];
  const rows = all.filter((row) => (!typeFilter || row.inquiryType === typeFilter) && (!statusFilter || row.status === statusFilter));
  const link = (type: string, status: string) => `/admin/submissions${type || status ? `?${[type ? `type=${encodeURIComponent(type)}` : "", status ? `status=${status}` : ""].filter(Boolean).join("&")}` : ""}`;

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Audience</span>
          <h1>Messages</h1>
          <p>Enquiries from the website&apos;s forms, with every field the visitor filled in. Each message is stored here first; use “Retry sync” to deliver any that Salesforce has not received yet.</p>
        </div>
      </div>

      <SavedBanner params={flash} />

      <div className="cms-filter-row" aria-label="Filter messages">
        <Link className={`cms-chip${!typeFilter ? " is-active" : ""}`} href={link("", statusFilter)}>All forms <span>{all.length}</span></Link>
        {types.map((type) => <Link key={type} className={`cms-chip${typeFilter === type ? " is-active" : ""}`} href={link(type, statusFilter)}>{type} <span>{all.filter((row) => row.inquiryType === type).length}</span></Link>)}
        <span className="cms-filter-row__divider" aria-hidden="true" />
        {["", "NEW", "SYNCED", "FAILED"].map((status) => <Link key={status || "any"} className={`cms-chip${statusFilter === status ? " is-active" : ""}`} href={link(typeFilter, status)}>{status ? status.charAt(0) + status.slice(1).toLowerCase() : "Any status"}</Link>)}
      </div>

      <div className="cms-submissions">
        {rows.map((row) => {
          const lines: SubmissionDetail[] = [
            { label: "Name", value: row.name },
            { label: "Email", value: row.email },
            ...(row.phone ? [{ label: "Phone", value: row.phone }] : []),
            ...(row.interest ? [{ label: "Interest", value: row.interest }] : []),
            ...row.details,
            ...(row.sourcePage ? [{ label: "Submitted from", value: row.sourcePage }] : []),
          ];
          return (
            <details className="cms-submission" key={row.id}>
              <summary>
                <span className="cms-badge cms-badge--type">{row.inquiryType ?? "Enquiry"}</span>
                <span className="cms-submission__who"><strong>{row.name}</strong><small>{row.email}{row.phone ? ` · ${row.phone}` : ""}</small></span>
                <span className="cms-submission__interest">{row.interest ?? "—"}</span>
                <span className="cms-submission__when">{row.createdAt.toLocaleString("en-GB")}</span>
                <span className={`cms-badge cms-badge--${row.status}`} title={row.syncError ?? undefined}>{row.status}</span>
              </summary>
              <div className="cms-submission__body">
                <dl className="cms-submission__fields">
                  {lines.map((line, index) => (
                    <div key={`${line.label}-${index}`}>
                      <dt>{line.label}</dt>
                      <dd>{line.label === "Email" ? <a href={`mailto:${line.value}`}>{line.value}</a> : /^https?:\/\//.test(line.value) ? <a href={line.value} target="_blank" rel="noreferrer">{line.value}</a> : line.value}</dd>
                    </div>
                  ))}
                </dl>
                {row.message ? <><h4 className="cms-subheading">Message</h4><p className="cms-submission__message">{row.message}</p></> : null}
                <div className="cms-submission__footer">
                  <span className="cms-muted">Salesforce: {row.salesforceId ?? "not synced"}{row.syncError ? ` — ${row.syncError}` : ""}</span>
                  {row.status !== "SYNCED" ? (
                    <form action={retrySubmissionSync}>
                      <input type="hidden" name="id" value={row.id} />
                      <button className="cms-btn cms-btn--ghost cms-btn--small" type="submit">Retry sync</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </details>
          );
        })}
        {rows.length === 0 ? <p className="cms-empty">{all.length ? "No messages match this filter." : "No messages yet — new enquiries from the website will appear here."}</p> : null}
      </div>
    </>
  );
}
