/// Canonical Legacy-page content as delivered by the client (public/legacy/
/// legacy.html). Single source of truth: the public page renders these values
/// when the CMS has none, and the admin editor pre-fills from them. Pure data —
/// safe to import from client components.

import type { TextStyle } from "@/lib/text-style";

export type LegacyMilestone = { year?: string; title?: string; summary?: string; body?: string; image?: string };

export type LegacyContent = { heading?: string; text?: string; image?: string; headingStyle?: TextStyle; textStyle?: TextStyle; timeline?: LegacyMilestone[] };

export const legacyDefaults: Required<Pick<LegacyContent, "heading" | "text" | "image">> & { timeline: LegacyMilestone[] } = {
  heading: "History",
  text: "",
  image: "/legacy/assets/images/about/about-hero.jpg",
  timeline: [
    { year: "2011", title: "Formation of Kasumigaseki Capital", summary: "Kasumigaseki Capital was founded in 2011.", body: "", image: "/timeline/2011-kc-formation.jpg" },
    { year: "2018", title: "Listing on Tokyo Stock Exchange Mothers Market", summary: "Kasumigaseki Capital marked its transition from a private developer to a publicly listed growth platform with institutional capital access.", body: "", image: "/timeline/2018-tse-mothers.jpg" },
    { year: "2020", title: "Launch of fav", summary: "Kasumigaseki Capital completed and launched the first hotel property under fav hotel brand.", body: "", image: "/timeline/2020-fav.jpg" },
    { year: "2022", title: "Middle East Market Entry", summary: "Kasumigaseki Capital formally entered the Middle East with the establishment of Kasumigaseki Middle East LLC in Dubai.", body: "", image: "/timeline/2022-kc-mena.jpg" },
    { year: "2023", title: "Upgrade to Tokyo Stock Exchange Prime Market", summary: "Kasumigaseki Capital was upgraded to the Tokyo Stock Exchange Prime Market, Japan's highest listing tier.", body: "", image: "/timeline/2023-tse-prime.jpg" },
    { year: "2024", title: "Launch of seven x seven", summary: "Kasumigaseki Capital expanded its hospitality portfolio with the launch of seven x seven in Itoshima, Fukuoka and its flagship property in Ishigaki, Okinawa.", body: "", image: "/timeline/2024-seven-x-seven.jpg" },
    { year: "2026", title: "Establishment of Kasumigaseki Properties Development", summary: "Kasumigaseki Middle East LLC established Kasumigaseki Properties Development LLC as Kasumigaseki Capital's dedicated UAE development arm.", body: "", image: "/timeline/2026-kpd.jpg" },
    { year: "2026", title: "Launch of seven x seven residences in Meydan Horizon", summary: "Kasumigaseki Properties Development’s first flagship residential project in the UAE, comprising 155 residences.\nThe launch marks seven x seven’s first move from hospitality into residential living.", body: "", image: "/timeline/2026-seven-x-seven-meydan.jpg" },
  ],
};
