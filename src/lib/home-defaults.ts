/// Canonical homepage content as delivered by the client (public/legacy/
/// index.html). Single source of truth for the public page fallbacks and the
/// admin homepage editor. Pure data — safe for client components.

export type HomeSettings = {
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
  heroVideo: "/legacy/assets/images/experience-center/hq/5.mp4",
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
