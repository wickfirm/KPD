// ── The client's translation sheet ───────────────────────────────────────────
// KPD-translations-AR-JA.xlsx, tab "Translations": one row per string, with
// its English and its Arabic and Japanese. A list of rows sent to the
// translators and returned (docs/translations/*.csv) has the same columns, as
// a CSV file. This module reads either and works out where each row goes;
// scripts/import-translations.ts is the command around it.
//
// Where a row goes is decided by its English, never by its Key alone: the Key
// column is a readable hint ("about.content[5].mission"), not a path. A row is
// placed at the hinted place if the English there is the row's English, and
// otherwise at the one place in the page's English content that holds exactly
// that text. Not found, or found in more than one place: the row is reported
// and left out, rather than guessed.
//
// Nothing here writes. Only text can be placed (the editor's language tab
// follows the same list, TEXT_KEYS), and only a language's own row is ever
// written to. An English value is never touched.

import { inflateRawSync } from "node:zlib";
import { isTranslatableKey } from "@/lib/translations/merge-locale";
import { legalContact, legalDocuments, legalTabForSlug, type LegalDocument } from "@/lib/terms-defaults";

// ── Reading the workbook ─────────────────────────────────────────────────────

export type SheetRow = {
  /// The row's number in the sheet, for the report.
  row: number;
  /// The "Page / area" column.
  area: string;
  /// The "Key" column: a hint.
  key: string;
  english: string;
  arabic: string;
  japanese: string;
  status: string;
  /// Set when the command adjusted the row to match the page (said in the report).
  adjusted?: string;
};

/// A line of a list in the sheet comes with the bullet the page draws itself
/// ("• Violate any applicable law"); the page's own text has none.
export function hasBullet(text: string): boolean {
  return /^[•·▪‣]\s/.test(text.trim());
}

export const withoutBullet = (text: string) => (hasBullet(text) ? text.trim().replace(/^[•·▪‣]\s+/, "") : text);

/// A spreadsheet is a zip of XML files, or a CSV file with the same columns.
/// This reads one sheet's cells as text, from either. The file is the client's:
/// it is only ever parsed, never run.
export function readSheet(bytes: Uint8Array, sheetName = "Translations"): SheetRow[] {
  // A zip begins with the header of its first entry, "PK\x03\x04".
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  return zip ? readWorkbook(bytes, sheetName) : readCsv(bytes);
}

function readWorkbook(bytes: Uint8Array, sheetName: string): SheetRow[] {
  const files = unzip(bytes);
  const shared = [...(text(files.get("xl/sharedStrings.xml"))?.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g) ?? [])]
    .map((match) => [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((run) => run[1]).join(""))
    .map(unescapeXml);
  const header: Record<string, number> = {};
  const rows: SheetRow[] = [];
  for (const row of sheetFile(files, sheetName).matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Record<number, string> = {};
    for (const cell of row[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const column = columnOf(/\br="([A-Z]+)\d+"/.exec(cell[1])?.[1] ?? "");
      if (column < 0) continue;
      const body = cell[2] ?? "";
      cells[column] = cell[1].includes('t="s"') ? shared[Number(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1])] ?? ""
        : cell[1].includes('t="inlineStr"') ? unescapeXml(/<t\b[^>]*>([\s\S]*?)<\/t>/.exec(body)?.[1] ?? "")
        : unescapeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
    }
    if (!Object.keys(header).length) {
      for (const [index, name] of Object.entries(cells)) header[name.trim().toLowerCase()] = Number(index);
      continue;
    }
    const at = (name: string) => cells[header[name]] ?? "";
    if (!at("english") && !at("arabic") && !at("japanese")) continue;
    rows.push({
      row: Number(row[1]),
      area: at("page / area").trim(),
      key: (at("key (do not edit)") || at("key")).trim(),
      english: at("english"),
      arabic: at("arabic"),
      japanese: at("japanese"),
      status: at("status").trim(),
    });
  }
  return rows;
}

