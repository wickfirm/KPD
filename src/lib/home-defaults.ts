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
  contactHeading?: string;
  contactText?: string;
  experienceImages?: string[];
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
  statsNote: "(As of February, 2026)",
  /// The delivered development banner slides (the first slide shows on load).
  bannerSlides: [
    { image: "/legacy/assets/images/project-media/sxs/facade%20left%202.png", label: "Seven X Seven" },
    { image: "/legacy/assets/images/project-media/Emerald%20Villa/tm2161_vp29_interior_3brmasterbedroom_rev06.jpg", label: "Emerald Villa" },
    { image: "/legacy/assets/images/library/driveway-of-a-contemporary-house-with-a-garden-are-2026-01-08-00-24-21-utc.jpg", label: "Dubai Hills Mansion" },
    { image: "/legacy/assets/images/library/modern-apartment-buildings-with-balconies-on-sunny-2026-03-19-09-29-37-utc.jpg", label: "Residential development" },
    { image: "/legacy/assets/images/library/dubai-marina-skyline-with-modern-skyscrapers-and-w-2026-03-05-11-49-49-utc.jpg", label: "Dubai skyline" },
  ] as BannerSlide[],
  /// The delivered development cards.
  developmentCards: [
    { href: "/developments/seven-x-seven", image: "/legacy/assets/images/project-media/sxs/facade%20right%202.png", title: "Seven X Seven", copy: "A composed Meydan Horizon residence shaped by arrival, light, privacy, and efficient access to Dubai's core districts." },
    { href: "/developments/emerald-villa", image: "/legacy/assets/images/project-media/Emerald%20Villa/37.jpg", title: "Emerald Villa", copy: "A private villa composition shaped around garden arrival, layered privacy, and family-scaled living." },
    { href: "/developments/dubai-hills-mansion", image: "/legacy/assets/images/library/high-rise-apartment-buildings-in-downtown-vancouve-2026-03-20-04-35-07-utc.jpg", title: "Dubai Hills Mansion", copy: "A mansion-scale residence organized around garden arrival, private wellness, and long-horizon family living." },
  ] as DevelopmentCard[],
  heroVideo: "/videos/hero-experience-center.mp4",
  introHeading: "Turning Challenge\nInto Value",
  introParagraphs: [
    "KPD extends Kasumigaseki Capital's development, investment, and asset-management discipline into Dubai, pairing long-term capital with a carefully curated residential pipeline.",
    "Established to extend that legacy into one of the world's most dynamic property markets, KPD brings institutional discipline, long-term capital, and a decades-deep development track record to the UAE - delivering projects built not just for today's market, but for generations ahead.",
  ],
  developmentHeading: "Our Developments",
  contactHeading: "A first point of contact",
  contactText: "The Experience Center is designed for focused project previews, private advisory conversations, model walkthroughs, and material review in one calm appointment-led setting.",
  galleryPanels: [
    { key: "arrival", image: "/legacy/assets/images/experience-center/hq/1.jpg", caption: "Experience Center arrival" },
    { key: "materials", image: "/legacy/assets/images/experience-center/hq/4.jpg", caption: "Material corridor" },
    { key: "consultation", image: "/legacy/assets/images/experience-center/hq/7.jpg", caption: "Private consultation lounge" },
    { key: "model", image: "/legacy/assets/images/experience-center/hq/14.jpg", caption: "Model walkthrough space" },
    { key: "advisory", image: "/legacy/assets/images/experience-center/hq/17.jpg", caption: "Advisory room" },
  ],
};
