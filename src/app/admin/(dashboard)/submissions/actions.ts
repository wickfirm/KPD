"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { pushLeadToSalesforce } from "@/lib/salesforce";

/// Re-attempt the Salesforce mirror for one stored enquiry (NEW or FAILED).
/// Enquiries are always persisted locally first, so nothing is lost while
/// Salesforce credentials are pending — once access is provided, any admin
/// can replay the backlog row by row from the Messages screen.
export async function retrySubmissionSync(formData: FormData) {
  const { session } = await requireUser();
  const id = String(formData.get("id") || "");

  const submission = await db.contactSubmission.findUnique({ where: { id } });
  if (!submission) {
    redirect(`/admin/submissions?error=${encodeURIComponent("That message no longer exists.")}`);
  }
  if (submission.status === "SYNCED") {
    redirect(`/admin/submissions?error=${encodeURIComponent("This message is already synced to Salesforce.")}`);
  }

  let synced = false;
  let failure = "";
  try {
    const salesforceId = await pushLeadToSalesforce({
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      message: submission.message,
      interest: submission.interest,
      sourcePage: submission.sourcePage,
    });
    await db.contactSubmission.update({
      where: { id },
      data: { status: "SYNCED", salesforceId, syncedAt: new Date(), syncError: null },
    });
    synced = true;
  } catch (err) {
    failure = (err as Error).message.slice(0, 500);
    await db.contactSubmission.update({
      where: { id },
      data: { status: "FAILED", syncError: failure },
    });
  }

  revalidatePath("/admin/submissions");
  if (synced) {
    await logActivity({ action: "submission.retry", session, entityType: "CONTACT_SUBMISSION", entityId: id, summary: `Synced stored enquiry from ${submission.email} to Salesforce` });
    redirect("/admin/submissions?synced=1");
  }
  await logActivity({ action: "submission.retry", session, entityType: "CONTACT_SUBMISSION", entityId: id, summary: `Salesforce retry failed for ${submission.email}` });
  redirect(`/admin/submissions?error=${encodeURIComponent(`Salesforce sync failed — the message stays stored here: ${failure.slice(0, 200)}`)}`);
}
