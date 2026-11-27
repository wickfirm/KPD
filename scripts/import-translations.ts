// Loads the client's translation sheet into the site.
//
//   npm run translations:import -- <options>
//   npx tsx scripts/import-translations.ts <options>
//
//     --sheet <file>     the workbook (KPD-translations-AR-JA.xlsx), or a CSV
//                        file with its columns (a list sent to the translators,
//                        come back: docs/translations/*.csv). It may be given
//                        more than once, and all the rows are read together.
//                        The workbook is looked for beside the repo, in the
//                        working directory and in ~/Downloads when left out.
//     --allow-drafts     also load rows the client's reviewers have not marked
//                        "Approved". The brief allows it, by agreement, while
//                        the language switch is off.
//     --sql <file>       write the SQL for the Supabase SQL Editor instead of
//                        touching a database. Run prisma/add-translations.sql
//                        first. Safe to run more than once.
//     --write --yes      save into the database DATABASE_URL points at.
//     --dictionaries     rewrite src/lib/i18n/ar.ts and ja.ts from the rows of
//                        the site's own words. Every file is needed for this:
//                        it refuses to write while a string that is translated
//                        now would have no row.
//
// With none of --sql, --write and --dictionaries it only reports. The English
// content is always read from the database, to match the sheet's rows against.
//
// A row is placed by its English, never by its Key alone; what cannot be placed
// with certainty is listed, not guessed. An English value is never changed:
// only a language's own row is written, and only text goes into it — the same
// rule, and the same code, as the editor's language tab.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../src/lib/db";
import en from "../src/lib/i18n/en";
import ar from "../src/lib/i18n/ar";
import { getGlobalSettings } from "../src/lib/site-contact";
import { loadHomeSettings } from "../src/lib/home-saved";
import { loadNewsListingCopy } from "../src/lib/news-listing";
import { loadSxsContent } from "../src/lib/sxs-content";
import { parseProjectChrome, projectChromeKey } from "../src/lib/project-chrome";
import { legalDocuments, legalTabForSlug } from "../src/lib/terms-defaults";
import { classify, dictionaryEntries, hasBullet, legalPageEnglish, planDictionary, planRows, readSheet, renderDictionary, withoutBullet, type Plan, type Root, type SheetRow, type Unplaced } from "../src/lib/translations/import-sheet";
import { mergeLocale } from "../src/lib/translations/merge-locale";
import { diffOf, textOrNull, writeArticleTranslation, writePageTranslation, writeSettingTranslation } from "../src/lib/translations/store";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["ar", "ja"] as const;
type Locale = (typeof LOCALES)[number];

/// The sheet's areas that are a page, by the first word of their Key.
const PAGES: Record<string, string> = {
  about: "about", legacy: "legacy", contact: "contact", invest: "invest-in-dubai", faq: "faq",
  terms: "terms", "privacy-policy": "privacy-policy", "cookie-policy": "cookie-policy",
};
/// … and those that are a saved setting.
const SETTINGS: Record<string, string> = { global: "global", home: "home", sxs: "sxs", units: "sxs", legend: "sxs", news: "news_listing" };

type Target = { kind: "setting"; key: string } | { kind: "page"; id: string } | { kind: "article"; id: string };

// ── Options ──────────────────────────────────────────────────────────────────

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  const value = index < 0 ? undefined : process.argv[index + 1];
  return value === undefined || value.startsWith("--") ? undefined : value;
}

/// Every value given for an option that may be given more than once.
function list(name: string): string[] {
  return process.argv.flatMap((argument, index) => {
    const value = process.argv[index + 1];
    return argument === `--${name}` && value !== undefined && !value.startsWith("--") ? [value] : [];
  });
}

