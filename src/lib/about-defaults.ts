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
  ceoText?: string;
  ceoName?: string;
  ceoRole?: string;
  ceoImage?: string;
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
  ceoText: "Dubai rewards developers who arrive with patience and leave with a reputation. KPD was built to do both - to assess land with discipline, to build with craft, and to remain responsible for what we hand over long after the keys change hands.",
  ceoName: "",
  ceoRole: "Chief Executive Officer",
  ceoImage: "/legacy/assets/images/section/CEO%20Image.png",
  management: [
    { name: "Tatsuya Suzuki", role: "Chief Executive Officer", bio: "", image: "/team/tatsuya-suzuki.jpg" },
    { name: "Kosuke Urasawa", role: "Managing Director", bio: "", image: "/team/kosuke-urasawa.jpg" },
    { name: "Tsukasa Chiba", role: "Project & Design Management Head", bio: "", image: "/team/tsukasa-chiba.jpg" },
    { name: "Ammar Kheder Houri", role: "Real Estate Development Head", bio: "", image: "/team/ammar-kheder-houri.jpg" },
    { name: "Aqeeb Mohamed Akbar", role: "Sales Manager", bio: "", image: "/team/aqeeb-mohamed-akbar.jpg" },
    { name: "Musthaaq Mohamed Sabry", role: "Finance Manager", bio: "", image: "/team/musthaaq-mohamed-sabry.jpg" },
    { name: "Dalia Najib Elsayyed", role: "Customer Relationship Manager", bio: "", image: "/team/dalia-najib-elsayyed.jpg" },
    { name: "Rayan Kesserwan", role: "Senior Marketing Manager", bio: "", image: "/team/rayan-kesserwan.jpg" },
    { name: "Mohammad Abdoun", role: "Design Manager", bio: "", image: "/team/mohammad-abdoun.jpg" },
    { name: "Anas Abdulrazzaq", role: "Project Manager", bio: "", image: "/team/anas-abdulrazzaq.jpg" },
    { name: "Omar Muwahid", role: "Project Manager", bio: "", image: "/team/omar-muwahid.jpg" },
    { name: "Mohammad Rizwan Wani", role: "Project Manager", bio: "", image: "/team/mohammad-rizwan-wani.jpg" },
  ],
};