/// The fields of each record of a CSV file, and the line the record starts on
/// (1 is the file's first line). A field in quotes may hold commas, line breaks
/// and, doubled, quotes; a line break inside one reads as "\n".
export function csvRecords(source: string): { line: number; fields: string[] }[] {
  const records: { line: number; fields: string[] }[] = [];
  let fields: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let start = 1;
  const endRecord = () => {
    if (fields.length || field) records.push({ line: start, fields: [...fields, field] });
    fields = [];
    field = "";
    start = line;
  };
  for (let at = 0; at < source.length; at += 1) {
    const char = source[at]!;
    const next = source[at + 1];
    if (char === '"') {
      if (quoted && next === '"') { field += '"'; at += 1; }
      else if (quoted) quoted = false;
      else if (field) field += '"'; // inside a field that is not in quotes
      else quoted = true;
    } else if (char === "," && !quoted) {
      fields.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") at += 1;
      line += 1;
      endRecord();
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && next === "\n") at += 1;
      field += "\n";
      line += 1;
    } else field += char;
  }
  if (quoted) throw new Error("A quote is left open in the CSV file.");
  endRecord();
  return records;
}

/// A CSV file with the sheet's columns, as rows: a row and its cells read by
/// the same rule as the workbook's. A row's number is its "#" cell where that
/// is a number (a list sent to the translators carries the sheet's own
/// numbering), and otherwise the line it is on.
function readCsv(bytes: Uint8Array): SheetRow[] {
  const [first, ...records] = csvRecords(new TextDecoder().decode(bytes).replace(/^\uFEFF/, ""));
  if (!first?.fields.some((name) => name.trim().toLowerCase() === "english")) throw new Error('This is not the translation sheet: its first line has no "English" column.');
  const header: Record<string, number> = {};
  first.fields.forEach((name, index) => { header[name.trim().toLowerCase()] = index; });
  const rows: SheetRow[] = [];
  for (const { line, fields } of records) {
    const at = (name: string) => fields[header[name]] ?? "";
    if (!at("english") && !at("arabic") && !at("japanese")) continue;
    const number = at("#").trim();
    rows.push({
      row: /^\d+$/.test(number) ? Number(number) : line,
      area: at("page / area").trim(),
      key: (at("key (do not edit)") || at("key")).trim(),
      english: at("english"),
      arabic: at("arabic"),
      japanese: at("japanese"),
      status: at("status").trim(),
    });
  }
  return rows;
}

/// Every file of a zip archive, inflated, by name ("xl/workbook.xml").
export function unzip(bytes: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decode = (start: number, end: number) => new TextDecoder().decode(bytes.subarray(start, end));
  // The directory is at the end, behind an optional comment.
  let directory = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 22 - 65535); at--) {
    if (view.getUint32(at, true) === 0x06054b50) { directory = at; break; }
  }
  if (directory < 0) throw new Error("This is not a spreadsheet (it has no zip directory).");
  let position = view.getUint32(directory + 16, true);
  const files = new Map<string, Uint8Array>();
  for (let count = view.getUint16(directory + 10, true); count > 0; count--) {
    if (view.getUint32(position, true) !== 0x02014b50) break;
    const method = view.getUint16(position + 10, true);
    const size = view.getUint32(position + 20, true);
    const nameLength = view.getUint16(position + 28, true);
    const extraLength = view.getUint16(position + 30, true);
    const commentLength = view.getUint16(position + 32, true);
    const local = view.getUint32(position + 42, true);
    const name = decode(position + 46, position + 46 + nameLength).replace(/^\/+/, "");
    // The entry's own header repeats the name and carries an extra field of its own.
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    files.set(name, method === 0 ? data : new Uint8Array(inflateRawSync(data)));
    position += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

/// The XML of the sheet called `name` (the first one if there is no such name).
export function sheetFile(files: Map<string, Uint8Array>, name: string): string {
  const sheets = [...(text(files.get("xl/workbook.xml"))?.matchAll(/<sheet\b[^>]*>/g) ?? [])].map((tag) => ({
    name: unescapeXml(/\bname="([^"]*)"/.exec(tag[0])?.[1] ?? "").toLowerCase(),
    id: /\br:id="([^"]*)"/.exec(tag[0])?.[1] ?? "",
  }));
  const wanted = sheets.find((sheet) => sheet.name === name.toLowerCase()) ?? sheets[0];
  if (!wanted) throw new Error("The workbook has no sheet.");
  const relationship = [...(text(files.get("xl/_rels/workbook.xml.rels"))?.matchAll(/<Relationship\b[^>]*>/g) ?? [])]
    .find((tag) => new RegExp(`\\bId="${wanted.id}"`).test(tag[0]));
  const target = unescapeXml(/\bTarget="([^"]*)"/.exec(relationship?.[0] ?? "")?.[1] ?? "").replace(/^\/+/, "");
  const file = target.startsWith("xl/") ? target : `xl/${target}`;
  const xml = text(files.get(file));
  if (!xml) throw new Error(`The workbook has no sheet file "${file}".`);
  return xml;
}

