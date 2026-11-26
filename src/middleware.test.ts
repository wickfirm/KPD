import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import { SITE_GATE_COOKIE, siteGateToken } from "@/lib/site-gate";
import { LOCALE_HEADER, LOCALE_PREVIEW_HEADER } from "@/lib/locales";

const ORIGIN = "https://kpd.ae";
const request = (path: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) => new NextRequest(new URL(path, ORIGIN), init);

/// What the request looks like to the page: the rewrite target, if any, and
/// the locale headers the middleware passed on.
function delivered(response: Response, url: string) {
  const headers = new Headers();
  for (const name of (response.headers.get("x-middleware-override-headers") ?? "").split(",")) {
    const value = response.headers.get(`x-middleware-request-${name.trim()}`);
    if (value !== null) headers.set(name.trim(), value);
  }
  return {
    status: response.status,
    rewrittenTo: response.headers.get("x-middleware-rewrite"),
    redirectedTo: response.headers.get("location"),
    locale: headers.get(LOCALE_HEADER),
    preview: headers.get(LOCALE_PREVIEW_HEADER),
    url,
  };
}

const gate = { SITE_GATE_USER: "kpd", SITE_GATE_PASSWORD: "preview-pass" };
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = { SITE_GATE: process.env.SITE_GATE, SITE_GATE_USER: process.env.SITE_GATE_USER, SITE_GATE_PASSWORD: process.env.SITE_GATE_PASSWORD, AUTH_SECRET: process.env.AUTH_SECRET };
  process.env.SITE_GATE = "off";
  delete process.env.SITE_GATE_USER;
  delete process.env.SITE_GATE_PASSWORD;
  process.env.AUTH_SECRET = "middleware-unit-test-secret-0123456789";
});

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("middleware: languages", () => {
  it("rewrites /ar/… and /ja/… to the English route and names the language", async () => {
    expect(delivered(await middleware(request("/ar/about")), "/ar/about")).toMatchObject({ status: 200, rewrittenTo: `${ORIGIN}/about`, locale: "ar", preview: null });
    expect(delivered(await middleware(request("/ja/news/a-b?kind=NEWS")), "/ja/news/a-b")).toMatchObject({ rewrittenTo: `${ORIGIN}/news/a-b?kind=NEWS`, locale: "ja", preview: null });
    expect(delivered(await middleware(request("/ar")), "/ar")).toMatchObject({ rewrittenTo: `${ORIGIN}/`, locale: "ar" });
    // "/legacy" is the History page, not a delivered file.
    expect(delivered(await middleware(request("/ar/legacy")), "/ar/legacy")).toMatchObject({ status: 200, rewrittenTo: `${ORIGIN}/legacy`, locale: "ar" });
  });

  it("passes an English page through as before, with no rewrite and no locale header", async () => {
    for (const path of ["/", "/about", "/news", "/contact?x=1", "/archive", "/arabic"]) {
      const result = delivered(await middleware(request(path)), path);
      expect(result).toMatchObject({ status: 200, rewrittenTo: null, locale: null, preview: null });
    }
  });

  it("drops a locale header the client sent itself, so English stays English", async () => {
    expect(delivered(await middleware(request("/about", { headers: { [LOCALE_HEADER]: "ar", [LOCALE_PREVIEW_HEADER]: "1" } })), "/about")).toMatchObject({ status: 200, locale: null, preview: null });
    // A request with nothing to drop is not touched at all.
    expect((await middleware(request("/about"))).headers.has("x-middleware-override-headers")).toBe(false);
  });

  it("keeps the language prefix for pages only", async () => {
    for (const path of ["/ar/legacy/assets/css/site.css", "/ar/_next/static/chunks/main.js", "/ar/fonts/manrope-latin-var.woff2", "/ar/sitemap.xml", "/ar/api/contact", "/ar/site-access"]) {
      const result = delivered(await middleware(request(path)), path);
      expect(result.status, path).toBe(404);
      expect(result.locale, path).toBeNull();
    }
  });

  it("treats /jp/… as no language: jp is the country, /ja is the address", async () => {
    for (const path of ["/jp", "/jp/about", "/jp/news/a-b"]) {
      const result = delivered(await middleware(request(path)), path);
      expect(result, path).toMatchObject({ status: 200, rewrittenTo: null, redirectedTo: null, locale: null, preview: null });
    }
  });

  it("still gates a prefixed page, and signs the visitor back in to the same address", async () => {
    // "SITE_GATE=off" (set for every other test) would switch the gate off.
    delete process.env.SITE_GATE;
    Object.assign(process.env, gate);
    const gated = await middleware(request("/ar/about?x=1"));
    expect(gated.headers.get("x-middleware-rewrite")).toBe(`${ORIGIN}/site-access?next=${encodeURIComponent("/ar/about?x=1")}`);
    expect(gated.headers.get("Cache-Control")).toBe("private, no-store");
    const access = await siteGateToken({ user: gate.SITE_GATE_USER, password: gate.SITE_GATE_PASSWORD });
    expect(delivered(await middleware(request("/ar/about?x=1", { headers: { cookie: `${SITE_GATE_COOKIE}=${access}` } })), "/ar/about")).toMatchObject({ rewrittenTo: `${ORIGIN}/about?x=1`, locale: "ar" });
  });
});

describe("middleware: admin area with a language prefix", () => {
  const session = async () => ({ cookie: `${SESSION_COOKIE}=${await createSessionToken({ userId: "u1", email: "admin@kpd.test", name: "Admin", role: "ADMIN" })}` });

  it("guards /ar/admin/… like /admin/…, so the prefix is no way around the sign-in", async () => {
    expect(delivered(await middleware(request("/ar/admin/articles")), "/ar/admin/articles").redirectedTo).toBe(`${ORIGIN}/admin/login`);
    // Signed in, the address is simply not a page.
    expect(delivered(await middleware(request("/ar/admin/articles", { headers: await session() })), "/ar/admin/articles")).toMatchObject({ status: 200, rewrittenTo: null, locale: null });
  });

  it("gives an admin preview its language from ?lang=", async () => {
    const preview = delivered(await middleware(request("/admin/preview/articles/1?lang=ar", { headers: await session() })), "/admin/preview/articles/1");
    expect(preview).toMatchObject({ status: 200, rewrittenTo: null, locale: "ar", preview: "1" });
  });

  it.each(["/admin/preview/articles/1", "/admin/preview/articles/1?lang=en", "/admin/preview/articles/1?lang=xx", "/admin/articles/1?lang=ar"])(
    "keeps %s in English",
    async (path) => {
      expect(delivered(await middleware(request(path, { headers: await session() })), path)).toMatchObject({ status: 200, rewrittenTo: null, locale: null, preview: null });
    },
  );
});