function options() {
  const flags = new Set(process.argv.slice(2).filter((argument) => argument.startsWith("--")));
  const given = list("sheet");
  const sheets = given.length ? given : [repo, process.cwd(), join(homedir(), "Downloads")].map((folder) => join(folder, "KPD-translations-AR-JA.xlsx")).filter((file) => existsSync(file)).slice(0, 1);
  if (!sheets.length) throw new Error("The workbook was not found: pass --sheet <file> (KPD-translations-AR-JA.xlsx).");
  const sql = flags.has("--sql") ? option("sql") ?? join(repo, "prisma", "import-translations.sql") : undefined;
  return { sheets, sql, write: flags.has("--write"), yes: flags.has("--yes"), dictionaries: flags.has("--dictionaries"), allowDrafts: flags.has("--allow-drafts") };
}

/// The site reads its settings from .env.local (gitignored); a script does that itself.
function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = join(repo, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
    if (process.env.DATABASE_URL) return;
  }
}

// ── The English content, and what is translated in it already ───────────────

const translatedRow = (value: unknown) => (value && typeof value === "object" ? value : undefined);
const merge = (english: unknown, row: Record<string, unknown> | undefined, fields: string[]) =>
  row ? mergeLocale(english, Object.fromEntries(fields.flatMap((field) => (row[field] != null ? [[field, row[field]]] : [])))) : english;

async function rootOf(target: Target, slug: string): Promise<Root | undefined> {
  const id = `${target.kind}:${target.kind === "setting" ? target.key : target.id}`;
  if (target.kind === "setting") {
    const english = await (async () => {
      switch (target.key) {
        case "global": return getGlobalSettings();
        case "home": return loadHomeSettings();
        case "sxs": return loadSxsContent();
        case "news_listing": return loadNewsListingCopy();
        default: return parseProjectChrome((await db.siteSetting.findUnique({ where: { key: target.key } }))?.value);
      }
    })();
    const saved = await db.siteSetting.findMany({ where: { key: { in: LOCALES.map((locale) => `${target.key}:${locale}`) } } });
    const inLanguage = (locale: Locale) => mergeLocale(english, translatedRow(saved.find((row) => row.key === `${target.key}:${locale}`)?.value));
    return { english, id, translated: { ar: inLanguage("ar"), ja: inLanguage("ja") } };
  }
  if (target.kind === "page") {
    const page = await db.staticPage.findUnique({ where: { slug }, select: { id: true, title: true, content: true } });
    if (!page) return undefined;
    // A legal page shows a fixed document (src/lib/terms-defaults.ts) and the
    // editor's language tab translates that document, section by section, as
    // an overlay: a contact block and a document block. The sheet's rows are
    // matched against those, which is what the page shows, not against the
    // page's saved blocks.
    const document = legalDocuments.find((candidate) => candidate.id === legalTabForSlug(slug));
    if (document) {
      const savedContact = Array.isArray(page.content) ? page.content.find((block) => block && typeof block === "object" && (block as { type?: string }).type === "legal-contact") : undefined;
      const english = legalPageEnglish(document, savedContact as object | undefined);
      const saved = await db.pageTranslation.findMany({ where: { pageId: page.id, locale: { in: [...LOCALES] } } });
      const inLanguage = (locale: Locale) => merge(english, saved.find((row) => row.locale === locale), ["content"]);
      return { english, id: `page:${page.id}`, translated: { ar: inLanguage("ar"), ja: inLanguage("ja") } };
    }
    const english = { title: page.title ?? "", content: page.content };
    const saved = await db.pageTranslation.findMany({ where: { pageId: page.id, locale: { in: [...LOCALES] } } });
    const inLanguage = (locale: Locale) => merge(english, saved.find((row) => row.locale === locale), ["title", "content"]);
    return { english, id: `page:${page.id}`, translated: { ar: inLanguage("ar"), ja: inLanguage("ja") } };
  }
  const article = await db.article.findFirst({ where: { slug }, select: { id: true, title: true, summary: true, body: true, coverImageAlt: true } });
  if (!article) return undefined;
  const english = { title: article.title, summary: article.summary, body: article.body, coverImageAlt: article.coverImageAlt ?? "" };
  const saved = await db.articleTranslation.findMany({ where: { articleId: article.id, locale: { in: [...LOCALES] } } });
  const inLanguage = (locale: Locale) => merge(english, saved.find((row) => row.locale === locale), ["title", "summary", "body", "coverImageAlt"]);
  return { english, id: `article:${article.id}`, translated: { ar: inLanguage("ar"), ja: inLanguage("ja") } };
}

