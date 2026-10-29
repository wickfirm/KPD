/// Terms and Conditions supplied in the client's page document
/// (KPD Terms and Conditions – Terms and Conditions (2).html).
/// Privacy Policy and Cookie Policy in that file are separate pages and are
/// not part of this copy. List lines keep a leading "• " so the CMS body
/// editor can round-trip them as their own paragraphs.

export const termsPageTitle = "Terms and Conditions";

export type TermsBlock = {
  type: "hero" | "heading" | "paragraph";
  heading?: string;
  text?: string;
  image?: string;
};

const heading = (heading: string): TermsBlock => ({ type: "heading", heading });
const paragraph = (text: string): TermsBlock => ({ type: "paragraph", text });
const item = (text: string): TermsBlock => ({ type: "paragraph", text: `• ${text}` });

export const termsPageContent: TermsBlock[] = [
  { type: "hero", heading: termsPageTitle },
  heading("Overview"),
  paragraph("Please read these terms before using the Kasumigaseki Properties Development website. By continuing to use the website, you agree to be bound by them. If you do not agree, please do not use the site."),
  heading("Acceptance"),
  paragraph("Your use of this website, including its pages, links, emails and other services, means you accept these terms. Access to any product or service shown on the website is subject to our determination and acceptance. You agree that your use of the website will not:"),
  item("Violate any applicable law"),
  item("Involve fraudulent or misleading activity"),
  item("Harm the reputation of the website or of Kasumigaseki Properties Development"),
  item("Interfere with the security or operation of the website"),
  heading("Website information"),
  paragraph("Content is provided for general information only."),
  paragraph("The following may change without notice and should be verified directly with Kasumigaseki Properties Development:"),
  item("Project information"),
  item("Images"),
  item("Dimensions"),
  item("Features"),
  item("Prices"),
  item("Timelines"),
  item("Availability"),
  heading("Use of content"),
  paragraph("Text, images, marks, layouts and design materials are owned by or licensed to Kasumigaseki Properties Development. They include:"),
  item("Text"),
  item("Images"),
  item("Marks"),
  item("Layouts"),
  item("Design materials"),
  paragraph("None of this may be reproduced or distributed without written permission."),
  heading("Trademarks"),
  paragraph("The names, logos and marks that appear on this website belong to Kasumigaseki Properties Development or its licensors. All rights in them are reserved, and nothing on this website grants you a licence to use them."),
  heading("No investment advice"),
  paragraph("Nothing on this website is financial, legal, tax or investment advice."),
  paragraph("Visitors should obtain independent advice before making decisions."),
  item("Financial"),
  item("Legal"),
  item("Tax"),
  item("Investment"),
  heading("Warranties and liability"),
  paragraph("We aim to keep the website accurate and available, but we do not warrant that its content is accurate, complete or current, or that the website will be uninterrupted or free of errors."),
  paragraph("To the fullest extent permitted by law, Kasumigaseki Properties Development is not liable for any direct, indirect or consequential loss arising from your use of the website or your reliance on its content. Any decision you make based on this website is made at your own risk."),
  heading("Submissions"),
  paragraph("Information you send us through the website, such as an enquiry form, is handled as described in the Privacy Policy below. Please do not send confidential material through the website unless we have agreed to receive it."),
  heading("External links"),
  paragraph("The website may link to third-party websites. We do not control them and are not responsible for their content, availability or privacy practices."),
  heading("Changes to these terms"),
  paragraph("We may update these terms at any time by posting a revised version on this page. Your continued use of the website after a change means you accept the revised terms."),
  heading("Governing law"),
  paragraph("These terms, and your use of the website, are governed by the laws of the United Arab Emirates. The courts of the United Arab Emirates have exclusive jurisdiction over any dispute arising from them."),
  heading("Questions about these terms or policies?"),
  paragraph("Kasumigaseki Properties Development. Our team replies personally."),
  paragraph("Email info@kpd.ae"),
];
