/// Small kicker above each gallery-light development section, by module slug.
/// The CMS can override it per section (module content `eyebrow`); these are
/// the approved defaults. Shared by the public page and the section editor.
export const sectionEyebrowDefaults: Record<string, string> = { "meydan-horizon": "Meydan Horizon", location: "The location", tour: "Virtual tour", amenities: "Amenities", brochure: "Interiors", "floor-plans": "Floor plans", "payment-plan": "Payment plan" };

/// The eyebrow a section shows: the saved one (an empty string hides it), else the default.
export function sectionEyebrow(slug: string, saved: unknown): string {
  return typeof saved === "string" ? saved.trim() : sectionEyebrowDefaults[slug] ?? "";
}
