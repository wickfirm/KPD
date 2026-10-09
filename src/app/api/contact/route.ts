import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushLeadToSalesforce } from "@/lib/salesforce";
import { leadDescription, sanitizeDetails } from "@/lib/submissions";

/// Public contact / booking form endpoint (Salesforce dual-write, Clause 2).
/// Always persists locally; then mirrors to Salesforce as a Lead.
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
  // Every field the visitor filled in, as ordered { label, value } pairs.
  const details = sanitizeDetails(payload.details);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "name, email and message are required." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  let submission;
  try {
    submission = await db.contactSubmission.create({
      data: { name, email, phone, message, interest, sourcePage, inquiryType, details: details.length ? details : undefined },
    });
  } catch (err) {
    // If the inquiryType/details columns are not in the database yet (migration
    // pending), keep the enquiry anyway: details are folded into the message.
    console.error("[api/contact] structured insert failed, retrying without the new columns:", err);
    try {
      submission = await db.contactSubmission.create({
        data: { name, email, phone, message: leadDescription(message, details), interest, sourcePage },
      });
    } catch (fallbackError) {
      console.error("[api/contact] database error:", fallbackError);
      return NextResponse.json(
        { error: "We could not save your enquiry right now. Please try again shortly." },
        { status: 503 },
      );
    }
  }

  // Dual-write: mirror to Salesforce, recording the outcome.
  try {
    const salesforceId = await pushLeadToSalesforce({ name, email, phone, message: leadDescription(message, details), interest, sourcePage });
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

  return NextResponse.json({ ok: true, id: submission.id }, { status: 201 });
}
