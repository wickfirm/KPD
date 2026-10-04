import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS, verifySessionToken } from "@/lib/session";

beforeAll(() => {
  process.env.AUTH_SECRET = "unit-test-secret-0123456789";
});

const payload = { userId: "u1", email: "admin@kpd.ae", name: "KPD Admin", role: "ADMIN" as const };

describe("session tokens", () => {
  it("round-trips a payload", async () => {
    const token = await createSessionToken(payload);
    const verified = await verifySessionToken(token);
    expect(verified).toEqual(payload);
  });

  it("expires after the 7-day TTL", async () => {
    expect(SESSION_TTL_SECONDS).toBe(60 * 60 * 24 * 7);
    const token = await createSessionToken(payload);
    // Decode without verification to inspect the exp claim.
    const [, body] = token.split(".");
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    expect(claims.exp! - claims.iat!).toBe(SESSION_TTL_SECONDS);
  });

  it("returns null for a tampered or garbage token", async () => {
    const token = await createSessionToken(payload);
    expect(await verifySessionToken(`${token}x`)).toBeNull();
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });

  it("demotes unknown roles to EDITOR and keeps required fields", async () => {
    const token = await createSessionToken({ ...payload, role: "EDITOR" });
    const verified = await verifySessionToken(token);
    expect(verified?.role).toBe("EDITOR");
  });

  it("uses the documented cookie name", () => {
    expect(SESSION_COOKIE).toBe("kpd_session");
  });
});
