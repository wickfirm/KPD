/// Canonical homepage content as delivered by the client (public/legacy/
/// index.html). Single source of truth for the public page fallbacks and the
/// admin homepage editor. Pure data â€” safe for client components.

export type DevelopmentCard = { href: string; image: string; title: string; copy: string };
export type StatItem = { value: string; label: string };
export type BannerSlide = { image: string; label: string };

export type HomeSettings = {
  introStats?: StatItem[];
  statsNote?: string;
  bannerSlides?: BannerSlide[];
  developmentCards?: DevelopmentCard[];
  heroVideo?: string;
  introHeading?: string;
  introParagraphs?: string[];
  developmentHeading?: string;
  developmentHeadingPosition?: "overlay" | "below";
  developmentCtaLabel?: string;
  developmentCtaUrl?: string;
  developmentCtaVisible?: boolean;
  developmentTextVisible?: boolean;
  developmentText?: string;
  newsHeading?: string;
  newsText?: string;
  newsCta?: string;
  newsCtaUrl?: string;
  newsCtaVisible?: boolean;
  contactHeading?: string;
  contactText?: string;
  contactCtaLabel?: string;
  contactCtaUrl?: string;
  contactCtaVisible?: boolean;
  experienceImages?: string[];
  experienceCaptions?: string[];
};

export type GalleryPanel = { key: string; image: string; caption: string };

export const homeDefaults = {
  /// The delivered AUM stat strip.
  introStats: [
    { value: "$4.4B", label: "Global AUM" },
    { value: "$320M", label: "Dubai Real Estate" },
    { value: "$2.27B", label: "Logistics" },
    { value: "$1.64B", label: "Hotels" },
  ] as StatItem[],
  statsNote: "(As of August 2026)",
  /// The delivered development banner slides (the first slide shows on load).
  bannerSlides: [
    { image: "/legacy/assets/images/project-media/sxs/facade%20left%202.png", label: "seven x seven Meydan Horizon Residences" },
    { image: "/legacy/assets/images/project-media/Emerald%20Villa/tm2161_vp29_interior_3brmasterbedroom_rev06.jpg", label: "Villa 174" },
    { image: "/legacy/assets/images/library/driveway-of-a-contemporary-house-with-a-garden-are-2026-01-08-00-24-21-utc.jpg", label: "Villa 24" },
    { image: "/legacy/assets/images/library/modern-apartment-buildings-with-balconies-on-sunny-2026-03-19-09-29-37-utc.jpg", label: "Residential development" },
    { image: "/legacy/assets/images/library/dubai-marina-skyline-with-modern-skyscrapers-and-w-2026-03-05-11-49-49-utc.jpg", label: "Dubai skyline" },
  ] as BannerSlide[],
  /// The delivered development cards.
  developmentCards: [
    { href: "/developments/seven-x-seven", image: "/legacy/assets/images/project-media/sxs/facade%20right%202.png", title: "seven x seven Meydan Horizon Residences", copy: "A composed Meydan Horizon residence where arrival, light and privacy meet measured access to Dubai's core districts." },
    { href: "/developments/emerald-villa", image: "/legacy/assets/images/project-media/Emerald%20Villa/37.jpg", title: "Villa 174", copy: "A private family villa organised around planted arrival, layered privacy and room for daily life to unfold." },
    { href: "/developments/dubai-hills-mansion", image: "/legacy/assets/images/library/high-rise-apartment-buildings-in-downtown-vancouve-2026-03-20-04-35-07-utc.jpg", title: "Villa 24", copy: "A mansion-scale residence where garden arrival, private wellness and long-horizon family living are composed as one." },
  ] as DevelopmentCard[],
  heroVideo: "/videos/hero-experience-center.mp4",
  introHeading: "Turning Challenge\nInto Value",
  introParagraphs: [
    "As the first Japanese developer in the UAE, Kasumigaseki Properties Development is the development arm of Kasumigaseki Capital, a public Tokyo-listed company. It introduces a distinctive approach to real estate: a promise of a higher standard of life. Driven by a commitment to superior quality, we believe meaningful developments begin with a deep respect for their environment, context, and community.",
    "From refined craftsmanship and forward-thinking innovation to thoughtful guardianship, we uphold rigorous standards at every stage, creating spaces that stand the test of time.",
  ],
  developmentHeading: "Different places. One standard.",
  developmentTextVisible: true,
  developmentText: "Quality, peace of mind and innovation are not a tier we reserve for certain projects. They are the standard every Kasumigaseki development is held to, whatever its form or price.",
  newsHeading: "The Latest from Kasumigaseki Properties Development.",
  newsText: "Development updates, market notes and the thinking behind how we build.",
  newsCta: "Read News & Insights",
  contactHeading: "Visit the Experience Centre",
  contactText: "Some things are best understood in person. At the Kasumigaseki Properties Development Experience Center you can handle the finishes, walk the model and talk through the project with the people who shaped it.",
  galleryPanels: [
    { key: "arrival", image: "/legacy/assets/images/experience-center/hq/1.jpg", caption: "Private Consultation" },
    { key: "materials", image: "/legacy/assets/images/experience-center/hq/4.jpg", caption: "Model Walkthrough" },
    { key: "consultation", image: "/legacy/assets/images/experience-center/hq/7.jpg", caption: "Delivery Workspace" },
    { key: "model", image: "/legacy/assets/images/experience-center/hq/14.jpg", caption: "Asset Performance" },
    { key: "advisory", image: "/legacy/assets/images/experience-center/hq/17.jpg", caption: "Platform Note" },
  ],
};