const text = (bytes: Uint8Array | undefined) => (bytes ? new TextDecoder().decode(bytes) : "");

/// "A" → 0, "B" → 1, … "AA" → 26; -1 for anything else.
export function columnOf(letters: string): number {
  if (!/^[A-Z]+$/.test(letters)) return -1;
  return [...letters].reduce((index, letter) => index * 26 + Number(letter.charCodeAt(0) - 64), 0) - 1;
}

function unescapeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

// ── Where a row goes ─────────────────────────────────────────────────────────

export type PathStep = string | number;

/// The sheet's areas that are the client's own code: the calculator and the
/// planner. Translating them needs his OK, so their rows are held back.
export const HELD_AREAS = new Set(["calc", "planner"]);

export type Kind = "code" | "held" | "content";

/// A row's kind and, for a page's content, the place its Key hints at.
export function classify(row: Pick<SheetRow, "area" | "key">): { kind: Kind; area: string; path: PathStep[] } {
  const parts = row.key.split(".");
  const area = (parts[0] ?? "").toLowerCase();
  if (/\(code\)/i.test(row.area) && !HELD_AREAS.has(area)) return { kind: "code", area, path: [] };
  if (HELD_AREAS.has(area) || /\(client code/i.test(row.area)) return { kind: "held", area, path: [] };
  // "content[5].mission" → ["content", 5, "mission"]: the page's content is a list of blocks.
  const path = parts.slice(1).flatMap((part) => {
    const named = /^([^\[\]]+)((?:\[\d+\])*)$/.exec(part);
    return named ? [named[1], ...[...named[2].matchAll(/\[(\d+)\]/g)].map((at) => Number(at[1]))] : [];
  });
  return { kind: "content", area, path };
}

/// The field a place ends in: its last name, a list's own name when the place
/// is a line of the list ("introParagraphs[2]").
export function fieldOf(path: PathStep[]): string {
  return String([...path].reverse().find((step) => typeof step === "string") ?? "");
}

/// Every string of a page's English content that a translation may replace,
/// with where it is.
export function textLeaves(value: unknown, path: PathStep[] = [], out: [PathStep[], string][] = []): [PathStep[], string][] {
  if (typeof value === "string") {
    if (isTranslatableKey(fieldOf(path))) out.push([path, value]);
  } else if (Array.isArray(value)) value.forEach((item, index) => textLeaves(item, [...path, index], out));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) textLeaves(item, [...path, key], out);
  return out;
}

export function atPath(value: unknown, path: PathStep[]): unknown {
  let current = value;
  for (const step of path) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<PathStep, unknown>)[step];
  }
  return current;
}

/// The same content with the text at `path` replaced. Nothing else in it
/// changes, and `value` itself is left as it was.
export function withPath<T>(value: T, path: PathStep[], text: string): T {
  if (!path.length) return text as T;
  const [step, ...rest] = path;
  const copy = (Array.isArray(value) ? [...value] : { ...(value as Record<PathStep, unknown>) }) as Record<PathStep, unknown>;
  copy[step] = withPath(copy[step], rest, text);
  return copy as T;
}

/// Two texts as text: line endings and the ends of a cell do not count, every
/// other character does.
export const sameText = (a: string, b: string) => a.replace(/\r\n?/g, "\n").trim() === b.replace(/\r\n?/g, "\n").trim();

export type Placement = { path: PathStep[]; byHint: boolean } | { reason: string };

