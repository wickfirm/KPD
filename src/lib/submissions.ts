/// Structured enquiry details. Every public form (the Contact page's five
/// inquiry panes, the booking modal, the floor-plan modal, the newsletter box)
/// sends its answers as an ordered list of { label, value } pairs, stored in
/// contact_submissions.details so the Messages screen can show exactly the
/// fields the visitor filled in instead of one flattened text blob.

export type SubmissionDetail = { label: string; value: string };

const MAX_DETAILS = 40;
const MAX_LABEL = 80;
const MAX_VALUE = 2000;

export function sanitizeDetails(raw: unknown): SubmissionDetail[] {
  if (!Array.isArray(raw)) return [];
  const out: SubmissionDetail[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const label = String((item as Record<string, unknown>).label ?? "").trim().slice(0, MAX_LABEL);
    const value = String((item as Record<string, unknown>).value ?? "").trim().slice(0, MAX_VALUE);
    if (label && value) out.push({ label, value });
    if (out.length >= MAX_DETAILS) break;
  }
  return out;
}

/// Details as stored in the JSON column (tolerant of anything unexpected).
export function readDetails(stored: unknown): SubmissionDetail[] {
  return sanitizeDetails(stored);
}

/// "Label: value" lines, for the Salesforce Description and plain-text views.
export function formatDetails(details: SubmissionDetail[]): string {
  return details.map((detail) => `${detail.label}: ${detail.value}`).join("\n");
}

/// The text mirrored to Salesforce: the visitor's message plus every detail.
export function leadDescription(message: string, details: SubmissionDetail[]): string {
  return [message, formatDetails(details)].filter(Boolean).join("\n\n");
}