/// Decides where every row goes. A development's page wording ("chrome.…")
/// belongs to the development its area names, so those rows are planned one
/// development at a time.
async function planEverything(rows: SheetRow[], targets: Map<string, Target>, allowDrafts: boolean): Promise<Plan> {
  const whole: Plan = { roots: new Map(), unplaced: [], drafts: [], held: [] };
  const isChrome = (row: SheetRow) => classify(row).area === "chrome";
  const add = (part: Plan) => {
    for (const [id, entry] of part.roots) whole.roots.set(id, entry);
    whole.unplaced.push(...part.unplaced);
    whole.drafts.push(...part.drafts);
    whole.held.push(...part.held);
  };

  const pages = rows.filter((row) => !isChrome(row));
  const roots = new Map<string, Root>();
  for (const area of new Set(pages.map((row) => classify(row).area))) {
    // An article's area is named by the slug in its Key.
    const slug = area === "article" ? String(classify(pages.find((row) => classify(row).area === area)!).path[0]) : PAGES[area] ?? SETTINGS[area];
    const target: Target = area === "article" ? { kind: "article", id: slug } : PAGES[area] ? { kind: "page", id: slug } : { kind: "setting", key: SETTINGS[area] };
    if (!slug) continue;
    const root = await rootOf(target, slug);
    if (root) {
      roots.set(area, root);
      targets.set(root.id, target.kind === "page" || target.kind === "article" ? { ...target, id: root.id.split(":")[1] } : target);
    }
  }
  add(planRows(pages, (area) => roots.get(area), { allowDrafts }));

  const developments = new Map<string, SheetRow[]>();
  for (const row of rows.filter(isChrome)) {
    const name = row.area.replace(/\s*\(development page\)\s*$/i, "").trim();
    developments.set(name, [...(developments.get(name) ?? []), row]);
  }
  for (const [name, group] of developments) {
    const project = await db.project.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true } });
    if (!project) {
      whole.unplaced.push(...group.map((row): Unplaced => ({ row, reason: `The site has no development called "${name}".` })));
      continue;
    }
    const target: Target = { kind: "setting", key: projectChromeKey(project.id) };
    const root = (await rootOf(target, name))!;
    targets.set(root.id, target);
    add(planRows(group, () => root, { allowDrafts }));
  }
  return whole;
}

// ── Writing ──────────────────────────────────────────────────────────────────

