"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { textStyleProps } from "@/lib/text-style";
import type { TextStyle } from "@/lib/text-style";
import { legalContact, legalDocuments, type LegalPiece, type LegalTabId } from "@/lib/terms-defaults";
import type { Locale } from "@/lib/locales";
import { t, type MessageKey } from "@/lib/i18n";

/// The tab buttons, in order; each label follows the page's language.
const tabs: { id: LegalTabId; label: MessageKey }[] = [
  { id: "terms", label: "footer.terms" },
  { id: "privacy", label: "footer.privacy" },
  { id: "cookies", label: "footer.cookies" },
];

function richLine(value: string, onPrivacy: () => void): ReactNode[] {
  const parts = value.split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|Privacy Policy)/g);
  return parts.map((part, index) => {
    if (/^https?:\/\//i.test(part)) return <a key={index} href={part}>{part}</a>;
    if (part === "Privacy Policy") return <button key={index} type="button" className="kpd-legal-inline" onClick={onPrivacy}>{part}</button>;
    if (part.includes("@")) return <a key={index} href={`mailto:${part}`}>{part}</a>;
    return part;
  });
}

function Piece({ piece, onPrivacy }: { piece: LegalPiece; onPrivacy: () => void }) {
  if (piece.type === "paragraph") {
    return <p className={piece.callout ? "kpd-legal-callout" : undefined}>{richLine(piece.text, onPrivacy)}</p>;
  }
  if (piece.type === "items") {
    return <>{piece.items.map((item) => <p key={item} className="kpd-legal-item">• {item}</p>)}</>;
  }
  if (piece.type === "chips") {
    return <div className="kpd-legal-chips">{piece.items.map((item) => <div key={item}>{item}</div>)}</div>;
  }
  if (piece.type === "cards") {
    return <div className="kpd-legal-cards">{piece.cards.map((card) => <div key={card.title}><strong>{card.title}</strong><span>{card.text}</span></div>)}</div>;
  }
  return <div className="kpd-legal-table" role="table">
    <div className="kpd-legal-table-row kpd-legal-table-head" role="row">{piece.headers.map((header) => <div key={header} role="columnheader">{header}</div>)}</div>
    {piece.rows.map((row) => <div className="kpd-legal-table-row" role="row" key={row[0]}>{row.map((cell) => <div key={cell} role="cell">{cell}</div>)}</div>)}
  </div>;
}

/// Terms, Privacy and Cookies from the client document. Tab buttons change the
/// panel in place. The address does not change.
export function LegalTabs({ initialTab, image, headingStyle, contact, locale }: { initialTab: LegalTabId; image?: string; headingStyle?: TextStyle; contact?: { heading?: string; text?: string; email?: string }; locale: Locale }) {
  const help = { heading: contact?.heading?.trim() || legalContact.heading, text: contact?.text?.trim() || legalContact.text, email: contact?.email?.trim() || legalContact.email };
  const [tab, setTab] = useState<LegalTabId>(initialTab);
  const active = legalDocuments.find((entry) => entry.id === tab) ?? legalDocuments[0];

  function show(next: LegalTabId) {
    setTab(next);
    window.document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <>
    <section className="page-hero pdf-hero">{image ? <img src={image} alt="" /> : null}<div className="page-hero-content"><h1 style={textStyleProps(headingStyle)}>{active.title}</h1></div></section>
    <nav className="kpd-legal-tabs" aria-label={t(locale, "legal.pages")}>
      {tabs.map((entry) => <button key={entry.id} type="button" aria-current={tab === entry.id ? "page" : undefined} onClick={() => show(entry.id)}>{t(locale, entry.label)}</button>)}
      <button type="button" onClick={() => window.document.getElementById("legal-contact")?.scrollIntoView({ behavior: "smooth", block: "start" })}>{t(locale, "nav.contact")}</button>
    </nav>
    <section className="kpd-legal-block" aria-label={active.title}>
      {active.sections.map((section) => <div className="kpd-legal-section" key={section.heading}>
        <h2>{section.heading}</h2>
        <div className="kpd-legal-copy">{section.pieces.map((piece, index) => <Piece key={index} piece={piece} onPrivacy={() => show("privacy")} />)}</div>
      </div>)}
    </section>
    <section id="legal-contact" className="kpd-legal-contact">
      <h2>{help.heading}</h2>
      <p>{help.text}</p>
      <a href={`mailto:${help.email}?subject=KPD%20Inquiry`}><span>{t(locale, "legal.email")}</span><span>{help.email}</span></a>
    </section>
  </>;
}