/// Where a row's English is in a page's English content.
export function placeRow(english: unknown, row: Pick<SheetRow, "english">, hint: PathStep[]): Placement {
  if (!row.english.trim()) return { reason: "The row has no English." };
  const hinted = atPath(english, hint);
  if (typeof hinted === "string" && sameText(hinted, row.english)) {
    return isTranslatableKey(fieldOf(hint)) ? { path: hint, byHint: true } : { reason: `The place its Key hints at ("${hint.join(".")}") is not a text field.` };
  }
  const found = textLeaves(english).filter(([, text]) => sameText(text, row.english));
  if (found.length === 1) return { path: found[0][0], byHint: false };
  if (!found.length) return { reason: "Its English is not in the page's English content: the English may have changed since the sheet was written." };
  const sameField = found.filter(([path]) => fieldOf(path) === fieldOf(hint));
  return sameField.length === 1
    ? { path: sameField[0][0], byHint: false }
    : { reason: `Its English is in ${found.length} places: it is left out rather than put in the wrong one.` };
}

// ── Legal pages ──────────────────────────────────────────────────────────────

/// The two blocks the editor's language tab stores for a legal page, as the
/// page reads them (by their type). A legal page shows a fixed document
/// (src/lib/terms-defaults.ts) and the translation is an overlay on it.
export const legalBlocks = (contact: object, document: LegalDocument) => [
  { type: "legal-contact", ...contact },
  { type: "legal-document", id: document.id, title: document.title, sections: document.sections },
];

/// A legal page's English as its rows are matched against it: what the page
/// shows — the document, and the contact block under it — not the blocks the
/// page has saved. It has no title of its own: the page's heading is the
/// document's.
export function legalPageEnglish(document: LegalDocument, savedContact?: object) {
  return { title: "", content: legalBlocks({ ...legalContact, ...savedContact }, document) };
}

/// The three pages that show one of the client's legal documents.
export const LEGAL_PAGE_SLUGS: readonly string[] = ["terms", "privacy-policy", "cookie-policy"];

/// The legal document a page shows, if it is one of the three legal pages, and
/// nothing for any other page. `legalTabForSlug` names a tab for every slug
/// it is given — Terms for want of a better one — so asked of "about" it
/// answers "terms". Until 27 Nov 2026 the importer asked it that way, and
/// matched every ordinary page against the Terms document, where none of
/// those pages' English is to be found.
export function legalDocumentFor(slug: string): LegalDocument | undefined {
  if (!LEGAL_PAGE_SLUGS.includes(slug)) return undefined;
  return legalDocuments.find((document) => document.id === legalTabForSlug(slug));
}

// ── The plan ─────────────────────────────────────────────────────────────────

/// A page's or a setting's English content, and what is translated in it
/// already (Arabic and Japanese), so that a new row adds to that rather than
/// replacing it.
export type Root = { english: unknown; id: string; translated?: { ar: unknown; ja: unknown } };
export type Unplaced = { row: SheetRow; reason: string };

export type Plan = {
  /// For each page or setting: its English, the rows placed in it, and the
  /// content with their Arabic and Japanese laid on.
  roots: Map<string, { english: unknown; id: string; rows: SheetRow[]; arabic: unknown; japanese: unknown }>;
  unplaced: Unplaced[];
  /// Rows the client's reviewers have not approved: held back unless asked for.
  drafts: SheetRow[];
  /// Rows of the client's own code.
  held: SheetRow[];
};

/// Decides where every row of a page's content goes. `rootOf` gives the English
/// content for the row — its area, and for an article the article its Key
/// names, for the sheet holds rows for several — or nothing when the site has
/// no such page. Rows of the site's own words are not placed here: they go to
/// planDictionary.
export function planRows(rows: SheetRow[], rootOf: (area: string, row: SheetRow) => Root | undefined, { allowDrafts = false } = {}): Plan {
  const plan: Plan = { roots: new Map(), unplaced: [], drafts: [], held: [] };
  for (const row of rows) {
    const { kind, area, path } = classify(row);
    if (kind === "held") { plan.held.push(row); continue; }
    if (!allowDrafts && row.status.toLowerCase() !== "approved") { plan.drafts.push(row); continue; }
    if (kind === "code") continue;
    const root = rootOf(area, row);
    if (!root) { plan.unplaced.push({ row, reason: `The site has no page for the area "${row.area}".` }); continue; }
    const hint = area === "article" ? path.slice(1) : path;
    const placement = placeRow(root.english, row, hint);
    if ("reason" in placement) { plan.unplaced.push({ row, reason: placement.reason }); continue; }
    let entry = plan.roots.get(root.id);
    if (!entry) {
      entry = { english: root.english, id: root.id, rows: [], arabic: root.translated?.ar ?? root.english, japanese: root.translated?.ja ?? root.english };
      plan.roots.set(root.id, entry);
    }
    entry.rows.push(row);
    // An empty cell leaves the field as it is: a missing translation shows English.
    if (row.arabic.trim()) entry.arabic = withPath(entry.arabic, placement.path, row.arabic.trim());
    if (row.japanese.trim()) entry.japanese = withPath(entry.japanese, placement.path, row.japanese.trim());
  }
  return plan;
}

