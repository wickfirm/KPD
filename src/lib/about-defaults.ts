/// Canonical About-page content as delivered by the client (public/legacy/
/// about-us.html). Single source of truth for the public page fallbacks and
/// the admin editor pre-fill. Pure data — safe for client components.

export type AboutPerson = { name?: string; role?: string; bio?: string; image?: string };
export type AboutContent = {
  heading?: string;
  heroText?: string;
  heroImage?: string;
  story?: string[];
  mission?: string;
  vision?: string;
  chairmanText?: string;
  chairmanName?: string;
  chairmanRole?: string;
  chairmanImage?: string;
  management?: AboutPerson[];
};

export const aboutDefaults = {
  heading: "Soulful Places\nEnriched Lives",
  heroText: "Kasumigaseki Properties Development brings institutional discipline, long-term capital, and a decades-deep development track record into one of the world's most dynamic property markets.",
  heroImage: "/legacy/assets/images/library/about-advisory-model-presentation.jpg",
  story: [
    "Kasumigaseki Properties Development brings the institutional discipline of Kasumigaseki Capital into Dubai's residential market, translating a global platform of development, hospitality, logistics, healthcare, and fund-management experience into a focused UAE pipeline.",
    "Established to extend that legacy into one of the world's most dynamic property markets, KPD brings institutional discipline, long-term capital, and a decades-deep development track record to the UAE - delivering projects built not just for today's market, but for generations ahead.",
  ],
  mission: "Our mission is to create residential, hospitality, and mixed-use destinations with disciplined feasibility, thoughtful architecture, and delivery control. We shape communities that elevate daily living while protecting long-term value for partners, buyers, and the city around them.",
  vision: "Our vision is to become a trusted boutique development platform for the region, where every project is guided by clarity, restraint, and durable performance. We aim to create places that feel precise, enduring, commercially sound, and unmistakably considered.",
  chairmanText: "The markets we operate in reward patience, clarity, and disciplined execution. KPD was formed to bring those qualities into development decisions, from how land is assessed to how a finished place will be lived in, operated, and valued over time. Our work is measured by the confidence of our partners, the quality of our delivery, and the long-term relevance of the communities and assets we help create.",
  chairmanName: "Mohammed Alabbar",
  chairmanRole: "Chairman",
  chairmanImage: "/legacy/assets/images/team/Alabbar.jpg",
  management: [
    { name: "Hiroyuki Chiba", role: "Executive Director", bio: "Hiroyuki Chiba supports KPD's long-term development philosophy, connecting institutional capital discipline with projects designed for durable value, memorable placemaking, and partner confidence.", image: "/legacy/assets/images/team/Chiba.jpg" },
    { name: "Ammar Al Tamimi", role: "Development Director", bio: "The executive management team supports the company's development platform through disciplined feasibility, delivery control, design coordination, and market positioning across every KPD project.", image: "/legacy/assets/images/team/Ammar.jpg" },
    { name: "Anas Al Khatib", role: "Commercial Director", bio: "KPD leadership brings together real estate judgment, capital planning, and operational clarity to create places that remain commercially sound and emotionally resonant over time.", image: "/legacy/assets/images/team/Anas.jpg" },
  ],
};
