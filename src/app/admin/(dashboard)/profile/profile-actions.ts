"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { passwordProblem } from "@/lib/password-rules";

export type ProfileFormState = { error?: string; ok?: string };

/// Update the signed-in user's own display name.
export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { session } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Enter your name." };

  await db.user.update({ where: { id: session.userId }, data: { name } });
  await logActivity({ action: "user.update", session, entityType: "USER", entityId: session.email, summary: `Updated their profile name to ${name}` });
  revalidatePath("/admin");
  revalidatePath("/admin/profile");
  return { ok: "Profile updated." };
}

/// Change your own password (current password required).
export async function changePassword(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { session } = await requireUser();
  const current = String(formData.get("current") || "");
  const next = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  const me = await db.user.findUnique({ where: { id: session.userId } });
  if (!me) return { error: "Account not found — sign in again." };

  if (!(await verifyPassword(current, me.passwordHash))) {
    return { error: "Your current password is not correct." };
  }
  if (next !== confirm) return { error: "The two new passwords do not match." };
  const passwordError = passwordProblem(next);
  if (passwordError) return { error: passwordError };
  if (await verifyPassword(next, me.passwordHash)) {
    return { error: "That is already your current password — choose a new one." };
  }

  await db.user.update({ where: { id: session.userId }, data: { passwordHash: await hashPassword(next), passwordChangedAt: new Date() } });
  await logActivity({ action: "user.password", session, entityType: "USER", entityId: session.email, summary: "Changed their own password" });
  revalidatePath("/admin/profile");
  return { ok: "Password changed. Use it next time you sign in." };
}
