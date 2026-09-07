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
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? user : null;
}

