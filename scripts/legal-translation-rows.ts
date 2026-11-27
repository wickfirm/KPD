// Writes docs/translations/legal-current-text.csv: every line of the Privacy
// and Cookies pages (src/lib/terms-defaults.ts) as a row for the translators,
// in the translation sheet's columns. The client's sheet was written from
// older wording of those two pages, so its rows for them cannot be placed.
//
//   npx tsx scripts/legal-translation-rows.ts
//
// Each row's Key is the line's exact place on the page, so the importer places
// a line that is on the page twice ("Yes, in your browser settings") without
// having to choose. Run this again when the client's document changes: a test
// fails until the list matches the document. The rows are numbered after the
// last row of the other list for translators.
//
// Nothing here reads or writes a database.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { legalDocuments, legalTabForSlug, type LegalDocument } from "../src/lib/terms-defaults";
import { legalPageEnglish, readSheet, sameText, textLeaves, type PathStep } from "../src/lib/translations/import-sheet";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const folder = join(repo, "docs", "translations");

type Line = [PathStep[], string];

/// Every line of a legal page as the importer matches against it: its first
/// block is the contact band under the document, its second the document.
const allLines = (document: LegalDocument): Line[] => textLeaves(legalPageEnglish(document)).filter(([path]) => path[0] === "content");

/// Every line of a document.
const everyLine = (document: LegalDocument): Line[] => allLines(document).filter(([path]) => path[1] === 1);

/// A place as the sheet writes it: "content[1].sections[2].pieces[1].rows[0][2]".
const keyOf = (path: PathStep[]) => path.map((step, index) => (typeof step === "number" ? `[${step}]` : `${index ? "." : ""}${step}`)).join("");

/// The lines that are on the page more than once. The importer will not choose
/// between two places, so the sheet's rows for them are left out.
const repeatedLines = (document: LegalDocument): Line[] => {
  const all = everyLine(document);
  return all.filter(([, text]) => all.filter(([, other]) => sameText(other, text)).length > 1);
};

/// The pages the list is for: Privacy and Cookies in full, the contact band
/// under them included (the sheet holds that band's lines under Terms only),
/// and for Terms only the lines the sheet cannot place.
const PAGES: { slug: string; area: string; lines: (document: LegalDocument) => Line[] }[] = [
  { slug: "privacy-policy", area: "Legal: Privacy (current text)", lines: allLines },
  { slug: "cookie-policy", area: "Legal: Cookies (current text)", lines: allLines },
  { slug: "terms", area: "Legal: Terms", lines: repeatedLines },
];

/// What a line is on the page, from the names in its place (an entry's index
/// is not one): the list is read by people.
function noteOf(path: PathStep[], repeated: boolean): string {
  const steps = path.map(String);
  const named = steps.filter((step) => !/^\d+$/.test(step));
  const name = named[named.length - 1];
  const parent = named[named.length - 2];
  const what = steps[0] === "content" && steps[1] === "0" ? (name === "heading" ? "Contact band: heading" : "Contact band: text")
    : !named.includes("pieces") ? (name === "title" ? "Page heading" : "Section heading")
    : parent === "cards" ? (name === "title" ? "Card: title" : "Card: text")
    : name === "items" ? "Line of a list"
    : name === "headers" ? "Table: column heading"
    : name === "rows" ? `Table: cell (row ${Number(steps[steps.length - 2]) + 1}, column ${Number(steps[steps.length - 1]) + 1})`
    : "Paragraph";
  const why = repeated ? "The word is on two lists of this page, so the main sheet's rows for it are left out there."
    : steps[0] === "content" && steps[1] === "0" ? "The band under the document: the main sheet holds its two lines under Terms only."
    : "";
  return `${what}.${why ? ` ${why}` : ""}`;
}

/// A cell of a CSV file: in quotes, with its quotes doubled, where it needs them.
const cell = (value: string) => (/[",\r\n]/.test(value) || value !== value.trim() ? `"${value.replace(/"/g, '""')}"` : value);

const last = Math.max(0, ...readSheet(new Uint8Array(readFileSync(join(folder, "strings-not-in-sheet.csv")))).map((row) => row.row));
let number = last;
const out = ['\uFEFF"#","Page / area","Key (do not edit)","English","Arabic","Japanese","Notes","Status"'];
for (const { slug, area, lines } of PAGES) {
  const document = legalDocuments.find((candidate) => legalTabForSlug(slug) === candidate.id);
  if (!document) throw new Error(`The site has no legal page "${slug}".`);
  for (const [path, text] of lines(document)) {
    number += 1;
    out.push([String(number), cell(area), cell(`${slug}.${keyOf(path)}`), cell(text), "", "", cell(noteOf(path, lines === repeatedLines)), "Draft"].join(","));
  }
}
writeFileSync(join(folder, "legal-current-text.csv"), `${out.join("\n")}\n`);
console.log(`Wrote docs/translations/legal-current-text.csv: ${number - last} row(s), numbered ${last + 1} to ${number}.`);
