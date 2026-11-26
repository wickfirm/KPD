"use client";

import { FormEvent, useEffect, useState } from "react";
import { mergeContactInquiryContent } from "@/lib/contact-inquiry-content";
import { localeHref, type Locale, arrowGlyph } from "@/lib/locales";
import { formMessage, t } from "@/lib/i18n";
import { dialCodeLabel, looksLikePhone, PHONE_COUNTRIES, withDialCode } from "@/lib/phone";

/// The contact inquiry in the client-approved Option 2.1 "Gallery light"
/// layout: the Experience Centre card beside one adaptive form with five
/// inquiry panes switched by tabs, a Client/Broker choice on the sales pane,
/// conditional broker fields, CV upload, and consent checkboxes. Field names,
/// pane ids and the submission (/api/contact: local store + Salesforce
/// dual-write) are unchanged from the delivered form; the select lists are
/// shown as pill choices, which post the same names and values.

type PaneKey = "sales" | "customer" | "channel" | "job" | "press";

/// CMS text with [label](/path) links, e.g. the consent lines. Only site paths
/// and http(s) links become links; everything else stays plain text. A site
/// path gets the page's language, so the link keeps the visitor in it.
function linked(value: string, locale: Locale) {
  return value.split(/(\[[^\]]+\]\([^)\s]+\))/g).map((part, index) => {
    const match = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (!match || !(/^\/(?!\/)/.test(match[2]) || /^https?:\/\//i.test(match[2]))) return part;
    return <a key={index} href={localeHref(match[2], locale)}>{match[1]}</a>;
  });
}
type ContactWindow = Window & { __KPD_CONTACT?: { email?: string; recipients?: Record<string, string | undefined> } };

export function ContactInquiry({ locale, phone = "", website = "", image = "", content, english }: { locale: Locale; email?: string; phone?: string; website?: string; image?: string; content?: unknown; english?: unknown }) {
  const c = mergeContactInquiryContent(content);
  // The same content in English (english is the page's English block on another
  // language's page). What the form posts is always taken from it: the inquiry
  // type, and the value of each choice, which a visitor picks by its label.
  const base = mergeContactInquiryContent(english ?? content);
  const englishLabel: Record<PaneKey, string> = { sales: base.salesLabel, customer: base.customerLabel, channel: base.channelLabel, job: base.jobLabel, press: base.pressLabel };
  const panes = [
    { key: "sales" as const, label: c.salesLabel, id: "sales" },
    { key: "customer" as const, label: c.customerLabel, id: "customer" },
    { key: "channel" as const, label: c.channelLabel, id: "channel" },
    { key: "job" as const, label: c.jobLabel, id: "job" },
    { key: "press" as const, label: c.pressLabel, id: "press" },
  ];
  const [activePane, setActivePane] = useState<PaneKey>("sales");
  const [segment, setSegment] = useState<"client" | "broker">("client");
  const [cvName, setCvName] = useState(t(locale, "form.cvFile"));
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [plannerScenario, setPlannerScenario] = useState("");
  const [plannerProject, setPlannerProject] = useState("");
  const [country, setCountry] = useState<string>(PHONE_COUNTRIES[0]);

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
    const byPane: Record<PaneKey, [string, string][]> = {
      sales: [["Enquirer type", segment === "broker" ? "Broker" : "Client"], ["Project of interest", get("Project of Interest") || plannerProject], ["Agency", get("Agency")], ["RERA / ORN", get("RERA / ORN")]],
      customer: [["Related project", get("Related Project")], ["Inquiry nature", get("Customer Inquiry Nature")]],
      channel: [["Company / agency", get("Company / Agency")], ["RERA / ORN", get("Partner RERA / ORN")], ["Market / country", get("Market / Country")], ["Website", get("Website")]],
      job: [["Role / department", get("Role / Department")], ["LinkedIn / portfolio", get("LinkedIn / Portfolio")]],
      press: [["Publication / outlet", get("Publication / Outlet")], ["Deadline", get("Deadline")]],
    };
    const messageByPane: Record<PaneKey, string> = {
      sales: get("Sales Message"),
      customer: get("Customer Message"),
      channel: get("Partner Message"),
      job: get("Job Message"),
      press: get("Press Message"),
    };
    const label = panes.find((pane) => pane.key === activePane)!.label;
    // The country code is chosen beside the number (Salesforce and the team need
    // it to call back); a number typed with + or 00 is kept as typed.
    if (!looksLikePhone(get("Phone"))) {
      setStatus(formMessage(locale, "Please enter a valid phone number.", "form.invalidPhone"));
      return;
    }
    const phoneNumber = withDialCode(get("Phone"), get("Country"));
    setPending(true);
    try {
      let cvUrl = "";
      const cvFile = data.get("CV");
      if (activePane === "job" && cvFile instanceof File && cvFile.size > 0) {
        // Checked here too: Vercel rejects bodies over 4.5 MB before the upload route runs.
        if (cvFile.size > 4 * 1024 * 1024) throw new Error(formMessage(locale, "The CV is too large (4 MB maximum). Please attach a smaller file.", "form.cvTooLarge"));
        setStatus(formMessage(locale, "Uploading your CV…", "form.uploadingCv"));
        const uploadForm = new FormData();
        uploadForm.append("file", cvFile);
        const uploadResponse = await fetch("/api/contact/attachment", { method: "POST", body: uploadForm });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error((locale === "en" ? uploadResult.error : "") || formMessage(locale, "The CV could not be uploaded. Please try again.", "form.cvUploadFailed"));
        cvUrl = uploadResult.url;
      }
      setStatus(formMessage(locale, "Sending your enquiry…", "form.sending"));
      // Every field the visitor filled in for the active inquiry, in form order, so the
      // Messages screen shows the form's own fields rather than one flattened note.
      const answers: [string, string][] = [
        ...byPane[activePane],
        ...(activePane === "job" ? [["CV", cvUrl || (cvName !== t(locale, "form.cvFile") ? cvName : "")] as [string, string]] : []),
        ["Country", get("Country")],
        ["Marketing consent", data.get("Marketing") === "on" ? "Yes" : "No"],
        ["Terms accepted", data.get("Terms") === "on" ? "Yes" : ""],
        ["Ownership Cost Planner scenario", plannerScenario],
      ];
      const details = answers.filter(([, value]) => value).map(([label, value]) => ({ label, value }));
      const recipientKey: Record<PaneKey, string> = { sales: "contactSales", customer: "contactCustomer", channel: "contactChannel", job: "contactCareers", press: "contactPress" };
      const routing = (window as ContactWindow).__KPD_CONTACT;
      const recipient = routing?.recipients?.[recipientKey[activePane]] || routing?.email || "";
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: get("Email"), phone: phoneNumber, interest: interestByPane[activePane], inquiryType: englishLabel[activePane], recipient, recipientKey: recipientKey[activePane], sourcePage: localeHref("/contact", locale), message: messageByPane[activePane] || `${englishLabel[activePane]} (no message left).`, details, ...(locale === "en" ? {} : { visitorLanguage: locale }) }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || formMessage(locale, "Unable to send your enquiry.", "form.unableToSend", "form.errorShort"));
      form.reset();
      setCvName(t(locale, "form.cvFile"));
      window.sessionStorage.removeItem("kpdPlannerScenario");
      window.sessionStorage.removeItem("kpdPlannerProject");
      setPlannerScenario("");
      setPlannerProject("");
      setStatus(formMessage(locale, "Thank you. Your enquiry has been received.", "form.success"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : formMessage(locale, "Unable to send your enquiry. Please try again.", "form.unableToSendRetry", "form.error"));
    } finally {
      setPending(false);
    }
  }

  const tel = phone.replace(/[^\d+]/g, "");
  /// Remounts when the preselected value changes (the Ownership Cost Planner
  /// hands over a project after hydration), so defaultChecked applies again.
  // A choice reads in the visitor's language and posts the English entry at
  // the same position of the list. Never the translated label.
  const pills = (name: string, options: string[], englishOptions: string[], selected?: string) => <div className="g21-pills" key={`${name}-${selected ?? ""}`}>
    {options.map((option, index) => <label key={option}><input type="radio" name={name} value={englishOptions[index] ?? option} defaultChecked={selected ? englishOptions[index] === selected : index === 0} /><span>{option}</span></label>)}
  </div>;

  return <div className="g21-wrap g21-contact">
    <aside className="g21-ec-card">
      {image ? <figure className="g21-ph"><img src={image} alt="KPD Experience Centre reception lounge" /></figure> : null}
      <div className="g21-ec-body">
        <span className="g21-cap">{c.addressLabel}</span>
        <address>{c.address.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]))}</address>
        <div className="g21-ctas">
          <a className="g21-btn" href={c.directionsUrl} target="_blank" rel="noopener">{c.directionsLabel} <span className="g21-ar" aria-hidden="true">{arrowGlyph(locale, "↗")}</span></a>
          {tel ? <a className="g21-btn g21-btn--line" href={`tel:${tel}`}>{c.callLabel}</a> : null}
        </div>
        {website ? <a className="g21-txt-link" href={website}>{(() => { try { return new URL(website).hostname; } catch { return website; } })()}</a> : null}
      </div>
      <figure className="g21-ph g21-ec-map"><img src="/legacy/assets/images/contact/pdf/contact-pdf-01.png" alt="Map showing the Experience Centre in Bay Gate Tower, Business Bay" loading="lazy" /></figure>
    </aside>

    <div className="g21-cform">
      <h2 className="g21-cf-h">{c.formHeading}</h2>
      <div className="g21-tabs" role="tablist" aria-label={t(locale, "form.inquiryType")}>
        {panes.map(({ key, label }) => (
          <button key={key} id={`contact-tab-${key}`} type="button" role="tab" aria-selected={activePane === key} aria-controls={`contact-pane-${key}`} tabIndex={activePane === key ? 0 : -1} onClick={() => setActivePane(key)}>{label}</button>
        ))}
      </div>
      <form className="g21-form" onSubmit={submit}>
        <input type="hidden" name="Inquiry Type" value={panes.find((pane) => pane.key === activePane)!.label} />

        <fieldset className="g21-grp"><legend className="g21-cap">{t(locale, "form.yourDetails")}</legend>
          <div className="g21-row g21-row--title">
            <label className="g21-fld"><span>{t(locale, "form.title")}</span><select name="Title">{(["Mr.", "Ms.", "Mrs.", "Dr."] as const).map((title) => <option key={title} {...(locale === "en" ? {} : { value: title })}>{title === "Mr." ? t(locale, "form.mr") : title === "Ms." ? t(locale, "form.ms") : title === "Mrs." ? t(locale, "form.mrs") : t(locale, "form.dr")}</option>)}</select></label>
            <label className="g21-fld"><span>{t(locale, "form.firstName")}</span><input name="First Name" type="text" autoComplete="given-name" required /></label>
            <label className="g21-fld"><span>{t(locale, "form.lastName")}</span><input name="Last Name" type="text" autoComplete="family-name" required /></label>
          </div>
          <div className="g21-row">
            <label className="g21-fld"><span>{t(locale, "form.email")}</span><input name="Email" type="email" autoComplete="email" required /></label>
            <div className="g21-fld"><span id="contact-phone-label">{t(locale, "form.phone")}</span><span className="g21-phone">
              <span className="g21-dial"><b aria-hidden="true">{dialCodeLabel(country)}</b><select name="Country" aria-label={t(locale, "form.countryCode")} value={country} onChange={(event) => setCountry(event.target.value)}>{PHONE_COUNTRIES.map((option) => <option key={option}>{option}</option>)}</select></span>
              <input name="Phone" type="tel" inputMode="tel" autoComplete="tel-national" aria-labelledby="contact-phone-label" required />
            </span></div>
          </div>
        </fieldset>

        <fieldset className="g21-grp" id="contact-pane-sales" role="tabpanel" aria-labelledby="contact-tab-sales" hidden={activePane !== "sales"}><legend className="g21-cap">{t(locale, "form.aboutYourInterest")}</legend>
          <div className="g21-fld"><span>{t(locale, "form.iAmA")}</span><div className="g21-pills" role="group" aria-label={t(locale, "form.enquirerType")}>
            <label><input type="radio" name="Enquirer" value="Client" checked={segment === "client"} onChange={() => setSegment("client")} /><span>{t(locale, "form.client")}</span></label>
            <label><input type="radio" name="Enquirer" value="Broker" checked={segment === "broker"} onChange={() => setSegment("broker")} /><span>{t(locale, "form.broker")}</span></label>
          </div></div>
          <div className="g21-fld"><span>{t(locale, "form.projectOfInterest")}</span>{pills("Project of Interest", c.salesProjects, base.salesProjects, plannerProject || undefined)}</div>
          <div className="g21-row" data-sales-broker-fields hidden={!brokerVisible}>
            <label className="g21-fld"><span>{t(locale, "form.agency")}</span><input name="Agency" type="text" /></label>
            <label className="g21-fld"><span>{t(locale, "form.reraNumber")}</span><input name="RERA / ORN" type="text" /></label>
          </div>
          <label className="g21-fld"><span>{t(locale, "form.message")}</span><textarea name="Sales Message" placeholder={c.salesMessagePrompt}></textarea></label>
        </fieldset>

        <fieldset className="g21-grp" id="contact-pane-customer" role="tabpanel" aria-labelledby="contact-tab-customer" hidden={activePane !== "customer"}><legend className="g21-cap">{t(locale, "form.yourRequest")}</legend>
          <div className="g21-fld"><span>{t(locale, "form.relatedProject")}</span>{pills("Related Project", c.customerProjects, base.customerProjects)}</div>
          <div className="g21-fld"><span>{t(locale, "form.natureOfInquiry")}</span>{pills("Customer Inquiry Nature", c.customerNatures, base.customerNatures)}</div>
          <label className="g21-fld"><span>{t(locale, "form.message")}</span><textarea name="Customer Message" placeholder={c.customerMessagePrompt}></textarea></label>
        </fieldset>

        <fieldset className="g21-grp" id="contact-pane-channel" role="tabpanel" aria-labelledby="contact-tab-channel" hidden={activePane !== "channel"}><legend className="g21-cap">{t(locale, "form.companyDetails")}</legend>
          <div className="g21-row">
            <label className="g21-fld"><span>{t(locale, "form.companyAgency")}</span><input name="Company / Agency" type="text" /></label>
            <label className="g21-fld"><span>{t(locale, "form.reraNumber")}</span><input name="Partner RERA / ORN" type="text" /></label>
          </div>
          <div className="g21-row">
            <label className="g21-fld"><span>{t(locale, "form.marketCountry")}</span><input name="Market / Country" type="text" /></label>
            <label className="g21-fld"><span>{t(locale, "form.website")}</span><input name="Website" type="url" placeholder="https://" /></label>
          </div>
          <label className="g21-fld"><span>{t(locale, "form.message")}</span><textarea name="Partner Message" placeholder={c.channelMessagePrompt}></textarea></label>
        </fieldset>

        <fieldset className="g21-grp" id="contact-pane-job" role="tabpanel" aria-labelledby="contact-tab-job" hidden={activePane !== "job"}><legend className="g21-cap">{t(locale, "form.application")}</legend>
          <div className="g21-row">
            <label className="g21-fld"><span>{t(locale, "form.roleDepartment")}</span><input name="Role / Department" type="text" placeholder={t(locale, "form.rolePlaceholder")} /></label>
            <label className="g21-fld"><span>{t(locale, "form.linkedinPortfolio")}</span><input name="LinkedIn / Portfolio" type="url" placeholder="https://" /></label>
          </div>
          <div className="g21-fld"><span>{t(locale, "form.uploadCv")}</span><label className="g21-file">
            <input type="file" name="CV" accept=".pdf,.doc,.docx" onChange={(event) => setCvName(event.target.files?.[0]?.name || t(locale, "form.cvFile"))} />
            <b>{t(locale, "form.chooseFile")}</b><span id="contactCvName">{cvName}</span>
          </label></div>
          <label className="g21-fld"><span>{t(locale, "form.message")}</span><textarea name="Job Message" placeholder={c.jobMessagePrompt}></textarea></label>
        </fieldset>

        <fieldset className="g21-grp" id="contact-pane-press" role="tabpanel" aria-labelledby="contact-tab-press" hidden={activePane !== "press"}><legend className="g21-cap">{t(locale, "form.mediaRequest")}</legend>
          <div className="g21-row">
            <label className="g21-fld"><span>{t(locale, "form.publicationOutlet")}</span><input name="Publication / Outlet" type="text" /></label>
            <label className="g21-fld"><span>{t(locale, "form.deadline")}</span><input name="Deadline" type="date" /></label>
          </div>
          <label className="g21-fld"><span>{t(locale, "form.message")}</span><textarea name="Press Message" placeholder={c.pressMessagePrompt}></textarea></label>
        </fieldset>

        <div className="g21-consent">
          <label className="g21-chk"><input type="checkbox" name="Terms" required /><span>{linked(c.termsText, locale)}</span></label>
          <label className="g21-chk"><input type="checkbox" name="Marketing" /><span>{linked(c.marketingText, locale)}</span></label>
        </div>
        <button className="g21-btn g21-submit" type="submit" disabled={pending}>{c.submitLabel} <span className="g21-ar" aria-hidden="true">{arrowGlyph(locale, "→")}</span></button>
        {status ? <p className="g21-form-status" role="status">{status}</p> : null}
      </form>
    </div>
  </div>;
}
