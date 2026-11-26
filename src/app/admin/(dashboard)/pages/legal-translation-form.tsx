"use client";

import { useActionState, useRef } from "react";
import { saveStaticPageTranslation, type StaticPageFormState } from "../actions";
import { isLegalFormField, legalFormFields as field } from "@/lib/translations/legal-form";
import { languageNames, type Locale } from "@/lib/locales";
import type { LegalDocument } from "@/lib/terms-defaults";
import { useTranslationMode } from "@/components/admin/translation-mode";

const initialState: StaticPageFormState = {};
const isTextField = (name: string) => isLegalFormField(name);

/// The Arabic or Japanese tab of a legal page. Terms, Privacy and Cookies are
/// the client's English document (src/lib/terms-defaults.ts), not CMS content,
/// so this tab shows that document line by line with the translation in it.
/// A line left as it is stays English on the page; nothing here can change the
/// English document.
export default function LegalTranslationForm({ pageId, returnTo, document, contact, lang, englishId }: {
  pageId: string;
  returnTo: string;
  document: LegalDocument;
  contact: { heading: string; text: string };
  lang: Locale;
  englishId: string;
}) {
  const [state, formAction, pending] = useActionState(saveStaticPageTranslation, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useTranslationMode(formRef, { lang, englishId, textFields: isTextField });
  return <form ref={formRef} action={formAction}>
    <input type="hidden" name="id" value={pageId} />
    <input type="hidden" name="returnTo" value={returnTo} />
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <label className="cms-field"><span>Document title</span><input name={field.title} defaultValue={document.title} /></label>
    {document.sections.map((section, sectionIndex) => <section className="cms-editor-section" key={sectionIndex}>
      <h3 className="cms-subheading">Section {sectionIndex + 1} of {document.sections.length}</h3>
      <label className="cms-field"><span>Section heading</span><input name={field.sectionHeading(sectionIndex)} defaultValue={section.heading} /></label>
      {section.pieces.map((piece, pieceIndex) => {
        if (piece.type === "paragraph") {
          return <label className="cms-field" key={pieceIndex}><span>Paragraph</span><textarea name={field.pieceText(sectionIndex, pieceIndex)} rows={4} defaultValue={piece.text} /></label>;
        }
        if (piece.type === "items" || piece.type === "chips") {
          return <div className="cms-editor-section" key={pieceIndex}><h4 className="cms-subheading">{piece.type === "chips" ? "Labels" : "List"}</h4>
            <div className="cms-grid">{piece.items.map((item, itemIndex) => <label className="cms-field" key={itemIndex}><span>Line {itemIndex + 1}</span><input name={field.pieceItem(sectionIndex, pieceIndex, itemIndex)} defaultValue={item} /></label>)}</div>
          </div>;
        }
        if (piece.type === "cards") {
          return <div className="cms-editor-section" key={pieceIndex}><h4 className="cms-subheading">Cards</h4>
            {piece.cards.map((card, cardIndex) => <div className="cms-grid" key={cardIndex}>
              <label className="cms-field"><span>Card {cardIndex + 1} title</span><input name={field.cardTitle(sectionIndex, pieceIndex, cardIndex)} defaultValue={card.title} /></label>
              <label className="cms-field"><span>Card {cardIndex + 1} text</span><textarea name={field.cardText(sectionIndex, pieceIndex, cardIndex)} rows={2} defaultValue={card.text} /></label>
            </div>)}
          </div>;
        }
        return <div className="cms-editor-section" key={pieceIndex}><h4 className="cms-subheading">Table</h4>
          <div className="cms-grid">{piece.headers.map((header, column) => <label className="cms-field" key={column}><span>Column {column + 1} heading</span><input name={field.header(sectionIndex, pieceIndex, column)} defaultValue={header} /></label>)}</div>
          {piece.rows.map((row, rowIndex) => <div className="cms-grid" key={rowIndex}>{row.map((cell, column) => <label className="cms-field" key={column}><span>Row {rowIndex + 1} — {piece.headers[column]}</span><textarea name={field.cell(sectionIndex, pieceIndex, rowIndex, column)} rows={2} defaultValue={cell} /></label>)}</div>)}
        </div>;
      })}
    </section>)}
    <section className="cms-editor-section">
      <h3 className="cms-subheading">Questions block</h3>
      <label className="cms-field"><span>Heading</span><input name={field.contactHeading} defaultValue={contact.heading} /></label>
      <label className="cms-field"><span>Text</span><textarea name={field.contactText} rows={2} defaultValue={contact.text} /></label>
    </section>
    <div className="cms-actions"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : `Save ${languageNames[lang]} translation`}</button></div>
  </form>;
}
