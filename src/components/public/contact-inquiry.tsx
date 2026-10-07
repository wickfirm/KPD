"use client";

import { FormEvent, useEffect, useState } from "react";

/// The delivered contact inquiry (public/legacy/contact.html): one adaptive
/// form with five inquiry panes switched by tabs, a Client/Broker segment on
/// the sales pane, conditional broker fields, CV upload, and consent
/// checkboxes. The delivered DOM is reproduced 1:1; the deliberate deviations
/// are functional — the form submits to /api/contact (local store + Salesforce
/// dual-write) instead of the delivered mailto action, and pane/disabled state
/// is React state instead of the delivered inline script.

const panes = [
  { key: "sales", label: "Sales Inquiry", id: "sales" },
  { key: "customer", label: "Customer Inquiry", id: "customer" },
  { key: "channel", label: "Channel Partner", id: "channel" },
  { key: "job", label: "Job Inquiry", id: "job" },
  { key: "press", label: "Press Inquiry", id: "press" },
] as const;

type PaneKey = (typeof panes)[number]["key"];

const projectOptions = ["Seven X Seven Residences", "Emerald Villa", "Dubai Hills Mansion"];

export function ContactInquiry({ email, phone, website }: { email: string; phone: string; website: string }) {
  const [activePane, setActivePane] = useState<PaneKey>("sales");
  const [segment, setSegment] = useState<"client" | "broker">("client");
  const [cvName, setCvName] = useState("Attach a PDF or DOC");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [plannerScenario, setPlannerScenario] = useState("");
  const [plannerProject, setPlannerProject] = useState("");

  const brokerVisible = activePane === "sales" && segment === "broker";

  useEffect(() => {
    setPlannerScenario(window.sessionStorage.getItem("kpdPlannerScenario") || "");
    setPlannerProject(window.sessionStorage.getItem("kpdPlannerProject") || "");
  }, []);

  /// Runtime parity with the delivered inline script: inactive panes get
  /// aria-hidden and disabled controls; those attributes are not part of the
  /// delivered static markup, so they are applied after hydration only.
  useEffect(() => {
    panes.forEach(({ key }) => {
      const pane = document.getElementById(`contact-pane-${key}`);
      if (!pane) return;
      const active = key === activePane;
      pane.setAttribute("aria-hidden", active ? "false" : "true");
      pane.querySelectorAll("input, select, textarea").forEach((field) => { (field as HTMLInputElement).disabled = !active; });
    });
    const brokerFields = document.querySelector("[data-sales-broker-fields]");
    brokerFields?.querySelectorAll("input, select, textarea").forEach((field) => { (field as HTMLInputElement).disabled = !brokerVisible; });
  }, [activePane, brokerVisible]);

  function paneSubtitle(prefix: string, tag: string) {
    return <p className="contact-form-subtitle">{prefix} <span>{tag}</span></p>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React nulls event.currentTarget after the handler yields — capture the
    // form synchronously so it can be reset after the request resolves.
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) || "").trim();
    const name = [get("Title"), get("First Name"), get("Last Name")].filter(Boolean).join(" ");
    const interestByPane: Record<PaneKey, string> = {
      sales: get("Project of Interest") || plannerProject || "General enquiry",
      customer: get("Related Project") || "General enquiry",
      channel: get("Company / Agency") || "Channel Partner",
      job: get("Role / Department") || "Job Inquiry",
      press: get("Publication / Outlet") || "Press Inquiry",
    };
    const messageByPane: Record<PaneKey, string> = {
      sales: get("Sales Message"),
      customer: get("Customer Message"),
      channel: get("Partner Message"),
      job: get("Job Message"),
      press: get("Press Message"),
    };
    const details = [
      activePane === "sales" ? `Enquirer type: ${segment === "broker" ? "Broker" : "Client"}` : "",
      activePane === "sales" && get("Budget Range") ? `Budget range: ${get("Budget Range")}` : "",
      activePane === "sales" && get("Agency") ? `Agency: ${get("Agency")}` : "",
      activePane === "sales" && get("RERA / ORN") ? `RERA/ORN: ${get("RERA / ORN")}` : "",
      activePane === "customer" && get("Customer Inquiry Nature") ? `Inquiry nature: ${get("Customer Inquiry Nature")}` : "",
      activePane === "channel" && get("Partner RERA / ORN") ? `RERA/ORN: ${get("Partner RERA / ORN")}` : "",
      activePane === "channel" && get("Market / Country") ? `Market: ${get("Market / Country")}` : "",
      activePane === "channel" && get("Website") ? `Website: ${get("Website")}` : "",
      activePane === "job" && get("LinkedIn / Portfolio") ? `LinkedIn/portfolio: ${get("LinkedIn / Portfolio")}` : "",
      activePane === "job" && cvName !== "Attach a PDF or DOC" ? `CV attached: ${cvName}` : "",
      activePane === "press" && get("Deadline") ? `Deadline: ${get("Deadline")}` : "",
      data.get("Marketing") === "on" ? "Marketing consent: yes" : "",
      plannerScenario ? `Ownership Cost Planner scenario: ${plannerScenario}` : "",
    ].filter(Boolean).join("\n");
    const label = panes.find((pane) => pane.key === activePane)!.label;
    setPending(true);
    try {
      let cvUrl = "";
      const cvFile = data.get("CV");
      if (activePane === "job" && cvFile instanceof File && cvFile.size > 0) {
        setStatus("Uploading your CV…");
        const uploadForm = new FormData();
        uploadForm.append("file", cvFile);
        const uploadResponse = await fetch("/api/contact/attachment", { method: "POST", body: uploadForm });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploadResult.error || "The CV could not be uploaded. Please try again.");
        cvUrl = uploadResult.url;
      }
      setStatus("Sending your enquiry…");
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: get("Email"), phone: get("Phone") ? `+971 ${get("Phone")}` : "", interest: `${label}: ${interestByPane[activePane]}`, sourcePage: "/contact", message: [messageByPane[activePane], details, cvUrl ? `CV: ${cvUrl}` : ""].filter(Boolean).join("\n\n") }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send your enquiry.");
      form.reset();
      setCvName("Attach a PDF or DOC");
      window.sessionStorage.removeItem("kpdPlannerScenario");
      window.sessionStorage.removeItem("kpdPlannerProject");
      setPlannerScenario("");
      setPlannerProject("");
      setStatus("Thank you. Your enquiry has been received.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send your enquiry. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const websiteHost = (() => { try { return new URL(website).hostname; } catch { return website; } })();

  return <>
    <div className="contact-inquiry-tabs" role="tablist" aria-label="Inquiry type">
      {panes.map(({ key, label }) => (
        <button key={key} className={activePane === key ? "is-active" : ""} id={`contact-tab-${key}`} type="button" role="tab" aria-selected={activePane === key} aria-controls={`contact-pane-${key}`} data-contact-tab data-contact-pane={key} onClick={() => setActivePane(key)}>{label}</button>
      ))}
    </div>
    <div className="contact-inquiry-grid">
      <div className="contact-map-column">
        <figure className="contact-map-card">
          <img src="/legacy/assets/images/contact/pdf/contact-pdf-01.png" alt="Experience Center location map" />
        </figure>
        <address className="contact-address">
          <strong>Experience Center Address</strong>
          <span>Bay Gate Tower,</span>
          <span>Floor 36,</span>
          <span>Business Bay, Dubai, AE</span>
          <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
          <a href={`mailto:${email}`}>{email}</a>
          <a href={website}>{websiteHost}</a>
        </address>
      </div>
      <div className="contact-inquiry-panel">
        <form className="contact-dark-form contact-adaptive-form" onSubmit={submit}>
          <input type="hidden" name="Inquiry Type" id="contactInquiryType" value={panes.find((pane) => pane.key === activePane)!.label} />

          <p className="contact-form-subtitle">Your details</p>
          <div className="contact-adaptive-row contact-adaptive-row-three">
            <label className="contact-adaptive-field">
              <span>Title</span>
              <select name="Title" aria-label="Title">
                <option>Mr.</option>
                <option>Ms.</option>
                <option>Mrs.</option>
                <option>Dr.</option>
              </select>
            </label>
            <label className="contact-adaptive-field">
              <span>First name</span>
              <input name="First Name" type="text" autoComplete="given-name" required />
            </label>
            <label className="contact-adaptive-field">
              <span>Last name</span>
              <input name="Last Name" type="text" autoComplete="family-name" required />
            </label>
          </div>
          <div className="contact-adaptive-row contact-adaptive-row-two">
            <label className="contact-adaptive-field">
              <span>Email</span>
              <input name="Email" type="email" autoComplete="email" required />
            </label>
            <label className="contact-adaptive-field contact-phone-field">
              <span>Phone</span>
              <span className="contact-phone-input"><span className="contact-phone-prefix"><span className="contact-flag" aria-hidden="true"></span> +971</span><input name="Phone" type="tel" autoComplete="tel" required /></span>
            </label>
          </div>

          <div className={activePane === "sales" ? "contact-pane is-active" : "contact-pane"} id="contact-pane-sales" role="tabpanel" aria-labelledby="contact-tab-sales" data-contact-pane-panel="sales" hidden={activePane !== "sales"}>
            {paneSubtitle("About your interest", "Sales")}
            <div className="contact-segment" role="group" aria-label="Enquirer type">
              <button type="button" className={segment === "client" ? "is-active" : ""} data-contact-segment="client" onClick={() => setSegment("client")}>Client</button>
              <button type="button" className={segment === "broker" ? "is-active" : ""} data-contact-segment="broker" onClick={() => setSegment("broker")}>Broker</button>
            </div>
            <div className="contact-adaptive-row contact-adaptive-row-two">
              <label className="contact-adaptive-field">
                <span>Project of interest</span>
                <select name="Project of Interest" value={plannerProject || undefined} onChange={(event) => setPlannerProject(event.target.value)}>
                  {projectOptions.map((option) => <option key={option}>{option}</option>)}
                  <option>General enquiry</option>
                </select>
              </label>
              <label className="contact-adaptive-field">
                <span>Budget range</span>
                <select name="Budget Range">
                  <option>Under AED 5M</option>
                  <option>AED 5-10M</option>
                  <option>AED 10-20M</option>
                  <option>AED 20M+</option>
                  <option>Prefer not to say</option>
                </select>
              </label>
            </div>
            <div className={brokerVisible ? "contact-adaptive-row contact-adaptive-row-two sales-broker" : "contact-adaptive-row contact-adaptive-row-two sales-broker is-hidden"} data-sales-broker-fields>
              <label className="contact-adaptive-field">
                <span>Agency / company</span>
                <input name="Agency" type="text" />
              </label>
              <label className="contact-adaptive-field">
                <span>RERA / ORN no.</span>
                <input name="RERA / ORN" type="text" />
              </label>
            </div>
            <label className="contact-adaptive-field contact-adaptive-field-wide">
              <span>Message</span>
              <textarea name="Sales Message" placeholder="Tell us what you're looking for - bedrooms, timing, anything specific."></textarea>
            </label>
          </div>

          <div className="contact-pane" id="contact-pane-customer" role="tabpanel" aria-labelledby="contact-tab-customer" data-contact-pane-panel="customer" hidden={activePane !== "customer"}>
            {paneSubtitle("Your request", "Customer")}
            <div className="contact-adaptive-row contact-adaptive-row-two">
              <label className="contact-adaptive-field">
                <span>Related project</span>
                <select name="Related Project">
                  {projectOptions.map((option) => <option key={option}>{option}</option>)}
                  <option>Other</option>
                </select>
              </label>
              <label className="contact-adaptive-field">
                <span>Nature of inquiry</span>
                <select name="Customer Inquiry Nature">
                  <option>Handover</option>
                  <option>Documentation</option>
                  <option>Payment</option>
                  <option>Maintenance</option>
                  <option>Other</option>
                </select>
              </label>
            </div>
            <label className="contact-adaptive-field contact-adaptive-field-wide">
              <span>Message</span>
              <textarea name="Customer Message" placeholder="Describe your request and include any reference or unit number."></textarea>
            </label>
          </div>

          <div className="contact-pane" id="contact-pane-channel" role="tabpanel" aria-labelledby="contact-tab-channel" data-contact-pane-panel="channel" hidden={activePane !== "channel"}>
            {paneSubtitle("Company details", "Channel Partner")}
            <div className="contact-adaptive-row contact-adaptive-row-two">
              <label className="contact-adaptive-field">
                <span>Company / agency</span>
                <input name="Company / Agency" type="text" />
              </label>
              <label className="contact-adaptive-field">
                <span>RERA / ORN no.</span>
                <input name="Partner RERA / ORN" type="text" />
              </label>
            </div>
            <div className="contact-adaptive-row contact-adaptive-row-two">
              <label className="contact-adaptive-field">
                <span>Market / country</span>
                <input name="Market / Country" type="text" />
              </label>
              <label className="contact-adaptive-field">
                <span>Website</span>
                <input name="Website" type="url" placeholder="https://" />
              </label>
            </div>
            <label className="contact-adaptive-field contact-adaptive-field-wide">
              <span>Message</span>
              <textarea name="Partner Message" placeholder="Tell us about your agency and the markets you cover."></textarea>
            </label>
          </div>

          <div className="contact-pane" id="contact-pane-job" role="tabpanel" aria-labelledby="contact-tab-job" data-contact-pane-panel="job" hidden={activePane !== "job"}>
            {paneSubtitle("Application", "Careers")}
            <div className="contact-adaptive-row contact-adaptive-row-two">
              <label className="contact-adaptive-field">
                <span>Role / department</span>
                <input name="Role / Department" type="text" placeholder="e.g. Marketing, Development" />
              </label>
              <label className="contact-adaptive-field">
                <span>LinkedIn / portfolio</span>
                <input name="LinkedIn / Portfolio" type="url" placeholder="https://" />
              </label>
            </div>
            <label className="contact-filebox">
              <span className="contact-file-label">Upload CV</span>
              <span id="contactCvName">{cvName}</span>
              <b>Choose file</b>
              <input type="file" name="CV" accept=".pdf,.doc,.docx" onChange={(event) => setCvName(event.target.files?.[0]?.name || "Attach a PDF or DOC")} />
            </label>
            <label className="contact-adaptive-field contact-adaptive-field-wide">
              <span>Message</span>
              <textarea name="Job Message" placeholder="A short note on why you'd like to join KPD."></textarea>
            </label>
          </div>

          <div className="contact-pane" id="contact-pane-press" role="tabpanel" aria-labelledby="contact-tab-press" data-contact-pane-panel="press" hidden={activePane !== "press"}>
            {paneSubtitle("Media request", "Press")}
            <div className="contact-adaptive-row contact-adaptive-row-two">
              <label className="contact-adaptive-field">
                <span>Publication / outlet</span>
                <input name="Publication / Outlet" type="text" />
              </label>
              <label className="contact-adaptive-field">
                <span>Deadline</span>
                <input name="Deadline" type="date" />
              </label>
            </div>
            <label className="contact-adaptive-field contact-adaptive-field-wide">
              <span>Message</span>
              <textarea name="Press Message" placeholder="Outline your request and what you need from us."></textarea>
            </label>
          </div>

          <div className="contact-consents">
            <label><input type="checkbox" name="Terms" required /> <span>I have read and agree to Kasumigaseki Properties Development&apos;s <a href="/terms">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>.</span></label>
            <label><input type="checkbox" name="Marketing" /> <span>I consent to receive marketing communications from Kasumigaseki Properties Development in accordance with the Privacy Policy. I can unsubscribe at any time.</span></label>
          </div>
          <button className="contact-submit" type="submit" disabled={pending}>Submit</button>
          {status ? <p className="contact-form-subtitle" role="status">{status}</p> : null}
        </form>
      </div>
    </div>
  </>;
}
