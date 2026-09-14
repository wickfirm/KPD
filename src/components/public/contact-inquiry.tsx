"use client";

import { FormEvent, useState } from "react";

const inquiryTypes = ["Sales Inquiry", "Customer Inquiry", "Channel Partner", "Job Inquiry", "Press Inquiry"];

export function ContactInquiry() {
  const [type, setType] = useState(inquiryTypes[0]);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = `${data.get("firstName") || ""} ${data.get("lastName") || ""}`.trim();
    const project = String(data.get("project") || "General enquiry");
    const message = String(data.get("message") || "").trim();
    setPending(true); setStatus("Sending your enquiry…");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: data.get("email"), phone: data.get("phone"), interest: `${type}: ${project}`, sourcePage: "/contact", message: `[${type}] ${message}` }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send your enquiry.");
      event.currentTarget.reset(); setStatus("Thank you. Your enquiry has been received.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to send your enquiry. Please try again."); }
    finally { setPending(false); }
  }

  return <div className="contact-inquiry-panel"><div className="contact-inquiry-tabs" role="tablist" aria-label="Inquiry type">{inquiryTypes.map((item) => <button key={item} className={type === item ? "is-active" : ""} type="button" role="tab" aria-selected={type === item} onClick={() => setType(item)}>{item}</button>)}</div><form className="contact-dark-form contact-adaptive-form" onSubmit={submit}><p className="contact-form-subtitle">Your details</p><div className="contact-adaptive-row contact-adaptive-row-three"><label className="contact-adaptive-field"><span>Title</span><select name="title"><option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option></select></label><label className="contact-adaptive-field"><span>First name</span><input name="firstName" autoComplete="given-name" required /></label><label className="contact-adaptive-field"><span>Last name</span><input name="lastName" autoComplete="family-name" required /></label></div><div className="contact-adaptive-row contact-adaptive-row-two"><label className="contact-adaptive-field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label><label className="contact-adaptive-field"><span>Phone</span><input name="phone" type="tel" autoComplete="tel" required /></label></div><p className="contact-form-subtitle">About your interest <span>{type}</span></p><div className="contact-adaptive-row contact-adaptive-row-two"><label className="contact-adaptive-field"><span>Project of interest</span><select name="project"><option>Seven X Seven Residences</option><option>Emerald Villa</option><option>Dubai Hills Mansion</option><option>General enquiry</option></select></label><label className="contact-adaptive-field"><span>Preferred contact method</span><select name="contactMethod"><option>Email</option><option>Phone</option><option>WhatsApp</option></select></label></div><label className="contact-adaptive-field contact-adaptive-field-wide"><span>Message</span><textarea name="message" required placeholder="Tell us what you're looking for, your timing, and anything specific." /></label><div className="contact-consents"><label><input type="checkbox" required /> <span>I agree to the Terms of Service and Privacy Policy.</span></label></div><button className="contact-submit" type="submit" disabled={pending}>{pending ? "Sending…" : "Submit"}</button><p role="status" className="backend-form-status">{status}</p></form></div>;
}
