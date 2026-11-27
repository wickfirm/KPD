import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mergeLocale, translationDiff } from "@/lib/translations/merge-locale";
import { atPath, classify, columnOf, csvRecords, dictionaryEntries, fieldOf, hasBullet, LEGAL_PAGE_SLUGS, legalDocumentFor, planDictionary, planRows, placeRow, readSheet, renderDictionary, textLeaves, unzip, withPath, withoutBullet } from "@/lib/translations/import-sheet";

// The client's translation sheet: where each of its rows goes is decided by
// its English, and a row that cannot be placed with certainty is reported
// rather than guessed. Nothing here can change an English value.

/// A small workbook, stored uncompressed, holding the sheets given.
function workbook(sheets: Record<string, string>, shared: string[] = []): Uint8Array {
  const encoder = new TextEncoder();
  const files: Record<string, string> = {
    "xl/workbook.xml": `<workbook><sheets><sheet name="Translations" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`,
    "xl/sharedStrings.xml": `<sst>${shared.map((value) => `<si><t>${value}</t></si>`).join("")}</sst>`,
    ...Object.fromEntries(Object.entries(sheets).map(([name, xml]) => [`xl/worksheets/${name}`, xml])),
  };
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    header.set(nameBytes, 30);
    const entry = new Uint8Array(46 + nameBytes.length);
    const directory = new DataView(entry.buffer);
    directory.setUint32(0, 0x02014b50, true);
    directory.setUint16(4, 20, true);
    directory.setUint32(20, data.length, true);
    directory.setUint32(24, data.length, true);
    directory.setUint16(28, nameBytes.length, true);
    directory.setUint32(42, offset, true);
    entry.set(nameBytes, 46);
    local.push(header, data);
    central.push(entry);
    offset += header.length + data.length;
  }
  const body = new Uint8Array(local.reduce((length, part) => length + part.length, 0));
  let at = 0;
  for (const part of local) { body.set(part, at); at += part.length; }
  const entries = new Uint8Array(central.reduce((length, part) => length + part.length, 0));
  at = 0;
  for (const part of central) { entries.set(part, at); at += part.length; }
  const end = new Uint8Array(22);
  const directory = new DataView(end.buffer);
  directory.setUint32(0, 0x06054b50, true);
  directory.setUint16(10, central.length, true);
  directory.setUint32(12, entries.length, true);
  directory.setUint32(16, body.length, true);
  const all = new Uint8Array(body.length + entries.length + end.length);
  all.set(body);
  all.set(entries, body.length);
  all.set(end, body.length + entries.length);
  return all;
}

const SHEET = `<worksheet><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c><c r="G1" t="s"><v>6</v></c></row>
<row r="2"><c r="A2" t="s"><v>7</v></c><c r="B2" t="inlineStr"><is><t>about.heading</t></is></c><c r="C2" t="s"><v>8</v></c><c r="D2" t="s"><v>9</v></c><c r="E2" t="s"><v>10</v></c><c r="F2" t="s"><v>11</v></c><c r="G2" t="s"><v>12</v></c></row>
<row r="4"><c r="B4" t="inlineStr"><is><t>about.bandLinkLabel</t></is></c><c r="C4" t="inlineStr"><is><t>About us &amp; more</t></is></c><c r="D4" t="inlineStr"><is><t>عن الشركة</t></is></c><c r="G4" t="inlineStr"><is><t>Approved</t></is></c></row>
</sheetData></worksheet>`;
const SHARED = ["Page / area", "Key (do not edit)", "English", "Arabic", "Japanese", "Notes", "Status", "About (36)", "About Us", "عن كاسوميغاساكي", "私たちについて", "note", "Draft"];

