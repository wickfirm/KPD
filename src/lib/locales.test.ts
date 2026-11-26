import { describe, expect, it } from "vitest";
import { formatDate, isPageAddress, isRtl, localeFromPath, localeHref, localizeHtmlLinks, ogLocale, pageInLocale } from "./locales";

describe("isPageAddress", () => {
  it.each(["/", "/about", "/legacy", "/news/a-b", "/ar/about", "/developments/seven-x-seven"])("is a page: %s", (path) => {
    expect(isPageAddress(path)).toBe(true);
  });
  it.each(["", "about", "//cdn.example.com/a.js", "/api", "/api/contact", "/admin", "/admin/login", "/_next/static/a.js", "/legacy/", "/legacy/terms.html", "/fonts/a.woff2", "/sitemap.xml", "/google1234abcd.html"])("is not a page: %s", (path) => {
    expect(isPageAddress(path)).toBe(false);
  });
});

describe("localeFromPath", () => {
  it("splits a prefixed page address", () => {
    expect(localeFromPath("/ar/about")).toEqual({ locale: "ar", path: "/about" });
    expect(localeFromPath("/ja/news/a-b")).toEqual({ locale: "ja", path: "/news/a-b" });
    expect(localeFromPath("/ar/developments/seven-x-seven")).toEqual({ locale: "ar", path: "/developments/seven-x-seven" });
  });
  it("maps the bare prefix to the home page", () => {
    expect(localeFromPath("/ar")).toEqual({ locale: "ar", path: "/" });
    expect(localeFromPath("/ja/")).toEqual({ locale: "ja", path: "/" });
  });
  // "/jp" is the country; "/ja" is the language and the address.
  it.each(["/", "/about", "/archive", "/arabic", "/art", "/AR/about", "/ja-news", "/jp", "/jp/about", "/administrator", "/api/contact"])(
    "leaves %s in English",
    (path) => expect(localeFromPath(path)).toEqual({ locale: "en", path }),
  );
});

describe("localeHref", () => {
  const links = ["/", "/about", "/news/a-b?kind=NEWS&page=2#list", "/#top", "/contact#experience-center", "/legacy"];
  it("returns every href untouched for English", () => {
    for (const href of [...links, "https://example.com/about", "mailto:info@kpd.ae", "#top", "about"]) {
      expect(localeHref(href, "en")).toBe(href);
    }
  });
  it("puts the language in front of a page address and keeps the rest", () => {
    expect(localeHref("/", "ar")).toBe("/ar");
    expect(localeHref("/about", "ar")).toBe("/ar/about");
    expect(localeHref("/news/a-b?kind=NEWS&page=2#list", "ja")).toBe("/ja/news/a-b?kind=NEWS&page=2#list");
    expect(localeHref("/#top", "ar")).toBe("/ar#top");
    expect(localeHref("/contact#experience-center", "ar")).toBe("/ar/contact#experience-center");
    expect(localeHref("/legacy", "ar")).toBe("/ar/legacy");
  });
  it("re-aims a link that already carries a language", () => {
    expect(localeHref("/ja/about", "ar")).toBe("/ar/about");
    expect(localeHref("/ar", "ja")).toBe("/ja");
  });

  describe("pageInLocale (what a language switcher needs)", () => {
    it("takes a prefixed address back to English", () => {
      expect(pageInLocale("/ar/about", "en")).toBe("/about");
      expect(pageInLocale("/ja/news/a-b?kind=NEWS", "en")).toBe("/news/a-b?kind=NEWS");
      expect(pageInLocale("/ar", "en")).toBe("/");
    });
    it("puts a language in front of an English address", () => {
      expect(pageInLocale("/about", "ar")).toBe("/ar/about");
      expect(pageInLocale("/", "ja")).toBe("/ja");
      expect(pageInLocale("/legacy", "ar")).toBe("/ar/legacy");
    });
    it("swaps one language for another", () => {
      expect(pageInLocale("/ar/about#top", "ja")).toBe("/ja/about#top");
      expect(pageInLocale("/ja", "ar")).toBe("/ar");
    });
    it("leaves anything that is not a page address alone", () => {
      for (const href of ["https://example.com/a", "mailto:info@kpd.ae", "#top", "", "/api/contact", "/ar/legacy/assets/css/site.css", "/sitemap.xml"]) {
        expect(pageInLocale(href, "ar"), href).toBe(href);
      }
    });
  });
  it.each([
    "https://example.com/about",
    "//cdn.example.com/a.js",
    "mailto:info@kpd.ae",
    "tel:+97143883099",
    "#top",
    "",
    "about",
    "/api/contact",
    "/api",
    "/admin/articles/1",
    "/admin",
    "/_next/static/chunks/main.js",
    "/legacy/assets/css/site.css",
    "/legacy/terms.html",
    "/fonts/manrope-latin-var.woff2",
    "/assets/amenities/pool-view.png",
    "/sitemap.xml",
    "/rss.xml",
    "/opengraph-image",
    "/site-access",
  ])("never prefixes %s", (href) => expect(localeHref(href, "ar")).toBe(href));
});

describe("localizeHtmlLinks", () => {
  const shell = `<div><a class="a" href="/about">About</a><a href='/contact'>Contact</a><img src="/legacy/assets/images/a.png"><a href="https://example.com/x">Other site</a><a href="/legacy/terms.html">Old</a><a href="mailto:info@kpd.ae">Mail</a><a href="#top">Top</a></div>`;
  it("gives English back as it came", () => {
    expect(localizeHtmlLinks(shell, "en")).toBe(shell);
  });
  it("prefixes the internal page links and nothing else", () => {
    expect(localizeHtmlLinks(shell, "ar")).toBe(
      `<div><a class="a" href="/ar/about">About</a><a href='/ar/contact'>Contact</a><img src="/legacy/assets/images/a.png"><a href="https://example.com/x">Other site</a><a href="/legacy/terms.html">Old</a><a href="mailto:info@kpd.ae">Mail</a><a href="#top">Top</a></div>`,
    );
  });
});

describe("language details", () => {
  it("knows which languages run right to left", () => {
    expect([isRtl("en"), isRtl("ar"), isRtl("ja")]).toEqual([false, true, false]);
  });
  it("formats a date in the language and keeps Western digits in Arabic", () => {
    const date = new Date("2026-03-03T12:00:00Z");
    expect(formatDate(date, "en")).toBe("March 3, 2026");
    expect(formatDate(date, "ja")).toBe("2026年3月3日");
    const arabic = formatDate(date, "ar");
    expect(arabic).toMatch(/2026/);
    expect(arabic).not.toMatch(/[\u0660-\u0669]/);
    expect(arabic).not.toBe(formatDate(date, "en"));
  });
  it("names the Open Graph locale", () => {
    expect([ogLocale("en"), ogLocale("ar"), ogLocale("ja")]).toEqual(["en_AE", "ar_AE", "ja_JP"]);
  });
});
