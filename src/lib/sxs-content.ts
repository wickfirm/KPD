const sectionKeys = ["navigation", "hero", "about", "manifesto", "apartments", "gallery", "exterior", "amenities", "community", "location", "floorplans", "payment", "register", "footer", "privacy", "cta"] as const;

export type SxsSectionKey = (typeof sectionKeys)[number];
export type SxsContent = Record<SxsSectionKey, Record<string, unknown>>;

/// The residence page renders its designed copy when a section has no CMS value.
export function emptySxsContent(): SxsContent {
  return Object.fromEntries(sectionKeys.map((key) => [key, {}])) as SxsContent;
}