/// One language's row of a page or setting, as SQL for the Supabase SQL Editor.
/// It is what the editor's language tab would store (the same diff).
function sqlFor(target: Target, locale: Locale, english: unknown, built: unknown): string | null {
  const json = (value: unknown) => `$kpd$${JSON.stringify(value)}$kpd$::jsonb`;
  const text = (value: unknown) => (textOrNull(value) === null ? "null" : `$kpd$${String(value)}$kpd$`);
  const id = `replace(gen_random_uuid()::text, '-', '')`;
  const upsert = (update: string) => `on conflict (${target.kind === "setting" ? '"key"' : `"${target.kind}Id", "locale"`}) do update set ${update};`;
  if (target.kind === "setting") {
    const diff = diffOf(english, built);
    return diff ? `insert into "site_settings" ("key", "value", "updatedAt")\nvalues (${text(`${target.key}:${locale}`)}, ${json(diff)}, now())\n${upsert(`"value" = excluded."value", "updatedAt" = now()`)}` : null;
  }
  if (target.kind === "page") {
    const diff = diffOf({ title: (english as { title?: string }).title ?? "", content: (english as { content?: unknown }).content ?? null }, { title: (built as { title?: string }).title ?? "", content: (built as { content?: unknown }).content ?? null });
    return diff ? `insert into "page_translations" ("id", "pageId", "locale", "title", "content")\nvalues (${id}, ${text(target.id)}, ${text(locale)}, ${text(diff.title)}, ${diff.content === undefined ? "null" : json(diff.content)})\n${upsert(`"title" = excluded."title", "content" = excluded."content"`)}` : null;
  }
  const e = english as Record<string, unknown>;
  const b = built as Record<string, unknown>;
  const diff = diffOf({ title: e.title, summary: e.summary, body: e.body, coverImageAlt: e.coverImageAlt ?? "" }, { title: b.title, summary: b.summary, body: b.body, coverImageAlt: b.coverImageAlt ?? "" });
  if (!diff) return null;
  const body = diff.body === undefined ? "null" : typeof diff.body === "string" ? text(diff.body) : json(diff.body);
  return `insert into "article_translations" ("id", "articleId", "locale", "title", "summary", "body", "coverImageAlt")\nvalues (${id}, ${text(target.id)}, ${text(locale)}, ${text(diff.title)}, ${text(diff.summary)}, ${body}, ${text(diff.coverImageAlt)})\n${upsert(`"title" = excluded."title", "summary" = excluded."summary", "body" = excluded."body", "coverImageAlt" = excluded."coverImageAlt"`)}`;
}

// ── The command ──────────────────────────────────────────────────────────────