describe("reading the workbook", () => {
  it("reads the cells of the Translations sheet as rows", () => {
    const rows = readSheet(workbook({ "sheet1.xml": SHEET }, SHARED));
    expect(rows).toEqual([
      { row: 2, area: "About (36)", key: "about.heading", english: "About Us", arabic: "عن كاسوميغاساكي", japanese: "私たちについて", status: "Draft" },
      { row: 4, area: "", key: "about.bandLinkLabel", english: "About us & more", arabic: "عن الشركة", japanese: "", status: "Approved" },
    ]);
  });

  it("unzips a stored archive and names its files without a leading slash", () => {
    const files = unzip(workbook({ "sheet1.xml": SHEET }, SHARED));
    expect([...files.keys()]).toContain("xl/workbook.xml");
    expect(new TextDecoder().decode(files.get("xl/worksheets/sheet1.xml"))).toContain("<sheetData>");
  });

  it("refuses a file that is not a spreadsheet", () => {
    expect(() => unzip(new TextEncoder().encode("not a zip"))).toThrow(/not a spreadsheet/i);
  });

  it.each([["A", 0], ["B", 1], ["Z", 25], ["AA", 26], ["AB", 27], ["", -1], ["1", -1]])("column %s → %s", (letters, index) => {
    expect(columnOf(letters)).toBe(index);
  });
});

describe("a list of rows as a CSV file", () => {
  /// The rows of SHEET as Excel writes them: quotes only where a field needs one.
  const COLUMNS = '#,"Page / area","Key (do not edit)",English,Arabic,Japanese,Notes,Status';
  const CSV = [
    COLUMNS,
    ',"About (36)",about.heading,About Us,عن كاسوميغاساكي,私たちについて,note,Draft',
    ',,about.bandLinkLabel,"About us & more",عن الشركة,,note,Approved',
  ].join("\r\n");
  const of = (source: string) => readSheet(new TextEncoder().encode(source));

  it("reads the same rows as the workbook", () => {
    expect(of(CSV)).toEqual([
      { row: 2, area: "About (36)", key: "about.heading", english: "About Us", arabic: "عن كاسوميغاساكي", japanese: "私たちについて", status: "Draft" },
      { row: 3, area: "", key: "about.bandLinkLabel", english: "About us & more", arabic: "عن الشركة", japanese: "", status: "Approved" },
    ]);
  });

  it("numbers a row by its # cell where that is a number, as the list sent to the translators does", () => {
    expect(of([COLUMNS, '597,"Menu & footer (code)",nav.siteMenu,Site menu,قائمة الموقع,,For screen readers.,Draft'].join("\n")).map((row) => row.row)).toEqual([597]);
  });

  it("keeps a comma, a quote and a line break that a field holds", () => {
    expect(of(['"Page / area","Key (do not edit)",English,Arabic,Japanese', '"Contact","contact.text[0]","Hello, ""KPD""\nagain",مرحبا,,'].join("\n"))).toEqual([
      { row: 2, area: "Contact", key: "contact.text[0]", english: 'Hello, "KPD"\nagain', arabic: "مرحبا", japanese: "", status: "" },
    ]);
    // A record is known by the line it starts on.
    expect(csvRecords('"a\nb",c\nd,e')).toEqual([{ line: 1, fields: ["a\nb", "c"] }, { line: 3, fields: ["d", "e"] }]);
    expect(csvRecords("a,b\r\nc,d\r\n")).toEqual([{ line: 1, fields: ["a", "b"] }, { line: 2, fields: ["c", "d"] }]);
  });

  it("skips a byte-order mark, blank lines and a row with no text in any language", () => {
    expect(of(`\uFEFF"Page / area","Key (do not edit)",English,Arabic,Japanese\n"About","about.a","About us",عن,\n\n"About","about.b",,,\n"About","about.c","History",,歴史\n`).map((row) => [row.row, row.english])).toEqual([[2, "About us"], [5, "History"]]);
  });

  it("refuses a file whose first line is not the sheet's columns, and a quote left open", () => {
    expect(() => of("not a zip")).toThrow(/not the translation sheet/i);
    expect(() => of("")).toThrow(/not the translation sheet/i);
    expect(() => csvRecords('"open')).toThrow(/left open/i);
  });
});

