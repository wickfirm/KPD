"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { passwordProblem } from "@/lib/password-rules";

// ─────────────────────────────────────────────────────────────────────────────
// Team management (ADMIN only). Guards enforced in every action:
//  · you cannot delete or deactivate yourself
//  · the last active administrator cannot be deleted, demoted or deactivated
// Passwords: minimum 10 characters with at least one letter and one digit.
// ─────────────────────────────────────────────────────────────────────────────

export type UserFormState = { error?: string; ok?: string };

async function activeAdminCount() {
  return db.user.count({ where: { role: "ADMIN", isActive: true } });
}

function backToUsers(params: Record<string, string>): never {
  const query = new URLSearchParams(params).toString();
  redirect(`/admin/users${query ? `?${query}` : ""}`);
}

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const { session } = await requireRole(["ADMIN"]);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "EDITOR";

  if (!name) return { error: "Enter the person's name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address — it is the sign-in name." };
  const passwordError = passwordProblem(password);
  if (passwordError) return { error: passwordError };

  try {
    await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role },
    });
  } catch (err) {
    const msg = (err as Error).message;
    return { error: msg.includes("Unique") ? "That email already has an account." : "Could not create the account." };
  }

  await logActivity({ action: "user.create", session, entityType: "USER", entityId: email, summary: `Created ${role === "ADMIN" ? "administrator" : "editor"} account for ${name} (${email})` });
  revalidatePath("/admin/users");
  redirect(`/admin/users?created=${encodeURIComponent(name)}`);
}

export async function updateUserRole(formData: FormData) {
  const { session } = await requireRole(["ADMIN"]);
  const userId = String(formData.get("userId") || "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "EDITOR";
  if (!userId) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (target.role === "ADMIN" && role === "EDITOR" && target.isActive && (await activeAdminCount()) <= 1) {
    backToUsers({ error: "You need at least one active administrator. Promote someone else first." });
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  await logActivity({ action: "user.update", session, entityType: "USER", entityId: target.email, summary: `Changed ${target.name}'s role to ${role === "ADMIN" ? "Administrator" : "Editor"}` });
  revalidatePath("/admin/users");
  backToUsers({ msg: `${target.name} is now ${role === "ADMIN" ? "an administrator" : "an editor"}.` });
}

export async function toggleUserActive(formData: FormData) {
  const { session, user } = await requireRole(["ADMIN"]);
  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;
  const nextActive = !target.isActive;

  if (!nextActive && target.id === user.id) {
    backToUsers({ error: "You cannot deactivate your own account." });
  }
  if (!nextActive && target.role === "ADMIN" && (await activeAdminCount()) <= 1) {
    backToUsers({ error: "You need at least one active administrator." });
  }

  await db.user.update({ where: { id: userId }, data: { isActive: nextActive } });
  await logActivity({
    action: "user.update",
    session,
    entityType: "USER",
    entityId: target.email,
    summary: nextActive ? `Reactivated ${target.name}'s account` : `Deactivated ${target.name}'s account`,
  });
  revalidatePath("/admin/users");
  backToUsers({ msg: `${target.name}'s account is now ${nextActive ? "active" : "deactivated"}.` });
}

export async function resetUserPassword(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const { session } = await requireRole(["ADMIN"]);
  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (!userId) return { error: "Missing user." };

  if (password !== confirm) return { error: "The two passwords do not match." };
  const passwordError = passwordProblem(password);
  if (passwordError) return { error: passwordError };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "That account no longer exists." };

  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() } });
  await logActivity({ action: "user.password", session, entityType: "USER", entityId: target.email, summary: `Set a new password for ${target.name}` });
  revalidatePath("/admin/users");
  redirect(`/admin/users?pw=${encodeURIComponent(target.name)}`);
}

export async function deleteUser(formData: FormData) {
  const { session, user } = await requireRole(["ADMIN"]);
  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (target.id === user.id) {
    backToUsers({ error: "You cannot delete your own account." });
  }
  if (target.role === "ADMIN" && target.isActive && (await activeAdminCount()) <= 1) {
    backToUsers({ error: "You need at least one active administrator. Demote or remove someone else first." });
  }

  await db.user.delete({ where: { id: userId } });
  await logActivity({ action: "user.delete", session, entityType: "USER", entityId: target.email, summary: `Deleted ${target.name}'s account (${target.email})` });
  revalidatePath("/admin/users");
  backToUsers({ deleted: target.name });
}

