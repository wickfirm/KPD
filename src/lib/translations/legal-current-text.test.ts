import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { legalDocuments, legalTabForSlug } from "@/lib/terms-defaults";
import { classify, legalPageEnglish, placeRow, readSheet, sameText, textLeaves } from "@/lib/translations/import-sheet";

// docs/translations/legal-current-text.csv is the list the translators
// translate the Privacy and Cookies pages from. The client's sheet holds older
// wording of those pages, so its rows could not be used: this list has to
// follow the site's document. It fails when the document changes and the list
// was not made again (npx tsx scripts/legal-translation-rows.ts).

describe("the list for the translators", () => {
  const rows = readSheet(new Uint8Array(readFileSync(join(process.cwd(), "docs", "translations", "legal-current-text.csv"))));
  const documentOf = (slug: string) => legalDocuments.find((candidate) => legalTabForSlug(slug) === candidate.id)!;

  it.each(["privacy-policy", "cookie-policy"])("holds every line of the %s page, and each row's Key is the line's exact place", (slug) => {
    const english = legalPageEnglish(documentOf(slug));
    const mine = rows.filter((row) => classify(row).area === slug);
    expect(mine.map((row) => row.english)).toEqual(textLeaves(english.content).map(([, text]) => text));
    for (const row of mine) expect(placeRow(english, row, classify(row).path), `row ${row.row} ${row.key}`).toMatchObject({ byHint: true });
  });

  it("holds the lines of the Terms page that are on it more than once, and no others", () => {
    const english = legalPageEnglish(documentOf("terms"));
    const leaves = textLeaves(english.content[1]);
    const repeated = leaves.filter(([, text]) => leaves.filter(([, other]) => sameText(other, text)).length > 1);
    const mine = rows.filter((row) => classify(row).area === "terms");
    expect(mine.map((row) => row.english)).toEqual(repeated.map(([, text]) => text));
    expect(repeated.length).toBeGreaterThan(0);
    for (const row of mine) expect(placeRow(english, row, classify(row).path), `row ${row.row} ${row.key}`).toMatchObject({ byHint: true });
  });

  it("is numbered after the other list for translators", () => {
    const other = readSheet(new Uint8Array(readFileSync(join(process.cwd(), "docs", "translations", "strings-not-in-sheet.csv"))));
    expect(Math.min(...rows.map((row) => row.row))).toBeGreaterThan(Math.max(...other.map((row) => row.row)));
  });
});