describe("a row's kind and the place its Key hints at", () => {
  it("tells a page's content, the site's own words and the client's own code apart", () => {
    expect(classify({ area: "About (36)", key: "about.title" })).toMatchObject({ kind: "content", area: "about" });
    expect(classify({ area: "Menu & footer (code)", key: "nav.home" })).toMatchObject({ kind: "code", area: "nav" });
    expect(classify({ area: "News & articles (code)", key: "news.latest" })).toMatchObject({ kind: "code", area: "news" });
    expect(classify({ area: "News page (17)", key: "news.eyebrow" })).toMatchObject({ kind: "content", area: "news" });
    expect(classify({ area: "Mortgage calculator (client code, needs client OK)", key: "calc.title" })).toMatchObject({ kind: "held", area: "calc" });
    expect(classify({ area: "anything", key: "planner.title" }).kind).toBe("held");
  });

  it("reads the Key as a hint: blocks by position, lists by position", () => {
    expect(classify({ area: "About (36)", key: "about.content[5].mission" }).path).toEqual(["content", 5, "mission"]);
    expect(classify({ area: "Home (32)", key: "home.bannerSlides[0].label" }).path).toEqual(["bannerSlides", 0, "label"]);
    expect(classify({ area: "Investor Guide", key: "invest.faq.items[2].question" }).path).toEqual(["faq", "items", 2, "question"]);
    expect(classify({ area: "Article: X", key: "article.some-slug.body[1]" }).path).toEqual(["some-slug", "body", 1]);
  });

  it("finds the text a translation may replace, line by line", () => {
    const english = { heading: "A", ctaUrl: "/x", introParagraphs: ["one", "two"], items: [{ question: "Q?", answer: "A." }], images: ["/a.jpg"] };
    expect(textLeaves(english).map(([path, text]) => [fieldOf(path), text])).toEqual([["heading", "A"], ["introParagraphs", "one"], ["introParagraphs", "two"], ["question", "Q?"], ["answer", "A."]]);
  });
});

