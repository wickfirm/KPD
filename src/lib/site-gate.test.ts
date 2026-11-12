import { describe, expect, it } from "vitest";
import { credentialsMatch, hasSiteAccess, isOpenPath, safeNextPath, siteGateConfig, siteGateToken } from "./site-gate";

const config = { user: "kpd", password: "s3cret-pass" };

describe("siteGateConfig", () => {
  it("is on only when both username and password are set", () => {
    expect(siteGateConfig({ SITE_GATE_USER: "kpd", SITE_GATE_PASSWORD: "x" })).toEqual({ user: "kpd", password: "x" });
    expect(siteGateConfig({ SITE_GATE_USER: "kpd" })).toBeNull();
    expect(siteGateConfig({ SITE_GATE_PASSWORD: "x" })).toBeNull();
    expect(siteGateConfig({})).toBeNull();
  });
  it("SITE_GATE=off switches it off", () => {
    expect(siteGateConfig({ SITE_GATE: "OFF", SITE_GATE_USER: "kpd", SITE_GATE_PASSWORD: "x" })).toBeNull();
  });
});

describe("isOpenPath", () => {
  it.each(["/admin", "/admin/login", "/api/contact", "/api/cron/rss-ingest", "/_next/static/a.js", "/legacy/assets/css/site.css", "/fonts/manrope-latin-var.woff2", "/brand/logo-stacked-black.png", "/robots.txt", "/sitemap.xml", "/google1234abcd.html", "/site-access"])(
    "leaves %s open",
    (path) => expect(isOpenPath(path)).toBe(true),
  );
  it.each(["/", "/about", "/news", "/news/some-article", "/developments/seven-x-seven", "/rss.xml", "/llms.txt", "/administrator", "/apix"])(
    "gates %s",
    (path) => expect(isOpenPath(path)).toBe(false),
  );
});

describe("access cookie", () => {
  it("accepts the token for the current credentials only", async () => {
    const token = await siteGateToken(config);
    expect(await hasSiteAccess(token, config)).toBe(true);
    expect(await hasSiteAccess(token, { ...config, password: "changed" })).toBe(false);
    expect(await hasSiteAccess(undefined, config)).toBe(false);
    expect(await hasSiteAccess("forged", config)).toBe(false);
  });
  it("checks the typed credentials", async () => {
    expect(await credentialsMatch(" kpd ", "s3cret-pass", config)).toBe(true);
    expect(await credentialsMatch("kpd", "wrong", config)).toBe(false);
    expect(await credentialsMatch("other", "s3cret-pass", config)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths and rejects the rest", () => {
    expect(safeNextPath("/about?x=1")).toBe("/about?x=1");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("/site-access?next=/")).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
  });
});