async function main() {
  const { sheets, sql: sqlFile, write, yes, dictionaries, allowDrafts } = options();
  loadEnv();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set: the English content has to be read to match the sheet's rows against it.");

  // A row that is in more than one file (a returned list is often pasted back
  // into the workbook too) is read once.
  const seen = new Set<string>();
  const rows = sheets.flatMap((sheet) => readSheet(new Uint8Array(readFileSync(sheet)))).filter((row) => {
    const id = [row.area, row.key, row.english, row.arabic, row.japanese, row.status].join("\u0000");
    return seen.has(id) ? false : (seen.add(id), true);
  });
  // The sheet says "alt" where an article's field is "coverImageAlt".
  for (const row of rows) if (classify(row).area === "article") row.key = row.key.replace(/\.alt(\[\d+\])?$/, ".coverImageAlt$1");
  // A line of a list in the sheet carries the bullet the page draws itself.
  for (const row of rows) {
    if (!hasBullet(row.english)) continue;
    row.english = withoutBullet(row.english);
    row.arabic = withoutBullet(row.arabic);
    row.japanese = withoutBullet(row.japanese);
    row.adjusted = "the bullet the page draws itself was taken off the line";
  }

  const targets = new Map<string, Target>();
  const plan = await planEverything(rows, targets, allowDrafts);
  const placed = [...plan.roots.values()].reduce((sum, entry) => sum + entry.rows.length, 0);
  const show = (english: string) => `"${english.replace(/\s+/g, " ").slice(0, 56)}"`;

  console.log(`Sheet${sheets.length > 1 ? "s" : ""}: ${sheets.join(", ")}`);
  console.log(`Rows: ${rows.length}. Status: ${[...rows.reduce((count, row) => count.set(row.status || "(none)", (count.get(row.status || "(none)") ?? 0) + 1), new Map<string, number>())].map(([status, count]) => `${status} ${count}`).join(", ")}.`);
  console.log(`\nPlaced: ${placed} row(s), in ${plan.roots.size} page(s) and setting(s).`);
  for (const [id, entry] of plan.roots) console.log(`  ${id}: ${entry.rows.length}`);
  console.log(`\nNot placed: ${plan.unplaced.length} row(s).`);
  for (const { row, reason } of plan.unplaced) console.log(`  row ${row.row}  [${row.area}]  ${row.key}  ${show(row.english)}\n      ${reason}`);
  const adjusted = [...plan.roots.values()].flatMap((entry) => entry.rows).filter((row) => row.adjusted).length;
  if (adjusted) console.log(`\n${adjusted} placed row(s) were a line of a list: ${"the bullet the page draws itself was taken off the line, and off its translation"}.`);
  if (plan.drafts.length) console.log(`\nHeld back: ${plan.drafts.length} row(s) not marked "Approved"${allowDrafts ? "" : " — pass --allow-drafts to load them"} (the first: ${plan.drafts.slice(0, 5).map((row) => `row ${row.row}`).join(", ")}${plan.drafts.length > 5 ? "…" : ""}).`);
  if (plan.held.length) console.log(`Held back: ${plan.held.length} row(s) of the client's own code (the calculator and the planner): translating them needs his OK.`);

  // The site's own words.
  const words = planDictionary(rows, en, { allowDrafts });
  const strings = dictionaryEntries(en);
  console.log(`\nThe site's own words: ${words.arabic.size} of ${strings.length} strings have Arabic, ${words.japanese.size} Japanese; ${words.missing.length} have no row in the sheet and stay English.`);
  for (const { row, reason } of words.unplaced) console.log(`  row ${row.row}  [${row.area}]  ${row.key}  ${show(row.english)}\n      ${reason}`);

  if (dictionaries) {
    // The dictionaries are written from the rows read: a file left out would
    // take its strings away with it. A string translated now must be
    // translated still.
    const lost = dictionaryEntries(ar).filter((entry) => !words.arabic.has(entry.key));
    if (lost.length) {
      const first = lost[0]!;
      throw new Error(`${lost.length} string(s) of the Arabic dictionary have no row in these files, "${strings.find((entry) => entry.key === first.key)?.english ?? first.key}" (${first.key}) among them: a file is missing. Pass the workbook and every returned list with --sheet.`);
    }
    writeFileSync(join(repo, "src/lib/i18n/ar.ts"), renderDictionary(words.arabic, "ar", "Arabic"));
    writeFileSync(join(repo, "src/lib/i18n/ja.ts"), renderDictionary(words.japanese, "ja", "Japanese"));
    console.log("\nWrote src/lib/i18n/ar.ts and ja.ts.");
  }
  if (sqlFile) {
    const statements = [...plan.roots].flatMap(([id, entry]) => {
      const target = targets.get(id);
      return target ? LOCALES.flatMap((locale) => { const statement = sqlFor(target, locale, entry.english, locale === "ar" ? entry.arabic : entry.japanese); return statement ? [`-- ${id}, ${locale === "ar" ? "Arabic" : "Japanese"}`, statement] : []; }) : [];
    });
    writeFileSync(sqlFile, [
      `-- Generated by scripts/import-translations.ts from ${sheets.map((sheet) => sheet.replace(/\\/g, "/")).join(", ")} on ${new Date().toISOString().slice(0, 10)}.`,
      "-- The sheet's translations, as the editor's language tabs store them.",
      "-- Additive, safe to run more than once. Run prisma/add-translations.sql first.",
      "-- It changes no English value.",
      "set client_encoding = 'UTF8';",
      ...statements,
    ].join("\n\n") + "\n");
    console.log(`\nWrote ${sqlFile} (${statements.length / 2} statement(s)).`);
  }
  if (write) {
    if (!yes) console.log("\nNothing was written: --write also needs --yes.");
    else {
      let written = 0;
      for (const [id, entry] of plan.roots) {
        const target = targets.get(id);
        if (!target) continue;
        for (const locale of LOCALES) {
          const built = locale === "ar" ? entry.arabic : entry.japanese;
          if (target.kind === "setting") await writeSettingTranslation(target.key, locale, entry.english, built);
          else if (target.kind === "page") await writePageTranslation(target.id, locale, entry.english as { title?: string; content?: unknown }, built as { title?: string; content?: unknown });
          else await writeArticleTranslation(target.id, locale, entry.english as never, built as never);
        }
        written += 1;
      }
      console.log(`\nWrote the translations of ${written} page(s) and setting(s) into the database.`);
    }
  }
  if (!sqlFile && !write && !dictionaries) console.log("\nDry run: nothing was written.");
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
