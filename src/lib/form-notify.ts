// ── Form notification email (Resend) ─────────────────────────────────────────
// Every public form posts to /api/contact, which saves the submission first.
// Afterwards the team is emailed a copy at the recipient chosen for that form
// in Site settings → Form delivery routing (blank → the default recipient).
// Recipients come only from the CMS, never from the visitor's request, so the
// endpoint cannot be used to send mail to arbitrary addresses.

import { recipientFor, type FormRecipientKey, type GlobalSettings } from "@/lib/site-contact";

export const FORM_RECIPIENT_KEYS: readonly FormRecipientKey[] = ["enquiry", "booking", "floorPlan", "calculator", "newsletter", "brochure", "sevenXSeven", "contactSales", "contactCustomer", "contactChannel", "contactCareers", "contactPress"];

/// Forms that do not name their routing key are matched by enquiry type.
const KEY_BY_INQUIRY_TYPE: Record<string, FormRecipientKey> = {
  "brochure request": "brochure",
  "seven x seven residence": "sevenXSeven",
  "booking request": "booking",
  "floor plan request": "floorPlan",
  "newsletter signup": "newsletter",
};

export function notifyKeyFor(input: { recipientKey?: string | null; inquiryType?: string | null }): FormRecipientKey {
  const requested = (input.recipientKey || "").trim();
  if ((FORM_RECIPIENT_KEYS as readonly string[]).includes(requested)) return requested as FormRecipientKey;
  return KEY_BY_INQUIRY_TYPE[(input.inquiryType || "").trim().toLowerCase()] ?? "enquiry";
}

const EMAIL = /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/;

/// The addresses configured for a form; a field may hold several, separated by commas.
export function notificationRecipients(settings: GlobalSettings, key: FormRecipientKey): string[] {
  const list = recipientFor(settings, key).split(/[,;\s]+/).map((address) => address.trim()).filter((address) => EMAIL.test(address));
  return [...new Set(list)].slice(0, 10);
}

/// Resend's shared test sender, used until kpd.ae is verified in Resend and
/// RESEND_FROM is set. It can only deliver to the Resend account's own address.
export const RESEND_DEFAULT_FROM = "Kasumigaseki Properties Development <onboarding@resend.dev>";

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export type NotificationInput = {
  inquiryType: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  interest: string | null;
  sourcePage: string | null;
  details: { label: string; value: string }[];
  submissionId: string;
  adminUrl?: string;
};

/// Subject, HTML and plain-text bodies for the team's copy of a submission.
export function buildNotificationEmail(input: NotificationInput) {
  const type = input.inquiryType || "Website enquiry";
  const subject = clean(`New ${type} from ${input.name}`).slice(0, 200);
  const seen = new Set<string>();
  const rows: [string, string][] = [];
  const add = (label: string, value: string | null | undefined) => {
    const text = (value ?? "").trim();
    const id = label.toLowerCase();
    if (!text || seen.has(id) || id === "delivery recipient" || id === "email notification") return;
    seen.add(id);
    rows.push([label, text]);
  };
  add("Form", type);
  add("Name", input.name);
  add("Email", input.email);
  add("Phone", input.phone);
  add("Interest", input.interest);
  for (const detail of input.details) add(detail.label, detail.value);
  add("Message", input.message);
  add("Page", input.sourcePage);
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n") + (input.adminUrl ? `\n\nOpen in the CMS: ${input.adminUrl}` : "");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#14181c">`
    + `<p style="font-size:16px;margin:0 0 16px"><strong>${escapeHtml(subject)}</strong></p>`
    + `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">`
    + rows.map(([label, value]) => `<tr><td style="vertical-align:top;color:#6b7075;white-space:nowrap">${escapeHtml(label)}</td><td style="vertical-align:top">${escapeHtml(value).replace(/\r?\n/g, "<br>")}</td></tr>`).join("")
    + `</table>`
    + (input.adminUrl ? `<p style="margin-top:20px"><a href="${escapeHtml(input.adminUrl)}">Open in the CMS</a></p>` : "")
    + `<p style="margin-top:20px;color:#6b7075;font-size:12px">Saved in the CMS under Enquiries (reference ${escapeHtml(input.submissionId)}). Reply to this email to answer ${escapeHtml(input.name)} directly.</p>`
    + `</div>`;
  return { subject, text, html };
}

/// Sends one email through the Resend API. Throws on failure.
export async function sendWithResend(input: { to: string[]; subject: string; html: string; text: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || RESEND_DEFAULT_FROM;
  if (!apiKey) throw new Error("Resend is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, text: input.text, ...(input.replyTo ? { reply_to: input.replyTo } : {}) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`);
  }
  const result = await response.json().catch(() => ({})) as { id?: string };
  return { id: result.id ?? "" };
}

function clean(value: string) {
  return value.replace(/[\r\n<>]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
