/// Legal copy from the client's page document
/// (KPD Terms and Conditions – Terms and Conditions (2).html).
/// Terms, Privacy and Cookies are three panels of that one page. The contact
/// band sits under all three.

export const termsPageTitle = "Terms and Conditions";

export type LegalTabId = "terms" | "privacy" | "cookies";

export type LegalPiece =
  | { type: "paragraph"; text: string; callout?: boolean }
  | { type: "items"; items: string[] }
  | { type: "chips"; items: string[] }
  | { type: "cards"; cards: { title: string; text: string }[] }
  | { type: "table"; headers: [string, string, string]; rows: [string, string, string][] };

export type LegalSection = { heading: string; pieces: LegalPiece[] };
export type LegalDocument = { id: LegalTabId; title: string; sections: LegalSection[] };

const p = (text: string, callout = false): LegalPiece => ({ type: "paragraph", text, ...(callout ? { callout: true } : {}) });

export const legalDocuments: LegalDocument[] = [
  {
    id: "terms",
    title: "Terms and Conditions",
    sections: [
      { heading: "Overview", pieces: [p("Please read these terms before using the Kasumigaseki Properties Development website. By continuing to use the website, you agree to be bound by them. If you do not agree, please do not use the site.")] },
      {
        heading: "Acceptance",
        pieces: [
          p("Your use of this website, including its pages, links, emails and other services, means you accept these terms. Access to any product or service shown on the website is subject to our determination and acceptance. You agree that your use of the website will not:"),
          { type: "items", items: ["Violate any applicable law", "Involve fraudulent or misleading activity", "Harm the reputation of the website or of Kasumigaseki Properties Development", "Interfere with the security or operation of the website"] },
        ],
      },
      {
        heading: "Website information",
        pieces: [
          p("Content is provided for general information only.", true),
          p("The following may change without notice and should be verified directly with Kasumigaseki Properties Development:"),
          { type: "items", items: ["Project information", "Prices", "Images", "Timelines", "Dimensions", "Availability", "Features"] },
        ],
      },
      {
        heading: "Use of content",
        pieces: [
          p("Text, images, marks, layouts and design materials are owned by or licensed to Kasumigaseki Properties Development. They include:"),
          { type: "items", items: ["Text", "Layouts", "Images", "Design materials", "Marks"] },
          p("None of this may be reproduced or distributed without written permission."),
        ],
      },
      { heading: "Trademarks", pieces: [p("The names, logos and marks that appear on this website belong to Kasumigaseki Properties Development or its licensors. All rights in them are reserved, and nothing on this website grants you a licence to use them.")] },
      {
        heading: "No investment advice",
        pieces: [
          p("Nothing on this website is financial, legal, tax or investment advice.", true),
          p("Visitors should obtain independent advice before making decisions."),
          { type: "chips", items: ["Financial", "Legal", "Tax", "Investment"] },
        ],
      },
      {
        heading: "Warranties and liability",
        pieces: [
          p("We aim to keep the website accurate and available, but we do not warrant that its content is accurate, complete or current, or that the website will be uninterrupted or free of errors."),
          p("To the fullest extent permitted by law, Kasumigaseki Properties Development is not liable for any direct, indirect or consequential loss arising from your use of the website or your reliance on its content. Any decision you make based on this website is made at your own risk."),
        ],
      },
      { heading: "Submissions", pieces: [p("Information you send us through the website, such as an enquiry form, is handled as described in the Privacy Policy below. Please do not send confidential material through the website unless we have agreed to receive it.")] },
      { heading: "External links", pieces: [p("The website may link to third-party websites. We do not control them and are not responsible for their content, availability or privacy practices.")] },
      { heading: "Changes to these terms", pieces: [p("We may update these terms at any time by posting a revised version on this page. Your continued use of the website after a change means you accept the revised terms.")] },
      { heading: "Governing law", pieces: [p("These terms, and your use of the website, are governed by the laws of the United Arab Emirates. The courts of the United Arab Emirates have exclusive jurisdiction over any dispute arising from them.")] },
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    sections: [
      { heading: "Overview", pieces: [p("Kasumigaseki Properties Development respects the privacy of website visitors, buyers, investors, partners and people who contact us through forms, email or events. This policy explains what we collect, why we collect it and the choices you have.")] },
      {
        heading: "Who this covers",
        pieces: [
          p("This policy applies to personal information collected through this website and through the ways people reach us from it."),
          { type: "cards", cards: [
            { title: "Website visitors", text: "People browsing kpd.ae." },
            { title: "Buyers and investors", text: "People enquiring about a development or an investment." },
            { title: "Partners", text: "Brokers and project partners we work with." },
            { title: "People who contact us", text: "Through forms, email or events." },
          ] },
        ],
      },
      {
        heading: "Information we collect",
        pieces: [
          p("We may collect the following, depending on how you deal with us."),
          { type: "table", headers: ["Information", "What it includes", "Where it comes from"], rows: [
            ["Contact details", "Your name, email address and phone number.", "Enquiry form, floor plan requests, email"],
            ["Enquiry preferences", "The development you're interested in, and whether you want a call, a visit to our Customer Experience Centre, to invest or to partner as a broker.", "Enquiry form"],
            ["Message content", "Whatever you write to us.", "Enquiry form, email"],
            ["Event registrations", "Your details when you register for a KPD event.", "Events"],
            ["Newsletter signups", "Your email address.", "Subscribe form in the site footer"],
            ["Website usage data", "Basic information about how the website is used.", "Collected as you browse"],
          ] },
        ],
      },
      {
        heading: "How we use information",
        pieces: [
          p("We use the information above to:"),
          { type: "items", items: ["Respond to enquiries", "Improve the website experience", "Coordinate meetings", "Maintain appropriate business records", "Share project updates"] },
        ],
      },
      {
        heading: "Sharing",
        pieces: [
          p("We do not sell personal information.", true),
          p("We may share information with the groups below, but only where needed to respond to a request or operate the website. We may also disclose information where required by law, a court order or a government authority."),
          { type: "cards", cards: [
            { title: "Service providers", text: "Companies that help us operate the website." },
            { title: "Advisers", text: "Professionals who help us respond to your request." },
            { title: "Project partners", text: "Partners involved in a project you've enquired about." },
          ] },
        ],
      },
      { heading: "Processing outside the UAE", pieces: [p("Some of our service providers may use cloud-based tools, so information may be processed in countries outside the United Arab Emirates. Where this happens, we expect the provider to protect it in line with applicable law.")] },
      {
        heading: "Retention and security",
        pieces: [
          p("We keep personal information only for as long as it is needed for the purposes described in this policy, or as the law requires."),
          p("We use reasonable organisational and technical measures to protect the information we hold. No method of transmission over the internet is completely secure, so we cannot guarantee absolute security."),
        ],
      },
      { heading: "Your choices", pieces: [p("You may request access to your information, ask us to correct it, or ask us to delete it. You can also stop receiving project updates at any time. To do any of these, contact us at info@kpd.ae.")] },
      { heading: "Children", pieces: [p("This website is not intended for children, and we do not knowingly collect personal information from them. If you believe a child has sent us information, please contact us and we will take appropriate steps to remove it.")] },
      { heading: "Changes to this policy", pieces: [p("We may update this policy by posting a revised version on this page. Your continued use of the website after a change means you accept the revised policy.")] },
    ],
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    sections: [
      { heading: "Overview", pieces: [p("This section explains how the Kasumigaseki Properties Development website uses cookies and similar technologies, and how you can control them.")] },
      { heading: "What cookies are", pieces: [p("Cookies are small text files that a website stores on your device. They help a site work properly, remember your choices and understand how it is used.")] },
      { heading: "How we use cookies", pieces: [p("We use cookies to keep the website running, to remember information you have entered, and to understand how visitors use the site so we can improve it. In most cases there is no way to switch off a cookie without also switching off the feature it supports.")] },
      {
        heading: "Cookies we set",
        pieces: [
          { type: "table", headers: ["Type", "What it does", "Can you turn it off?"], rows: [
            ["Essential", "Keeps the website working, for example page navigation and form submission.", "No, the website needs them"],
            ["Preference", "Remembers choices you make, such as details entered on a form.", "Yes, in your browser settings"],
            ["Analytics", "Helps us understand how visitors use the website, using aggregated usage data.", "Yes, in your browser settings"],
          ] },
        ],
      },
      { heading: "Third-party cookies", pieces: [p("Some cookies are set by third-party services we use, such as analytics tools or embedded content. These providers have their own privacy policies, which govern how they use that information.")] },
      { heading: "Managing cookies", pieces: [p("You can block or delete cookies in your browser settings. Please note that turning them off may affect how parts of the website work.")] },
    ],
  },
];

export const legalContact = {
  heading: "Questions about these terms or policies?",
  text: "Kasumigaseki Properties Development. Our team replies personally.",
  email: "info@kpd.ae",
};

export function legalTabForSlug(slug: string): LegalTabId {
  if (slug === "privacy-policy") return "privacy";
  if (slug === "cookie-policy") return "cookies";
  return "terms";
}

export type TermsBlock = {
  type: "hero" | "heading" | "paragraph";
  heading?: string;
  text?: string;
  image?: string;
};

/// Flat blocks for a fresh database seed. The public page renders legalDocuments.
export const termsPageContent: TermsBlock[] = [
  { type: "hero", heading: termsPageTitle },
  ...legalDocuments[0].sections.flatMap((section): TermsBlock[] => [
    { type: "heading", heading: section.heading },
    ...section.pieces.flatMap((piece): TermsBlock[] => {
      if (piece.type === "paragraph") return [{ type: "paragraph", text: piece.text }];
      if (piece.type === "items" || piece.type === "chips") return piece.items.map((text) => ({ type: "paragraph", text: `• ${text}` }));
      if (piece.type === "cards") return piece.cards.map((card) => ({ type: "paragraph", text: `• ${card.title}. ${card.text}` }));
      return piece.rows.map((row) => ({ type: "paragraph", text: row.join(" — ") }));
    }),
  ]),
  { type: "heading", heading: legalContact.heading },
  { type: "paragraph", text: legalContact.text },
  { type: "paragraph", text: `Email ${legalContact.email}` },
];
