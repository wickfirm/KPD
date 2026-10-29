"use client";

import { useState, type FormEvent } from "react";

const COUNTRIES = [
  "United Arab Emirates (+971)", "Saudi Arabia (+966)", "Qatar (+974)", "Kuwait (+965)", "Bahrain (+973)", "Oman (+968)",
  "India (+91)", "Pakistan (+92)", "United Kingdom (+44)", "United States (+1)", "Canada (+1)", "France (+33)", "Germany (+49)",
  "China (+86)", "Japan (+81)", "Singapore (+65)", "Australia (+61)", "Switzerland (+41)", "Italy (+39)", "Spain (+34)",
  "Russia (+7)", "Turkey (+90)", "Egypt (+20)", "Lebanon (+961)", "Jordan (+962)", "South Africa (+27)", "Nigeria (+234)",
  "Brazil (+55)", "Other",
];

/// Gate in front of a development brochure. The lead is stored with the other
/// enquiries, and the visitor is emailed the file set in the development editor.
export function BrochureRequest({ projectName, projectSlug, label }: { projectName: string; projectSlug: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const country = String(data.get("country") || "").trim();
    if (phone.replace(/\D/g, "").length < 7) {
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
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send your request.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <button className="btn-pill" type="button" onClick={() => { setOpen(true); setStatus(""); }}>{label}</button>
    {open ? <div className="brochure-request" role="dialog" aria-modal="true" aria-labelledby="brochure-request-title">
      <button className="brochure-request__backdrop" type="button" aria-label="Close brochure form" onClick={() => setOpen(false)} />
      <form className="brochure-request__panel" onSubmit={submit}>
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
      </form>
    </div> : null}
  </>;
}