describe("where a row's English is", () => {
  const english = { title: "About Us", content: [{ type: "hero", heading: "Built on understanding.", ctaUrl: "/developments" }, { type: "about", mission: "We build for the long term." }], bandLinkLabel: "About us" };

  it("is at the hinted place when the English there is the row's", () => {
    expect(placeRow(english, { english: "Built on understanding." }, ["content", 0, "heading"])).toEqual({ path: ["content", 0, "heading"], byHint: true });
    // The ends of the cell and its line endings do not count.
    expect(placeRow(english, { english: "  Built on understanding.\r\n" }, ["content", 0, "heading"])).toEqual({ path: ["content", 0, "heading"], byHint: true });
  });

  it("is found by its text when the hint does not lead there", () => {
    expect(placeRow(english, { english: "We build for the long term." }, ["bandText"])).toEqual({ path: ["content", 1, "mission"], byHint: false });
    expect(placeRow(english, { english: "About Us" }, ["heading"])).toEqual({ path: ["title"], byHint: false });
  });

  it("is reported, not guessed, when it is not there", () => {
    expect(placeRow(english, { english: "Built on Understanding" }, ["content", 0, "heading"])).toMatchObject({ reason: /not in the page's English content/ });
    expect(placeRow(english, { english: "   " }, ["title"])).toMatchObject({ reason: /no English/ });
  });

  it("is reported when it is in several places and nothing tells them apart", () => {
    const twice = { heading: "Same words", text: "Same words", mission: "Other" };
    expect(placeRow(twice, { english: "Same words" }, ["x"])).toMatchObject({ reason: /in 2 places/ });
    // …and placed when the Key's last name picks one of them.
    expect(placeRow(twice, { english: "Same words" }, ["something", "text"])).toEqual({ path: ["text"], byHint: false });
  });

  it("is never a link, a switch or a style", () => {
    expect(placeRow(english, { english: "/developments" }, ["content", 0, "ctaUrl"])).toMatchObject({ reason: /not a text field/ });
    expect(placeRow({ ctaUrl: "/x" }, { english: "/x" }, ["ctaUrl"])).toMatchObject({ reason: /not a text field/ });
  });

  it("replaces one text and copies everything else", () => {
    const before = structuredClone(english);
    const after = withPath(english, ["content", 1, "mission"], "نحن نبني");
    expect(atPath(after, ["content", 1, "mission"])).toBe("نحن نبني");
    expect(after.content[0]).toBe(english.content[0]);
    expect(english).toEqual(before);
  });
});

describe("the plan for a page", () => {
  const english = { title: "About Us", content: [{ type: "hero", heading: "Built on understanding." }, { type: "about", mission: "We build for the long term.", vision: "To last." }] };
  const rows = [
    { row: 2, area: "About", key: "about.title", english: "About Us", arabic: "عن الشركة", japanese: "私たちについて", status: "Approved" },
    { row: 3, area: "About", key: "about.content[0].heading", english: "Built on understanding.", arabic: "نبني على الفهم.", japanese: "理解の上に築く。", status: "Approved" },
    { row: 4, area: "About", key: "about.content[9].mission", english: "We build for the long term.", arabic: "نبنى على المدى الطويل", japanese: "", status: "Approved" },
    { row: 5, area: "About", key: "about.content[1].vision", english: "To Last.", arabic: "x", japanese: "x", status: "Approved" },
    { row: 6, area: "About", key: "about.oldLine", english: "Gone from the page", arabic: "x", japanese: "x", status: "Approved" },
    { row: 7, area: "FAQ", key: "faq.title", english: "Frequently Asked Questions", arabic: "x", japanese: "x", status: "Approved" },
  ];
  const rootOf = (area: string) => (area === "about" ? { id: "page:about", english } : undefined);

  it("holds back every row the client's reviewers have not approved", () => {
    const drafts = rows.map((row) => ({ ...row, status: "Draft" }));
    const plan = planRows(drafts, rootOf);
    expect(plan.roots.size).toBe(0);
    expect(plan.drafts.map((row) => row.row)).toEqual([2, 3, 4, 5, 6, 7]);
    // Asked for, they go in like approved ones.
    expect(planRows(drafts, rootOf, { allowDrafts: true }).roots.get("page:about")!.rows).toHaveLength(3);
    expect(plan.unplaced).toEqual([]);
  });

  it("lays the approved rows on a copy of the English and leaves the English as it was", () => {
    const before = structuredClone(english);
    const plan = planRows(rows, rootOf);
    expect(english).toEqual(before);
    const about = plan.roots.get("page:about")!;
    expect(about.rows.map((row) => row.row)).toEqual([2, 3, 4]);
    expect(atPath(about.arabic, ["title"])).toBe("عن الشركة");
    // Found by its text where the hint (block 9) was wrong.
    expect(atPath(about.arabic, ["content", 1, "mission"])).toBe("نبنى على المدى الطويل");
    expect(atPath(about.arabic, ["content", 1, "vision"])).toBe("To last.");
    // An empty Japanese cell leaves the English there.
    expect(atPath(about.japanese, ["content", 1, "mission"])).toBe("We build for the long term.");
    expect(atPath(about.japanese, ["title"])).toBe("私たちについて");
  });

  it("reports what it could not place and why", () => {
    const plan = planRows(rows, rootOf);
    expect(plan.unplaced.map(({ row, reason }) => [row.row, reason])).toEqual([
      [5, "Its English is not in the page's English content: the English may have changed since the sheet was written."],
      [6, "Its English is not in the page's English content: the English may have changed since the sheet was written."],
      [7, 'The site has no page for the area "FAQ".'],
    ]);
  });

  it("produces what the editor's language tab would have stored, and nothing more", () => {
    const { arabic } = planRows(rows, rootOf).roots.get("page:about")!;
    const diff = translationDiff(english, arabic);
    expect(diff).toEqual({ title: "عن الشركة", content: [{ type: "hero", heading: "نبني على الفهم." }, { type: "about", mission: "نبنى على المدى الطويل" }] });
    // Laid back over the English, it is the page the visitor should see.
    expect(mergeLocale(english, diff)).toEqual(arabic);
  });

  it("looks an article up by the slug in its Key", () => {
    const article = { title: "A note", body: ["First paragraph.", "Second paragraph."] };
    const plan = planRows(
      [{ row: 2, area: "Article: X", key: "article.some-slug.body[1]", english: "Second paragraph.", arabic: "الفقرة الثانية.", japanese: "二番目。", status: "Approved" }],
      (area) => (area === "article" ? { id: "article:some-slug", english: article } : undefined),
    );
    expect(atPath(plan.roots.get("article:some-slug")!.arabic, ["body", 1])).toBe("الفقرة الثانية.");
  });
});

describe("a line of a list in the sheet", () => {
  // The sheet copies a line as a reader sees it, with the bullet the page
  // draws itself; the page's own text, and what it stores, have none.
  it("is told by its bullet, and has it taken off", () => {
    expect(hasBullet("• Violate any applicable law")).toBe(true);
    expect(hasBullet("•  اختر")).toBe(true);
    expect(hasBullet("Terms and Conditions")).toBe(false);
    expect(hasBullet("5% yield")).toBe(false);
    expect(withoutBullet("• Violate any applicable law")).toBe("Violate any applicable law");
    expect(withoutBullet("Terms and Conditions")).toBe("Terms and Conditions");
  });

  it("then matches the page's own line of the list", () => {
    const english = { sections: [{ heading: "Acceptance", pieces: [{ type: "items", items: ["Violate any applicable law", "Involve fraudulent activity"] }] }] };
    const row = { english: "• Involve fraudulent activity" };
    expect(placeRow(english, row, ["content", 5, "text"])).toMatchObject({ reason: /not in the page's English content/ });
    expect(placeRow(english, { english: withoutBullet(row.english) }, ["content", 5, "text"])).toEqual({ path: ["sections", 0, "pieces", 0, "items", 1], byHint: false });
  });
});

describe("the site's own words", () => {
  const dictionary = { nav: { home: "Home", about: "About" }, form: { email: "Email", send: "Send enquiry" } };
  const code = (key: string, english: string, arabic: string, status = "Draft") => ({ row: 0, area: "Menu & footer (code)", key, english, arabic, japanese: "", status });

  it("matches a string by its English, the row with the same key first", () => {
    const plan = planDictionary([code("nav.home", "Home", "الرئيسية"), code("nav.somewhere", "Home", "other place"), code("nav.about", "About ", " عن"), code("footer.email", "Email", "بريد"), code("nav.gone", "Gone from the site", "مفقود")], dictionary, { allowDrafts: true });
    expect([...plan.arabic]).toEqual([["nav.home", "الرئيسية"], ["nav.about", "عن"], ["form.email", "بريد"]]);
    expect(plan.missing.map((entry) => entry.key)).toEqual(["form.send"]);
    // A second row with the same English as one with the right key simply loses to it; a row whose English is nowhere is reported.
    expect(plan.unplaced.map(({ row }) => row.key)).toEqual(["nav.gone"]);
  });

  it("holds drafts back unless asked", () => {
    expect(planDictionary([code("nav.home", "Home", "الرئيسية")], dictionary).arabic.size).toBe(0);
    expect(planDictionary([code("nav.home", "Home", "الرئيسية", "Approved")], dictionary).arabic.get("nav.home")).toBe("الرئيسية");
  });

  it("lists every string of the English dictionary", () => {
    expect(dictionaryEntries(dictionary)).toEqual([{ key: "nav.home", english: "Home" }, { key: "nav.about", english: "About" }, { key: "form.email", english: "Email" }, { key: "form.send", english: "Send enquiry" }]);
  });

  it("does not let one entry of a list translate a label elsewhere", () => {
    // "About" is also the second of some page's choices: that row is an entry of a list.
    const option = { ...code("contact.customerNatures[1]", "About", "خيار"), area: "Contact" };
    expect(planDictionary([option], dictionary, { allowDrafts: true }).arabic.size).toBe(0);
  });

  it("ranks a row of the client's calculator with the site's own words, ahead of a page's row", () => {
    // Neither choice translates the calculator: the row is used for a string of the site's that has the same English.
    const page = { ...code("chrome.labels.email", "Email", "صفحة"), area: "seven x seven (development page)" };
    const calculator = { ...code("calc.email", "Email", "حاسبة"), area: "Mortgage calculator (client code, needs client OK)" };
    expect(planDictionary([page, calculator], dictionary, { allowDrafts: true }).arabic.get("form.email")).toBe("حاسبة");
    expect(planDictionary([page], dictionary, { allowDrafts: true }).arabic.get("form.email")).toBe("صفحة");
  });

  it("writes a dictionary file in the shape the repo keeps", () => {
    const file = renderDictionary(new Map([["nav.home", "الرئيسية"], ["form.email", "بريد"]]), "ar", "Arabic");
    expect(file).toContain(`const ar: Translation = {
  nav: {
    home: "الرئيسية",
  },
  form: {
    email: "بريد",
  },
};

export default ar;`);
    expect(file).toContain("Generated from the translation sheet");
  });
});

describe("which pages show a legal document", () => {
  // Until 27 Nov 2026 the importer took `legalTabForSlug` at its word for every
  // page. It answers "terms" for any slug but Privacy and Cookies, so the About,
  // Contact, History, Investor Guide and FAQ pages were all matched against the
  // Terms document, and every row of theirs was left out as "not found".
  it("are the three legal pages, and no others", () => {
    expect([...LEGAL_PAGE_SLUGS].sort()).toEqual(["cookie-policy", "privacy-policy", "terms"]);
    expect(legalDocumentFor("terms")?.id).toBe("terms");
    expect(legalDocumentFor("privacy-policy")?.id).toBe("privacy");
    expect(legalDocumentFor("cookie-policy")?.id).toBe("cookies");
  });

  it("is never an ordinary page, whatever the tab function answers for it", () => {
    for (const slug of ["about", "contact", "faq", "legacy", "invest-in-dubai", "seven-x-seven", "news", "Terms", " terms"]) {
      expect(legalDocumentFor(slug), slug).toBeUndefined();
    }
  });

  it("and the command asks it this way, not the tab function, which has no such limit", () => {
    const command = readFileSync(join(process.cwd(), "scripts/import-translations.ts"), "utf8");
    expect(command).toContain("legalDocumentFor(slug)");
    expect(command).not.toMatch(/\blegalTabForSlug\b/);
  });
});

describe("rows of several articles", () => {
  // The sheet names an article in its Key ("article.<slug>.title") and holds
  // rows for more than one. Until 27 Nov 2026 the importer read the first
  // article's English alone and matched the other articles' rows against it.
  const rows = [
    { row: 1, area: "Article: first", key: "article.first.title", english: "First article", arabic: "الأول", japanese: "一つ目", status: "Draft" },
    { row: 2, area: "Article: second", key: "article.second.title", english: "Second article", arabic: "الثاني", japanese: "二つ目", status: "Draft" },
  ];
  const rootOfSlug = new Map([
    ["first", { english: { title: "First article", body: [] }, id: "article:first" }],
    ["second", { english: { title: "Second article", body: [] }, id: "article:second" }],
  ]);

  it("are each matched against the article their Key names", () => {
    const plan = planRows(rows, (area, row) => rootOfSlug.get(String(classify(row).path[0])), { allowDrafts: true });
    expect([...plan.roots.keys()]).toEqual(["article:first", "article:second"]);
    expect(plan.unplaced).toEqual([]);
    expect(plan.roots.get("article:second")?.arabic).toMatchObject({ title: "الثاني" });
  });

  it("and the command gives each article a root of its own", () => {
    const command = readFileSync(join(process.cwd(), "scripts/import-translations.ts"), "utf8");
    expect(command).toMatch(/for \(const slug of articleSlugs\)/);
  });
});
