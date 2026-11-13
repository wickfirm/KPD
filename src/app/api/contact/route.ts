import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushLeadToSalesforce, SALESFORCE_LEAD_HOLD_NOTE, shouldMirrorSubmissionToSalesforce } from "@/lib/salesforce";
import { leadDescription, sanitizeDetails } from "@/lib/submissions";
import { getGlobalSettings } from "@/lib/site-contact";
import { buildNotificationEmail, notificationRecipients, notifyKeyFor, resendConfigured, sendWithResend } from "@/lib/form-notify";
import { brochureDownload } from "@/lib/brochure-download";
import { parseProjectChrome, projectChromeKey } from "@/lib/project-chrome";

/// Public contact / booking form endpoint (Salesforce dual-write, Clause 2).
/// Always persists locally. Confirmed enquiry types then mirror to Salesforce as a Lead.
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim() || null;
  const message = String(payload.message || "").trim();
  const interest = String(payload.interest || "").trim() || null;
  const sourcePage = String(payload.sourcePage || "").trim() || null;
  const inquiryType = String(payload.inquiryType || "").trim().slice(0, 80) || null;
  const requestedKey = String(payload.recipientKey || "");
  const settings = await getGlobalSettings();
  // Routing comes from Site settings only. Forms that do not name a key
  // (brochure, seven x seven landing) are matched by their enquiry type.
  const notifyKey = notifyKeyFor({ recipientKey: requestedKey, inquiryType });
  const notifyTo = notificationRecipients(settings, notifyKey);
  const fromClient = String(payload.recipient || "").trim();
  const recipient = (notifyTo.join(", ") || fromClient).slice(0, 320);
  // Every field the visitor filled in, as ordered { label, value } pairs.
  const details = sanitizeDetails(payload.details);
  if (recipient && /^[^@\s]+@[^@\s]+\.[^@\s]+/.test(recipient)) details.push({ label: "Delivery recipient", value: recipient });

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "name, email and message are required." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Newsletter, job, and customer-service forms stay in Messages until that
  // lead list is confirmed. Every other enquiry is mirrored to Salesforce.
  const mirrorToSalesforce = shouldMirrorSubmissionToSalesforce({ recipientKey: requestedKey, inquiryType });
  const propertyInterestId = String(payload.propertyInterestId || "").trim() || null;
  const held = mirrorToSalesforce ? {} : { syncError: SALESFORCE_LEAD_HOLD_NOTE };

  let submission;
  try {
    submission = await db.contactSubmission.create({
      data: { name, email, phone, message, interest, sourcePage, inquiryType, details: details.length ? details : undefined, ...held },
    });
  } catch (err) {
    // If the inquiryType/details columns are not in the database yet (migration
    // pending), keep the enquiry anyway: details are folded into the message.
    console.error("[api/contact] structured insert failed, retrying without the new columns:", err);
    try {
      submission = await db.contactSubmission.create({
        data: { name, email, phone, message: leadDescription(message, details), interest, sourcePage, ...held },
      });
    } catch (fallbackError) {
      console.error("[api/contact] database error:", fallbackError);
      return NextResponse.json(
        { error: "We could not save your enquiry right now. Please try again shortly." },
        { status: 503 },
      );
    }
  }

  if (mirrorToSalesforce) {
    // Dual-write: mirror to Salesforce, recording the outcome.
    try {
      const salesforceId = await pushLeadToSalesforce({
        name,
        email,
        phone,
        message: leadDescription(message, details),
        interest,
        propertyInterestId,
        sourcePage,
        inquiryType,
      });
      await db.contactSubmission.update({
        where: { id: submission.id },
        data: { status: "SYNCED", salesforceId, syncedAt: new Date(), syncError: null },
      });
    } catch (err) {
      await db.contactSubmission.update({
        where: { id: submission.id },
        data: { status: "FAILED", syncError: (err as Error).message.slice(0, 500) },
      });
      // The lead is safely stored locally — respond success; sync retries later.
    }
  }

  // Brochure pop-up: the visitor downloads the file straight away (no email to
  // the visitor). Without an uploaded file the team follows up from the
  // notification below.
  let download: { url: string; fileName: string; attachment: boolean } | null = null;
  if (inquiryType === "Brochure request") {
    const projectSlug = String(payload.projectSlug || "").trim();
    const project = projectSlug ? await db.project.findUnique({ where: { slug: projectSlug }, select: { id: true } }).catch(() => null) : null;
    const chromeRow = project ? await db.siteSetting.findUnique({ where: { key: projectChromeKey(project.id) } }).catch(() => null) : null;
    const brochureUrl = parseProjectChrome(chromeRow?.value).brochureUrl ?? "";
    if (project && brochureUrl) download = await brochureDownload({ origin: req.nextUrl.origin, url: brochureUrl, projectSlug });
  }

  // Team copy by email (Resend). The submission is already saved, so a mail
  // failure never fails the request; the outcome is noted on the submission.
  if (settings.formEmailsEnabled !== false && notifyTo.length && resendConfigured()) {
    let outcome: string;
    try {
      const mail = buildNotificationEmail({ inquiryType, name, email, phone, message, interest, sourcePage, details, submissionId: submission.id, adminUrl: new URL("/admin/submissions", req.nextUrl.origin).toString() });
      await sendWithResend({ to: notifyTo, ...mail, replyTo: email });
      outcome = `Sent to ${notifyTo.join(", ")}`;
    } catch (error) {
      console.error("[api/contact] notification email failed:", error);
      outcome = `Not sent: ${(error as Error).message}`.slice(0, 300);
    }
    await db.contactSubmission.update({ where: { id: submission.id }, data: { details: [...details, { label: "Email notification", value: outcome }] } }).catch(() => null);
  }

  return NextResponse.json({ ok: true, id: submission.id, download }, { status: 201 });
}
