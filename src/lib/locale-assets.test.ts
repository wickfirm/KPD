import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The Arabic and Japanese stylesheets are static files under public/, loaded
// only by pages in that language. Nothing bundles them, so a font file that is
// moved or renamed would only show up as a 404 on those pages.

const publicDir = new URL("../../public/", import.meta.url);
const localeStylesheet = (name: string) => readFileSync(new URL(`locales/${name}`, publicDir), "utf8");

/// Every file a stylesheet refers to with url(...), relative to the stylesheet.
function referencedFiles(css: string): string[] {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((match) => match[1]).filter((url) => !/^(https?:)?\/\//.test(url) && !url.startsWith("/"));
}

function stylesheetAndImports(name: string): { file: string; css: string }[] {
  const file = `locales/${name}`;
  const css = localeStylesheet(name);
  const imports = [...css.matchAll(/@import\s+["']([^"']+)["']/g)].map((match) => match[1]);
  return [{ file, css }, ...imports.flatMap((path) => stylesheetAndImports(path.replace(/^(\.\.\/)+/, "")))];
}

/// A selector list split on the commas that separate its selectors, not on
/// the ones inside :is(...), :where(...) and the like.
function splitSelectors(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of selector) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += character;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

describe("the Arabic and Japanese stylesheets", () => {
  it.each(["ar.css", "ja.css"])("%s names a font file that exists for every face it declares", (name) => {
    const sheets = stylesheetAndImports(name);
    expect(sheets.length).toBeGreaterThan(0);
    for (const { file, css } of sheets) {
      for (const url of referencedFiles(css)) {
        expect(existsSync(new URL(url, new URL(file, publicDir))), `${file} -> ${url}`).toBe(true);
      }
    }
  });

  it.each(["ar.css", "ja.css"])("%s only has rules scoped to its own language", (name) => {
    const language = name.slice(0, 2);
    const css = localeStylesheet(name).replace(/\/\*[\s\S]*?\*\//g, "").replace(/@font-face\s*\{[^}]*\}/g, "");
    const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim()).filter((selector) => selector !== "");
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      for (const part of splitSelectors(selector)) expect(part, name).toMatch(new RegExp(`^html\\[lang="${language}"\\]`));
    }
  });

  it("ships the Japanese font as the package's own stylesheet, unmodified", () => {
    const css = readFileSync(new URL("fonts/noto-sans-jp/wght.css", publicDir), "utf8");
    expect(css.match(/@font-face/g)?.length).toBe(124);
    for (const url of referencedFiles(css)) expect(existsSync(new URL(`fonts/noto-sans-jp/${url}`, publicDir)), url).toBe(true);
  });

  it("styles the language switcher through its own classes only", () => {
    const css = localeStylesheet("language-switcher.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim()).filter((selector) => selector !== "" && !selector.startsWith("@"));
    expect(selectors.length).toBeGreaterThan(10);
    for (const selector of selectors) {
      for (const part of splitSelectors(selector)) expect(part).toMatch(/^\.kpd-lang/);
    }
  });
});
