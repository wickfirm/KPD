// ─────────────────────────────────────────────────────────────────────────────
// Which boxes of each editor a translator may write in, by field name.
//
// On an Arabic or Japanese tab every other control is shared with English and
// is locked: images, links, switches, order, styles and numbers. A box a
// repeater renders (a list entry's title, a caption) carries no field name —
// the list is serialised into one hidden field — so nameless text boxes count
// as text, except the ones whose label says they are not text (an icon name, a
// link, a coordinate): those are listed per editor by their label. Nothing in
// the editor's markup is changed for this, so the English tab's markup stays
// exactly what it was.
// ─────────────────────────────────────────────────────────────────────────────

export const articleTextFields = ["title", "summary", "coverImageAlt", "body", "seoTitle", "seoDescription"] as const;
export const articleSharedLabels: readonly string[] = [];

export const pageTextFields = [
  "title", "heading", "intro", "eyebrow", "paragraphs",
  "aboutHeroCtaLabel", "aboutHeroSecondaryLabel", "aboutKeyFacts", "aboutPhilosophyKicker", "aboutSectionHeading", "aboutValueCaps",
  "aboutMissionKicker", "aboutVisionKicker", "mission", "vision", "aboutLeadershipKicker", "aboutLeadershipHeading",
  "chairmanText", "chairmanName", "chairmanRole", "ceoText", "ceoName", "ceoRole",
  "aboutTeamKicker", "aboutTeamHeading", "managementName", "managementRole", "managementBio",
  "aboutVisitKicker", "aboutVisitHeading", "aboutVisitText", "aboutVisitCtaLabel", "aboutVisitLinkLabel",
  "legacyLede", "legacyStartLabel", "legacyMapLabel", "legacyNameKicker", "legacyNameHeading", "legacyNameText",
  "legacyBandKicker", "legacyBandHeading", "legacyBandText", "legacyBandLinkLabel", "legacyCtaLabel",
  "legalContactHeading", "legalContactText",
  // The wording of the Contact page. The lists of choices are not here yet:
  // a form must keep posting the English choice, which the forms work adds.
  "contactFormHeading", "contactSubmitLabel", "contactAddressLabel", "contactAddress", "contactDirectionsLabel",
  "contactCallLabel", "contactQuickCallLabel", "contactQuickEmailLabel", "contactTermsText", "contactMarketingText",
  "contactSalesLabel", "contactCustomerLabel", "contactChannelLabel", "contactJobLabel", "contactPressLabel",
  "contactSalesMessagePrompt", "contactCustomerMessagePrompt", "contactChannelMessagePrompt", "contactJobMessagePrompt", "contactPressMessagePrompt",
  "seoTitle", "seoDescription",
] as const;

export const homeTextFields = [
  "heroText", "heroCtaLabel", "introHeading", "introKicker", "introParagraphs", "statsKicker", "statsNote",
  "developmentKicker", "developmentHeading", "developmentBannerText", "developmentCtaLabel", "developmentText",
  "cardCtaLabel", "newsHeading", "newsText", "newsCta", "newsCardLabel",
  "contactHeading", "contactKicker", "contactText", "contactCtaLabel",
  "seoTitle", "seoDescription",
] as const;

export const investTextFields = ["eyebrow", "heading", "intro", "ctaLabel", "seoTitle", "seoDescription"] as const;
/// Boxes of the investor guide that look like text but hold a name, a link or a number.
export const investSharedLabels = ["Icon", "Button link", "Link", "Country code", "Yield bar length", "Appreciation bar length", "Font size", "Line height"] as const;

export const newsTextFields = [
  "eyebrow", "heading", "intro", "pressCardCta", "featureCta", "cardCta", "emptyText",
  "filterAll", "filterPerspective", "filterAnnouncement",
  "coverageLabel", "coverageHeading", "pressLabel", "pressHeading", "pressText", "pressLinkLabel", "pressLinkText",
] as const;
/// Other publications' headlines and names stay as published, in every language.
export const newsSharedLabels = ["Publication", "Headline"] as const;

export const settingsTextFields = [
  "headerCtaLabel", "enquiryLabel", "callLabel", "whatsappLabel",
  "popupTitle", "popupIntro", "popupSubmitLabel", "popupNote",
  "newsletterHeading", "newsletterSubmitLabel", "newsletterNote",
  "footerDevelopmentsTitle", "footerCompanyTitle", "footerMediaTitle",
  "footerAboutLabel", "footerHistoryLabel", "footerInvestorLabel", "footerNewsLabel", "footerContactLabel",
  "footerTermsLabel", "footerPrivacyLabel", "footerCookiesLabel", "footerCopyright",
] as const;

export const projectTextFields = [
  "name", "tagline", "description", "location",
  "heroCtaLabel", "brochureLabel", "bookLabel", "labelDriveNote", "labelCalculator", "labelSubnavCta",
  "enquireEyebrow", "enquirePrimaryLabel", "enquireSecondaryLabel", "enquireHeading", "enquireText",
  "seoTitle", "seoDescription",
] as const;

export const moduleTextFields = ["title", "eyebrow", "text", "ctaLabel"] as const;
export const moduleSharedLabels = ["Optional link"] as const;

export const sxsTextFields = [
  "seoTitle", "seoDescription",
  "heroEyebrow", "heroHeadline", "heroBody", "aboutHeadline", "aboutBody", "manifestoBody",
  "apartmentsHeadline", "apartmentsBody", "galleryHeadline", "galleryNote", "exteriorHeadline", "exteriorBody",
  "amenitiesHeadline", "communityHeadline", "communityBody", "locationHeadline", "locationBody",
  "tabOne", "tabTwo", "tabThree", "tabPenthouse", "floorHeadline",
  "paymentHeadline", "paymentBody",
  "registerHeadline", "registerBody", "consent", "footerBody", "footerCopyright",
  "ctaPrimary", "ctaSecondary", "ctaSubmit",
] as const;
/// Boxes of the landing page that look like text but hold an anchor, a position, a coordinate or a share.
export const sxsSharedLabels = ["Section id", "Position", "Latitude", "Longitude", "Percent"] as const;
