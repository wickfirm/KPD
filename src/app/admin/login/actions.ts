"use server";

import { redirect } from "next/navigation";
import { authenticate, setSessionCookie } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Email and password are required." };

  const user = await authenticate(email, password);
  if (!user) return { error: "Invalid credentials." };

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  redirect("/admin");
}
