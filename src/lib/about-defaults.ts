/// Canonical About-page content as delivered by the client (public/legacy/
/// about-us.html). Single source of truth for the public page fallbacks and
/// the admin editor pre-fill. Pure data — safe for client components.

import type { TextStyle } from "@/lib/text-style";

export type AboutPerson = { name?: string; role?: string; bio?: string; image?: string };
export type AboutContent = {
  heading?: string;
  headingStyle?: TextStyle;
  heroTextStyle?: TextStyle;
  sectionHeading?: string;
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
  heading: "Built on understanding.",
  sectionHeading: "Built on understanding.",
  heroText: "Kasumigaseki Properties Development brings the institutional discipline of Kasumigaseki Capital listed on the Tokyo Stock Exchange Prime Market, externally audited, and publicly held. For investors and residents, this model is built to foster trust, mitigate risk, and support long-term value creation.",
  heroImage: "/legacy/assets/images/library/about-advisory-model-presentation.jpg",
  story: [
    "KAH-soo-mee-GAH-seh-kee.",
    "Kasumi means mist. Seki means barrier or gate. The name comes from Tokyo's government district, a place associated with infrastructure, continuity and long-term responsibility.",
    "We carry that mindset into development. Our Japanese heritage is not an aesthetic layer. It is how we govern, how we decide, how we build and how long we remain accountable for what we create.",
    "Kasumigaseki Properties Development is the UAE expression of that philosophy: one standard of quality, peace of mind and innovation, applied without exception.",
    "Behind that philosophy is a global platform spanning development, hospitality, logistics, healthcare and fund management. In the UAE, that breadth is concentrated into a focused development pipeline.",
  ],
  mission: "The art of knowing.\n\nKnowing is our discipline before it is our promise. Every decision is evidenced. It is why our standard repeats without exception, why our care continues long after handover, and why innovation never stops giving. This is the power of Kasumigaseki Properties Development.",
  vision: "Turning challenge into value.\n\nAdopted from our parent brand, we are driven by discovery and knowledge: to uncover the opportunity within the landscape, find the possibility in the challenge, and commit to delivering livable solutions. The value we create is intended to last. We look beyond the immediate solution to understand what people and places need, creating outcomes that serve a genuine purpose today while contributing to the long-term vitality of the communities they become part of.",
  chairmanText: "The markets we operate in reward patience, clarity and disciplined execution. Kasumigaseki Properties Development was formed to bring those qualities into development decisions: from how land is assessed to how a finished place will be lived in, operated and valued over time. Our work is measured by the confidence of our partners, the quality of our delivery and the long-term relevance of the communities and assets we help create.",
  chairmanName: "Mohammed Alabbar",
  chairmanRole: "Chairman",
  chairmanImage: "/legacy/assets/images/team/Alabbar.jpg",
  management: [
    { name: "Tatsuya Suzuki", role: "CEO", bio: "", image: "/team/tatsuya-suzuki.jpg" },
    { name: "Hiroyuki Chiba", role: "Executive Director", bio: "", image: "" },
    { name: "Ammar Al Tamimi", role: "Development Director", bio: "", image: "" },
  ],
};
