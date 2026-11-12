"use client";

import { useEffect, useState, type FormEvent } from "react";
import { withDialCode } from "@/lib/phone";

const COUNTRIES = [
  "United Arab Emirates (+971)", "Saudi Arabia (+966)", "Qatar (+974)", "Kuwait (+965)", "Bahrain (+973)", "Oman (+968)",
  "India (+91)", "Pakistan (+92)", "United Kingdom (+44)", "United States (+1)", "Canada (+1)", "France (+33)", "Germany (+49)",
  "China (+86)", "Japan (+81)", "Singapore (+65)", "Australia (+61)", "Switzerland (+41)", "Italy (+39)", "Spain (+34)",
  "Russia (+7)", "Turkey (+90)", "Egypt (+20)", "Lebanon (+961)", "Jordan (+962)", "South Africa (+27)", "Nigeria (+234)",
  "Brazil (+55)", "Other",
];

/// Gate in front of a development brochure. The lead is stored with the other
/// enquiries, mirrored to Salesforce as a Lead (inquiry type "Brochure request",
/// Property_Interest__c from the development), and the visitor is emailed the
/// file set in the development editor.
export function BrochureRequest({ projectName, projectSlug, label, className = "btn-pill" }: { projectName: string; projectSlug: string; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  /// Escape closes the form; after a successful request it closes on its own.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    if (!open || !done) return;
    const timer = window.setTimeout(() => setOpen(false), 5000);
    return () => window.clearTimeout(timer);
  }, [open, done]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const country = String(data.get("country") || "").trim();
    const typedPhone = String(data.get("phone") || "").trim();
    const phone = withDialCode(typedPhone, country);
    if (typedPhone.replace(/\D/g, "").length < 7) {
      setPhoneError("Please enter a valid phone number");
      return;
    }
    setPhoneError("");
    setPending(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message: `Please email the brochure for ${projectName}.`,
          interest: projectName,
          sourcePage: `/developments/${projectSlug}`,
          inquiryType: "Brochure request",
          projectSlug,
          details: [
            { label: "Name", value: name },
            { label: "Email", value: email },
            { label: "Phone", value: phone },
            { label: "Country", value: country },
            { label: "Development", value: projectName },
          ],
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string; emailed?: boolean };
      if (!response.ok) throw new Error(body.error || "Unable to send your request.");
      setStatus(body.emailed ? "The download link is on its way to your email." : "Your request is saved. The team will email the brochure link.");
      form.reset();
      setDone(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send your request.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <button className={className} type="button" onClick={() => { setOpen(true); setStatus(""); setDone(false); }}>{label}</button>
    {open ? <div className="brochure-request" role="dialog" aria-modal="true" aria-labelledby="brochure-request-title">
      <button className="brochure-request__backdrop" type="button" aria-label="Close brochure form" onClick={() => setOpen(false)} />
      {done ? <div className="brochure-request__panel brochure-request__panel--done">
        <button className="brochure-request__close" type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        <h2 id="brochure-request-title">Thank you</h2>
        <p className="brochure-request__status" role="status">{status}</p>
        <button className="brochure-request__done" type="button" onClick={() => setOpen(false)}>Close <span aria-hidden="true">→</span></button>
      </div> : <form className="brochure-request__panel" onSubmit={submit}>
        <button className="brochure-request__close" type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        <h2 id="brochure-request-title">Property Brochure</h2>
        <p>Fill the form below to download the property brochure.</p>
        <div className="brochure-request__grid">
          <label>Name<input name="name" required autoComplete="name" /></label>
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Phone<input name="phone" required autoComplete="tel" inputMode="tel" onChange={() => setPhoneError("")} />{phoneError ? <small>{phoneError}</small> : null}</label>
          <label>Country<select name="country" defaultValue={COUNTRIES[0]}>{COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label>
        </div>
        <button type="submit" disabled={pending}>{pending ? "Sending…" : "Request brochure"} <span aria-hidden="true">→</span></button>
        {status ? <p className="brochure-request__status" role="status">{status}</p> : null}
      </form>}
    </div> : null}
  </>;
}
