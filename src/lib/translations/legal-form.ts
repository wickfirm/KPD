// ─────────────────────────────────────────────────────────────────────────────
// The legal translation form. Terms, Privacy and Cookies are not CMS content:
// the English document is the client's text in src/lib/terms-defaults.ts. An
// Arabic or Japanese tab shows that document, line by line, and stores what the
// editor writes as a translation laid over it. Pure, so the form (client) and
// its save action (server) name the fields the same way.
// ─────────────────────────────────────────────────────────────────────────────

import type { LegalDocument } from "@/lib/terms-defaults";

export const legalFormFields = {
  contactHeading: "legalContactHeading",
  contactText: "legalContactText",
  title: "docTitle",
  sectionHeading: (section: number) => `docS${section}Heading`,
  /// A paragraph's text.
  pieceText: (section: number, piece: number) => `docS${section}P${piece}`,
  /// One line of a list.
  pieceItem: (section: number, piece: number, item: number) => `docS${section}P${piece}I${item}`,
  cardTitle: (section: number, piece: number, card: number) => `docS${section}P${piece}C${card}Title`,
  cardText: (section: number, piece: number, card: number) => `docS${section}P${piece}C${card}Text`,
  header: (section: number, piece: number, column: number) => `docS${section}P${piece}H${column}`,
  cell: (section: number, piece: number, row: number, column: number) => `docS${section}P${piece}R${row}C${column}`,
} as const;

/// True for every field of the legal translation form.
export function isLegalFormField(name: string): boolean {
  return name === legalFormFields.contactHeading || name === legalFormFields.contactText || name.startsWith("doc");
}

type FormReader = { get(name: string): FormDataEntryValue | null };

/// The document with the form's text wherever the editor wrote some. A box
/// left empty keeps the line it was showing, so clearing a box is not a way to
/// remove a line: the save compares this with the English document and stores
/// only what differs.
export function legalDocumentFromForm(document: LegalDocument, form: FormReader): LegalDocument {
  const line = (name: string, shown: string) => {
    const value = form.get(name);
    return typeof value === "string" && value.trim() ? value : shown;
  };
  return {
    ...document,
    title: line(legalFormFields.title, document.title),
    sections: document.sections.map((section, sectionIndex) => ({
      ...section,
      heading: line(legalFormFields.sectionHeading(sectionIndex), section.heading),
      pieces: section.pieces.map((piece, pieceIndex) => {
        if (piece.type === "paragraph") return { ...piece, text: line(legalFormFields.pieceText(sectionIndex, pieceIndex), piece.text) };
        if (piece.type === "items" || piece.type === "chips") {
          return { ...piece, items: piece.items.map((item, itemIndex) => line(legalFormFields.pieceItem(sectionIndex, pieceIndex, itemIndex), item)) };
        }
        if (piece.type === "cards") {
          return {
            ...piece,
            cards: piece.cards.map((card, cardIndex) => ({
              ...card,
              title: line(legalFormFields.cardTitle(sectionIndex, pieceIndex, cardIndex), card.title),
              text: line(legalFormFields.cardText(sectionIndex, pieceIndex, cardIndex), card.text),
            })),
          };
        }
        return {
          ...piece,
          headers: piece.headers.map((header, column) => line(legalFormFields.header(sectionIndex, pieceIndex, column), header)) as typeof piece.headers,
          rows: piece.rows.map((row, rowIndex) => row.map((cell, column) => line(legalFormFields.cell(sectionIndex, pieceIndex, rowIndex, column), cell)) as typeof row),
        };
      }),
    })),
  };
}
