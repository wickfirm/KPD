import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Next does not hold a page back for its metadata. A metadata that resolves
// after the page is streamed to the end of the HTML instead of into its head:
// the page is the same, but the title is not where a reader that runs no
// scripts looks for it. Seen on production on cold starts. So every page
// whose metadata reads the database awaits the same read itself, once a
// request, and neither can be ready before it.

const app = fileURLToPath(new URL("../app/", import.meta.url));

function sources(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const file = join(folder, name);
    if (statSync(file).isDirectory()) return name === "admin" ? [] : sources(file);
    return /\.tsx$/.test(name) ? [file] : [];
  });
}

/// The reads a metadata must share with its page.
const READS = /pageLanguages\(|searchAppearance\(|pageInLanguages\(/;

describe("a page waits for what its metadata reads", () => {
  const pages = sources(app)
    .map((file) => ({ file, source: readFileSync(file, "utf8").replace(/^﻿/, "") }))
    .filter(({ source }) => /export async function generateMetadata/.test(source));

  it("finds the public pages that have metadata of their own", () => {
    expect(pages.length).toBeGreaterThanOrEqual(10);
  });

  for (const { file, source } of pages) {
    const cut = source.search(/export default async function/);
    it(`${file.slice(app.length)}: the page awaits every read its metadata makes`, () => {
      const metadata = cut < 0 ? source : source.slice(0, cut);
      const page = cut < 0 ? "" : source.slice(cut);
      if (!READS.test(metadata)) return;
      expect(page).toMatch(READS);
    });
  }
});