// ── The site's own words (the dictionaries) ──────────────────────────────────

export type DictionaryEntry = { key: string; english: string };
export type DictionaryPlan = {
  /// "nav.about" → its translation, per language.
  arabic: Map<string, string>;
  japanese: Map<string, string>;
  /// Dictionary strings no code row holds the English of.
  missing: DictionaryEntry[];
  unplaced: Unplaced[];
};

/// Every string of the English dictionary, as "area.name".
export function dictionaryEntries(dictionary: unknown, path: string[] = [], out: DictionaryEntry[] = []): DictionaryEntry[] {
  for (const [name, value] of Object.entries(dictionary as Record<string, unknown>)) {
    if (typeof value === "string") out.push({ key: [...path, name].join("."), english: value });
    else dictionaryEntries(value, [...path, name], out);
  }
  return out;
}

/// The sheet against the English dictionary. A string is translated by the row
/// that holds exactly its English — a row with the same key first, then any
/// row of the site's own words or of the client's calculator, then any row of a
/// page (the same words are often both) — and left in English when no row
/// does. A row with an index in its Key ("Payment", the third of the Contact
/// page's choices) is one entry of a list: the same word there does not
/// translate a label elsewhere. Using a calculator row for a string of the
/// site's own does not translate the calculator.
export function planDictionary(rows: SheetRow[], dictionary: unknown, { allowDrafts = false } = {}): DictionaryPlan {
  const plan: DictionaryPlan = { arabic: new Map(), japanese: new Map(), missing: [], unplaced: [] };
  const usable = rows.filter((row) => !row.key.includes("[") && (allowDrafts || row.status.toLowerCase() === "approved"));
  const rank = (row: SheetRow, key: string) => (row.key === key ? 0 : /\(code\)|calculator/i.test(row.area) ? 1 : 2);
  const entries = dictionaryEntries(dictionary);
  for (const entry of entries) {
    const row = usable.filter((candidate) => sameText(candidate.english, entry.english)).sort((a, b) => rank(a, entry.key) - rank(b, entry.key))[0];
    if (!row) { plan.missing.push(entry); continue; }
    if (row.arabic.trim()) plan.arabic.set(entry.key, row.arabic.trim());
    if (row.japanese.trim()) plan.japanese.set(entry.key, row.japanese.trim());
  }
  // A row of the site's own words that translates nothing is worth a look.
  for (const row of usable.filter((candidate) => classify(candidate).kind === "code")) {
    if (!entries.some((entry) => sameText(entry.english, row.english))) plan.unplaced.push({ row, reason: "No string of the site's own words has this English." });
  }
  return plan;
}

/// A dictionary file as it is kept in the repo (src/lib/i18n/ar.ts, ja.ts).
export function renderDictionary(entries: Map<string, string>, language: "ar" | "ja", label: string): string {
  const tree: Record<string, Record<string, string>> = {};
  for (const [key, text] of entries) {
    const [area, name] = key.split(".");
    (tree[area] ??= {})[name] = text;
  }
  const body = Object.entries(tree).map(([area, names]) => [`  ${area}: {`, ...Object.entries(names).map(([name, text]) => `    ${name}: ${JSON.stringify(text)},`), "  },"].join("\n")).join("\n");
  return `import type { Translation } from "./en";

// ${label}. Generated from the translation sheet (KPD-translations-AR-JA.xlsx):
// every entry has a sheet row with exactly the English text of its key. Keys
// the sheet does not cover yet are left out, so English shows for them (see
// index.ts). All rows are drafts until the client's reviewers approve them.
const ${language}: Translation = {
${body}
};

export default ${language};
`;
}
