// Edge-safe session utilities (no Node-only deps) — imported by middleware.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "kpd_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET env var must be set (>= 16 chars).");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.userId || !payload.email) return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "EDITOR",
    };
  } catch {
    return null;
  }
}
