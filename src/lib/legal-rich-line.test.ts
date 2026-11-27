import { describe, expect, it } from "vitest";
import { legalDocuments, type LegalPiece } from "@/lib/terms-defaults";
import { richParts } from "./legal-rich-line";

const stringsOf = (piece: LegalPiece): string[] => {
  switch (piece.type) {
    case "paragraph": return [piece.text];
    case "items":
    case "chips": return piece.items;
    case "cards": return piece.cards.flatMap((card) => [card.title, card.text]);
    case "table": return [...piece.headers, ...piece.rows.flat()];
  }
};
// Every line of the three documents, as the page shows them in English.
const lines = legalDocuments.flatMap((document) => document.sections.flatMap((section) => section.pieces.flatMap(stringsOf)));
const before = (value: string) => value.split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|Privacy Policy)/g);

describe("richParts", () => {
  it("splits the English document exactly as the page always has", () => {
    expect(lines.length).toBeGreaterThan(100);
    for (const line of lines) expect(richParts(line, "Privacy Policy")).toEqual(before(line));
  });

  it("finds the Privacy Policy in a translated document by the tab's own label", () => {
    expect(richParts("تُعالَج المعلومات وفقًا لما هو موضّح في سياسة الخصوصية أدناه.", "سياسة الخصوصية")).toEqual(["تُعالَج المعلومات وفقًا لما هو موضّح في ", "سياسة الخصوصية", " أدناه."]);
    expect(richParts("下記のプライバシーポリシーに従って取り扱われます。", "プライバシーポリシー")).toEqual(["下記の", "プライバシーポリシー", "に従って取り扱われます。"]);
  });

  it("leaves the words alone where no reference is given: another company's policy is not KPD's", () => {
    expect(richParts("これらの提供者には、それぞれのプライバシーポリシーがあり、利用方法はそれに従います。", null)).toEqual(["これらの提供者には、それぞれのプライバシーポリシーがあり、利用方法はそれに従います。"]);
    expect(richParts("Our privacy policy explains this; write to info@kpd.ae.", null)).toEqual(["Our privacy policy explains this; write to ", "info@kpd.ae", "."]);
  });

  it("does not take a longer phrase that merely holds the label's first words", () => {
    expect(richParts("プライバシーの取り扱いについて", "プライバシーポリシー")).toEqual(["プライバシーの取り扱いについて"]);
    expect(richParts("ممارساتها المتعلقة بالخصوصية", "سياسة الخصوصية")).toEqual(["ممارساتها المتعلقة بالخصوصية"]);
  });

  it("still makes an address a link, beside the label", () => {
    expect(richParts("See https://kpd.ae/terms and info@kpd.ae, then سياسة الخصوصية.", "سياسة الخصوصية")).toEqual(["See ", "https://kpd.ae/terms", " and ", "info@kpd.ae", ", then ", "سياسة الخصوصية", "."]);
  });
});

describe("the lines of the English document", () => {
  it("name the Privacy Policy in one line only, the Terms' own", () => {
    const naming = legalDocuments.flatMap((document) => document.sections.flatMap((section) => section.pieces.flatMap((piece, index) => (piece.type === "paragraph" && piece.text.includes("Privacy Policy") ? [`${document.id}: ${section.heading} #${index}`] : []))));
    expect(naming).toEqual(["terms: Submissions #0"]);
  });
});
