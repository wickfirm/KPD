/// Contact enquiry copy and select options. This object is saved as the
/// `contact-form` block on the Contact static page, so the CMS remains the
/// public source of truth after the initial SQL seed has been applied.
export type ContactInquiryContent = {
  salesLabel: string;
  customerLabel: string;
  channelLabel: string;
  jobLabel: string;
  pressLabel: string;
  salesProjects: string[];
  customerProjects: string[];
  customerNatures: string[];
  salesMessagePrompt: string;
  customerMessagePrompt: string;
  channelMessagePrompt: string;
  jobMessagePrompt: string;
  pressMessagePrompt: string;
  /// Page wording around the form (Nov 2026 batch 2). Blank keeps the default.
  formHeading: string;
  addressLabel: string;
  address: string;
  directionsLabel: string;
  directionsUrl: string;
  callLabel: string;
  termsText: string;
  marketingText: string;
  submitLabel: string;
  quickCallLabel: string;
  quickEmailLabel: string;
};

export const contactInquiryDefaults: ContactInquiryContent = {
  salesLabel: "Sales Inquiry",
  customerLabel: "Customer Inquiry",
  channelLabel: "Channel Partner",
  jobLabel: "Job Inquiry",
  pressLabel: "Press Inquiry",
  salesProjects: ["seven x seven", "Villa 174", "Dubai Hills Mansion", "General enquiry"],
  customerProjects: ["seven x seven", "Villa 174", "Dubai Hills Mansion", "Other"],
  customerNatures: ["Handover", "Documentation", "Payment", "Maintenance", "Other"],
  salesMessagePrompt: "What are you looking for? Share preferred bedrooms, timing or anything specific.",
  customerMessagePrompt: "Tell us what you need and include any reference or unit number.",
  channelMessagePrompt: "Tell us about your agency and the markets you cover.",
  jobMessagePrompt: "A short note on why you would like to join Kasumigaseki Properties Development.",
  pressMessagePrompt: "Tell us what you are working on and what you need from us.",
  formHeading: "How can we help?",
  addressLabel: "Experience Centre address",
  address: "Bay Gate Tower, Floor 36\nBusiness Bay, Dubai, AE",
  directionsLabel: "Get directions",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=Bay+Gate+Tower+Business+Bay+Dubai",
  callLabel: "Call",
  termsText: "I have read and agree to Kasumigaseki Properties Development's [Terms and Conditions](/terms) and [Privacy Policy](/privacy-policy).",
  marketingText: "I consent to receive marketing communications from Kasumigaseki Properties Development in accordance with the Privacy Policy. I can unsubscribe at any time.",
  submitLabel: "Send enquiry",
  quickCallLabel: "Call",
  quickEmailLabel: "Email",
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function choices(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const parsed = value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean);
  return parsed.length ? parsed : fallback;
}

/// Safely accepts a JSON content block from the CMS while retaining a usable
/// form should a setting be partially edited or restored from an older version.
export function mergeContactInquiryContent(value: unknown): ContactInquiryContent {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    salesLabel: text(source.salesLabel, contactInquiryDefaults.salesLabel),
    customerLabel: text(source.customerLabel, contactInquiryDefaults.customerLabel),
    channelLabel: text(source.channelLabel, contactInquiryDefaults.channelLabel),
    jobLabel: text(source.jobLabel, contactInquiryDefaults.jobLabel),
    pressLabel: text(source.pressLabel, contactInquiryDefaults.pressLabel),
    salesProjects: choices(source.salesProjects, contactInquiryDefaults.salesProjects),
    customerProjects: choices(source.customerProjects, contactInquiryDefaults.customerProjects),
    customerNatures: choices(source.customerNatures, contactInquiryDefaults.customerNatures),
    salesMessagePrompt: text(source.salesMessagePrompt, contactInquiryDefaults.salesMessagePrompt),
    customerMessagePrompt: text(source.customerMessagePrompt, contactInquiryDefaults.customerMessagePrompt),
    channelMessagePrompt: text(source.channelMessagePrompt, contactInquiryDefaults.channelMessagePrompt),
    jobMessagePrompt: text(source.jobMessagePrompt, contactInquiryDefaults.jobMessagePrompt),
    pressMessagePrompt: text(source.pressMessagePrompt, contactInquiryDefaults.pressMessagePrompt),
    formHeading: text(source.formHeading, contactInquiryDefaults.formHeading),
    addressLabel: text(source.addressLabel, contactInquiryDefaults.addressLabel),
    address: text(source.address, contactInquiryDefaults.address),
    directionsLabel: text(source.directionsLabel, contactInquiryDefaults.directionsLabel),
    directionsUrl: text(source.directionsUrl, contactInquiryDefaults.directionsUrl),
    callLabel: text(source.callLabel, contactInquiryDefaults.callLabel),
    termsText: text(source.termsText, contactInquiryDefaults.termsText),
    marketingText: text(source.marketingText, contactInquiryDefaults.marketingText),
    submitLabel: text(source.submitLabel, contactInquiryDefaults.submitLabel),
    quickCallLabel: text(source.quickCallLabel, contactInquiryDefaults.quickCallLabel),
    quickEmailLabel: text(source.quickEmailLabel, contactInquiryDefaults.quickEmailLabel),
  };
}
