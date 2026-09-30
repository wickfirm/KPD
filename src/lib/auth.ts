import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./session";

export { SESSION_COOKIE, createSessionToken, verifySessionToken };
export type { SessionPayload };

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/// Server-component guard: redirects to the login page when unauthenticated.
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/// Session + live-user verification. The signed cookie alone cannot tell
/// whether the account was deleted or deactivated after sign-in, so every
/// server component / action re-checks the users table through this guard.
export async function requireUser() {
  const session = await requireSession();
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) {
    await clearSessionCookie();
    redirect("/admin/login");
  }
  return { session, user };
}

export type AdminRole = "ADMIN" | "EDITOR";

/// Role guard built on requireUser: redirects non-privileged users back to the
/// dashboard with ?denied=1 (pages and actions both render the explanation).
/// Permission model (work order 2026-10):
///   ADMIN  — everything: content, media, settings, users, activity log.
///   EDITOR — content + media uploads + submissions/RSS review; no settings,
///            no user management, no activity log, no media deletion.
export async function requireRole(roles: AdminRole[]) {
  const { session, user } = await requireUser();
  if (!roles.includes(user.role)) redirect("/admin?denied=1");
  return { session, user };
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/// Authenticate against the users table. If no users exist yet, bootstrap the
/// initial ADMIN account from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
export async function authenticate(email: string, password: string) {
  const userCount = await db.user.count();
  if (userCount === 0) {
    const bootstrapEmail = process.env.ADMIN_EMAIL;
    const bootstrapPassword = process.env.ADMIN_PASSWORD;
    if (
      bootstrapEmail &&
      bootstrapPassword &&
      email.trim().toLowerCase() === bootstrapEmail.trim().toLowerCase() &&
      password === bootstrapPassword
    ) {
      const user = await db.user.create({
        data: {
          email: bootstrapEmail.trim().toLowerCase(),
          passwordHash: await hashPassword(bootstrapPassword),
          name: process.env.ADMIN_NAME || "KPD Admin",
          role: "ADMIN",
        },
      });
      return user;
    }
    return null;
  }

  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;
  if (!user.isActive) return null; // deactivated accounts cannot sign in
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? user : null;
}

