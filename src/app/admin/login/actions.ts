"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authenticate, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Email and password are required." };

  let user;
  try {
    user = await authenticate(email, password);
  } catch (err) {
    console.error("[admin/login] database error:", err);
    return {
      error:
        "The CMS cannot reach its database right now. Please verify the Vercel database connection settings and try again.",
    };
  }
  if (!user) {
    // One generic message for wrong password, unknown email and deactivated
    // accounts alike — never reveal which detail was wrong.
    await logActivity({ action: "auth.login_failed", summary: `Failed sign-in attempt for ${email.trim().toLowerCase()}` });
    return { error: "That email and password combination does not match an account." };
  }

  const session = { userId: user.id, email: user.email, name: user.name, role: user.role };
  await setSessionCookie(session);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => null);
  await logActivity({ session, action: "auth.login", summary: `${user.name} signed in` });
  redirect("/admin");
}

