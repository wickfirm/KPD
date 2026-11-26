// ─────────────────────────────────────────────────────────────────────────────
// English text that belongs to the site itself rather than to a page's content:
// navigation, labels, button text, messages. Read through t() in
// src/lib/i18n/index.ts, never imported directly by a component.
//
// Keys follow the translation sheet (KPD-translations-AR-JA.xlsx, "Key"
// column): two parts, area.name ("nav.home", "form.email"). Where the sheet
// already has a row for a string, its key is used unchanged; the rest follow
// the same pattern and are listed for the translators in
// docs/translations/strings-not-in-sheet.csv. English is the source of truth;
// ar.ts and ja.ts are typed against this file, so a key that does not exist
// here, or is misspelled there, does not compile.
//
// What belongs here: text written in the site's own code. Text an editor can
// change in the CMS is content and is translated there, per language. A few
// entries are the fallbacks shown when such a CMS field is left empty; they are
// named for their use, never with the CMS field's key, so the importer can tell
// the two apart (a key that exists here is a code string).
// ─────────────────────────────────────────────────────────────────────────────

const en = {
  /// The site header, its mobile menu, and page navigation of the same kind.
  nav: {
    home: "Home",
    developments: "Developments",
    about: "About",
    history: "History",
    media: "Media",
    news: "News",
    investorGuide: "Investor Guide",
    contact: "Contact",
    allDevelopments: "All developments",
    viewAllDevelopments: "View all developments",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    backToNews: "Back to News",
    language: "Language",
    // Not in the translation sheet.
    siteMenu: "Site menu",
    navigationLeft: "Primary navigation left",
    navigationRight: "Primary navigation right",
    homeLink: "Kasumigaseki Properties Development home",
    /// The header button when the editor has not set its label.
    enquireNow: "Enquire now",
    /// The section list at the top of the longer pages.
    onThisPage: "On this page",
  },
  /// The trail at the top of a page. Its other names are the nav labels.
  breadcrumb: {
    label: "Breadcrumb",
    /// The History page's trail names it as the delivered page did.
    legacy: "Legacy",
    investorGuide: "Investor guide",
  },
  /// The site footer: its legal links (also the tabs above the legal document)
  /// and the delivered wording behind each CMS-editable label.
  footer: {
    terms: "Terms and Conditions",
    privacy: "Privacy Policy",
    cookies: "Cookie Policy",
    companyName: "Kasumigaseki Properties Development",
    // Not in the translation sheet.
    developments: "Developments",
    company: "Company",
    about: "About Us",
    history: "History",
    investorGuide: "Investor Guide",
    media: "Media",
    news: "News & Updates",
    contact: "Contact Us",
    newsletterHeading: "Stay informed",
    /// The footer's own link when the editor has not set its label.
    privacyLink: "Privacy",
    /// The link that ends the newsletter note.
    privacyPolicy: "privacy policy.",
    socialLinks: "Social links",
    copyright: "Kasumigaseki Properties Development © 2026",
  },
  /// A news article or blog post.
  article: {
    blog: "Blog",
    update: "KPD Update",
    actions: "Article actions",
    contact: "Contact KPD",
  },
  /// The news listing page's own labels; its headings come from the CMS.
  news: {
    noArticles: "No articles in this category yet.",
    /// The number of items follows it ("Show all 24").
    showAll: "Show all",
    latest: "Latest news",
    inThePress: "In the press",
    articles: "Articles",
    email: "Email",
    filterArticles: "Filter articles",
  },
  home: {
    heroMedia: "KPD Experience Center presentation gallery",
    pauseVideo: "Pause video",
    developmentStandard: "Our development standard",
    figures: "Kasumigaseki Capital figures",
    developments: "Our developments",
    gallery: "Experience Center gallery",
    view: "View ↗",
    value: "Value",
    cardCta: "Explore",
    /// The contact block's button when the editor has not set its label.
    contactCta: "Book a visit",
    featuredDevelopments: "Featured developments",
    chooseSlide: "Choose a development slide",
    showSlide: "Show {label}",
  },
  about: {
    imageAlt: "KPD office workspace with a view over Dubai",
    missionVision: "Mission and vision",
    leadership: "Leadership",
    executiveManagement: "Executive Management",
    leaderAlt: "{name}, {role}",
    portraitAlt: "{role} portrait",
  },
  legacy: {
    imageAlt: "Tokyo alleyway and Japanese hospitality context",
    years: "Years",
    milestoneAlt: "Milestone {year}",
    /// The map link when the editor has not set its label.
    learnMore: "Learn more",
  },
  contact: {
    inquiry: "Contact inquiry",
  },
  /// The Investor Guide's section navigation, and the kicker shown when a
  /// section has no eyebrow of its own in the editor.
  invest: {
    navBenefits: "Why Dubai",
    capBenefits: "Why Dubai",
    navMarket: "Yields",
    capMarket: "Rental yield",
    navCalculator: "Calculator",
    capCalculator: "Mortgage calculator",
    navPayment: "Payment plans",
    capPayment: "Payment plans",
    navResidency: "Golden Visa",
    capResidency: "Golden Visa",
    navPathway: "Pathway",
    capPathway: "Investment pathway",
    navTrust: "Trust",
    capTrust: "Developer trust",
    navLiquidity: "Exit",
    capLiquidity: "Market liquidity and exit",
    navFeatured: "Developments",
    capFeatured: "Featured developments",
    navFaq: "FAQ",
    capFaq: "Frequently asked questions",
    eyebrow: "Invest in Dubai",
    heroCta: "Speak to advisory",
    yieldTable: "Rental yield and capital appreciation by city",
    altPayment: "Downtown Dubai towers",
    altResidency: "Panoramic Dubai skyline",
    altTrust: "Modern financial district towers",
    altHero: "Dubai skyline with Burj Khalifa",
    cardAlt: "{title} exterior",
  },
  /// Development pages. `timeline` and `milestone` are on the History page.
  dev: {
    startTour: "Start the tour",
    timeline: "Timeline",
    milestone: "Milestone",
    // Not in the translation sheet.
    section: "Section",
    openInGoogleMaps: "Open in Google Maps",
    download: "Download",
    brochure: "Brochure",
    calculator: "Calculator",
    downloadPaymentPlan: "Download payment plan",
    plan: "Plan {number}",
    minutes: "{number} min",
    figureAlt: "{name} — {title}",
    presentationAlt: "{name} presentation",
    floorPlanAlt: "{name} {label} floor plan",
    location: "Location",
    amenities: "Amenities",
    materials: "Materials",
    floorPlans: "Floor plans",
    payment: "Payment",
    locationTimes: "Location and travel times",
    nearby: "Nearby destinations",
    projectRender: "Project render",
    projectRenderSlides: "Project render slides",
    watch: "Watch",
    showSlide: "Show slide {number}",
    locationMap: "{name} location map",
    travelHighlights: "{title} travel highlights",
    arrangeViewing: "Arrange a private viewing",
    viewingAlt: "Private viewing and advisory workspace",
    introAlt: "{name} introduction",
    exteriorAlt: "{name} exterior",
    /// The wording behind the labels an editor can set for a development.
    bookViewing: "Book a viewing",
    explore: "Explore",
    overview: "Overview",
    enquireHeading: "Arrange a private\nviewing.",
    enquireEyebrow: "Enquire",
    enquireText: "Floor plans, pricing, and availability are shared through a single appointment-led conversation.",
    registerInterest: "Register interest",
  },
  /// Download links shared by the brochure pop-up and the development pages.
  brochure: {
    title: "Property Brochure",
    intro: "Fill the form below to download the property brochure.",
    download: "Download brochure",
    downloadFloorPlans: "Download floor plans",
    downloadPaymentPlan: "Download Payment Plan",
    requestPlan: "Request plan",
  },
  /// The public forms' own words: the Contact page's form, and the enquiry
  /// pop-up, newsletter and floor-plan forms the delivered script submits.
  /// Where the sheet has a "Forms (code)" row, its key is used and the English
  /// is the row's text. What a visitor types or picks is never translated
  /// here: a choice is shown in their language and posted in English.
  form: {
    yourDetails: "Your details",
    aboutYourInterest: "About your interest",
    title: "Title",
    mr: "Mr.",
    ms: "Ms.",
    mrs: "Mrs.",
    dr: "Dr.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    countryCode: "Country code",
    inquiryType: "Inquiry type",
    enquirerType: "Enquirer type",
    iAmA: "I am a",
    client: "Client",
    broker: "Broker",
    projectOfInterest: "Project of interest",
    agency: "Agency / company",
    reraNumber: "RERA / ORN no.",
    message: "Message",
    yourRequest: "Your request",
    relatedProject: "Related project",
    natureOfInquiry: "Nature of inquiry",
    companyDetails: "Company details",
    companyAgency: "Company / agency",
    marketCountry: "Market / country",
    website: "Website",
    application: "Application",
    roleDepartment: "Role / department",
    rolePlaceholder: "e.g. Marketing, Development",
    linkedinPortfolio: "LinkedIn / portfolio",
    uploadCv: "Upload CV",
    cvFile: "Attach a PDF, DOC or DOCX (max 4 MB)",
    chooseFile: "Choose file",
    mediaRequest: "Media request",
    publicationOutlet: "Publication / outlet",
    deadline: "Deadline",
    sending: "Sending your enquiry…",
    uploadingCv: "Uploading your CV…",
    cvTooLarge: "The CV is too large (4 MB maximum). Please attach a smaller file.",
    cvUploadFailed: "The CV could not be uploaded. Please try again.",
    provideEmail: "Please provide your email address.",
    invalidPhone: "Please enter a valid phone number.",
    success: "Thank you. Your enquiry has been received.",
    /// The brochure pop-up's heading once the request has gone through.
    thankYou: "Thank you",
    unableToSend: "Unable to send your enquiry.",
    unableToSendRetry: "Unable to send your enquiry. Please try again.",
    /// The sheet's wording for the same situations, with no message of its
    /// own above: the server's and the delivered script's refusals fall back
    /// on these where their own row is still missing.
    required: "This field is required.",
    invalidEmail: "Please enter a valid email address.",
    error: "We could not submit your enquiry. Please try again.",
    errorShort: "Unable to send your request.",
    acceptTerms: "Please accept the Terms and Privacy Policy.",
  },
  /// The enquiry pop-up, which the delivered script (site-cms.js) builds.
  /// The footer publishes these in the page's language, keyed by their
  /// English, and the script shows them in place of its own.
  popup: {
    title: "Inquiry Form",
    intro: "Share a few contact details and the KPD team will coordinate the right advisory conversation.",
    minimize: "Minimize inquiry form",
    fullName: "Full name",
    emailAddress: "Email address",
    phoneNumber: "Phone number",
    shortMessage: "Short message",
    interest: "Interest",
    interestedIn: "Interested in",
    onlineCall: "Online call",
    submit: "Submit inquiry",
    privacyNote: "The KPD team will respond with the right advisory route.",
  },
  /// The tabs above the Terms, Privacy and Cookies document.
  legal: {
    pages: "Legal pages",
    email: "Email",
  },
  /// How a sentence ends, where the site adds the stop itself.
  punctuation: {
    sentenceEnd: ".",
  },
} as const;

type DeepWiden<T> = { [K in keyof T]: T[K] extends string ? string : DeepWiden<T[K]> };

/// The shape of a complete dictionary.
export type Messages = DeepWiden<typeof en>;

/// The shape of a translation: any entry may be left out, and English is
/// shown in its place.
export type Translation<T = Messages> = { [K in keyof T]?: T[K] extends string ? string : Translation<T[K]> };

export default en;
