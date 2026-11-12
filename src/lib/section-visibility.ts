// ─────────────────────────────────────────────────────────────────────────────
// Section visibility: an editor can hide a whole block of a public page without
// deleting its content. Stored in one site_settings row ("section_visibility")
// as { [pageKey]: hiddenSectionIds[] }. A section that is not listed is shown,
// so a page nobody has touched renders exactly as before.
// Pure helpers only; the database read lives in section-visibility-store.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const sectionVisibilityKey = "section_visibility";

export type SectionDef = { id: string; label: string; hint?: string };

/// The fixed pages and the blocks each one can hide, in page order.
export const pageSections = {
  home: [
    { id: "hero", label: "Hero video / image", hint: "The full-width opening with the headline." },
    { id: "intro", label: "Introduction", hint: "“The Art of Knowing” text and values." },
    { id: "numbers", label: "Key figures" },
    { id: "developments", label: "Developments banner", hint: "The development slider and its heading." },
    { id: "cards", label: "Development cards" },
    { id: "contact", label: "Contact strip" },
    { id: "gallery", label: "Experience Center gallery" },
    { id: "news", label: "Latest news" },
  ],
  about: [
    { id: "hero", label: "Hero", hint: "Page title, intro, image and key facts." },
    { id: "philosophy", label: "Philosophy / our story" },
    { id: "mission", label: "Mission & vision" },
    { id: "leadership", label: "Leadership messages", hint: "Chairman and CEO." },
    { id: "team", label: "Executive management" },
    { id: "visit", label: "Closing band", hint: "The Experience Center invitation at the bottom." },
  ],
  legacy: [
    { id: "hero", label: "Hero", hint: "Page title, intro and image." },
    { id: "name", label: "Our name" },
    { id: "timeline", label: "Timeline" },
    { id: "band", label: "Closing band" },
  ],
  "invest-in-dubai": [
    { id: "hero", label: "Hero", hint: "Title, intro, buttons and key figures." },
    { id: "subnav", label: "“On this page” bar" },
    { id: "benefits", label: "Why Dubai" },
    { id: "market", label: "Rental yields" },
    { id: "calculator", label: "Mortgage calculator" },
    { id: "residency", label: "Golden Visa" },
    { id: "pathway", label: "Investment pathway" },
    { id: "trust", label: "Developer trust" },
    { id: "liquidity", label: "Market liquidity and exit" },
    { id: "featured", label: "Featured developments" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Closing band" },
  ],
  news: [
    { id: "hero", label: "Hero", hint: "Page title and introduction." },
    { id: "articles", label: "Articles", hint: "The article list (or the press cards when the page leads with press)." },
  ],
  contact: [
    { id: "hero", label: "Hero", hint: "Title, intro, phone and email." },
    { id: "form", label: "Enquiry form" },
  ],
} satisfies Record<string, SectionDef[]>;

/// Blocks that already had their own show/hide switch inside the page editor
/// before this panel existed. They keep that switch (one control per block).
export const ownSwitchNotes: Record<string, string> = {
  news: "“In the press” and the press contact band keep their own Show switches further down this editor.",
  "invest-in-dubai": "Payment plans keeps its own Show switch further down this editor.",
  development: "The private viewing band keeps its own Show switch in Development details.",
};

export type FixedSectionPage = keyof typeof pageSections;

export function isFixedSectionPage(key: string): key is FixedSectionPage {
  return Object.prototype.hasOwnProperty.call(pageSections, key);
}

/// Development pages are keyed by project id so a slug change keeps the setting.
export const developmentSectionPage = (projectId: string) => `development:${projectId}`;

/// The blocks of a development page: the fixed ones around its own sections.
export function developmentSections(modules: { id: string; title: string }[], gallery: boolean): SectionDef[] {
  return [
    ...(gallery ? [{ id: "hero", label: "Hero", hint: "Name, buttons, image and key facts." }, { id: "overview", label: "Overview" }] : []),
    ...modules.map((module) => ({ id: `module:${module.id}`, label: module.title || "Untitled section" })),
    { id: "calculator", label: "Mortgage calculator" },
  ];
}

export type HiddenSections = Record<string, string[]>;

/// Keeps only { key: string[] } entries; anything else is dropped.
export function parseHiddenSections(value: unknown): HiddenSections {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: HiddenSections = {};
  for (const [key, list] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const ids = [...new Set(list.filter((id): id is string => typeof id === "string" && id.length > 0))];
    if (ids.length) result[key] = ids;
  }
  return result;
}

/// The form posts one "show:<id>" checkbox per section; unchecked = hidden.
export function hiddenFromForm(formData: FormData, sections: SectionDef[]): string[] {
  return sections.filter((section) => formData.get(`show:${section.id}`) !== "on").map((section) => section.id);
}

/// A small predicate the views use: shown(id) is true unless the editor hid it.
export function sectionFilter(hidden: readonly string[] | undefined) {
  const set = new Set(hidden ?? []);
  return (id: string) => !set.has(id);
}
