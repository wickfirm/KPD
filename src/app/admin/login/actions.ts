"use server";

import { redirect } from "next/navigation";
import { authenticate, setSessionCookie } from "@/lib/auth";

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
  if (!user) return { error: "Invalid credentials." };

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  redirect("/admin");
}
