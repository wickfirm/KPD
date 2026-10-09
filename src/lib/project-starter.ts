/// The standard sections of a development page, offered when an editor creates
/// a new development ("Start with the standard sections"). Placeholder copy is
/// only there to tell the editor what belongs in each section; a new
/// development starts as a Draft, so nothing is public until it is published.

export type StarterModule = { slug: string; title: string; kind: "GALLERY" | "FLOOR_PLAN" | "SPECIFICATIONS" | "LOCATION" | "VIDEO" | "BROCHURE" | "CUSTOM"; sortOrder: number; content: { text?: string; images?: string[]; items?: { label?: string; value?: string }[]; mapUrl?: string } };

export const starterModules: StarterModule[] = [
  { slug: "overview", title: "The neighbourhood", kind: "CUSTOM", sortOrder: 10, content: { text: "Describe the district and what makes the address special.", items: [{ value: "5", label: "Min. to the nearest retail" }] } },
  { slug: "location", title: "Location", kind: "LOCATION", sortOrder: 20, content: { text: "Explain how the development connects to the city.", items: [{ value: "10 mins", label: "Nearest landmark" }], mapUrl: "" } },
  { slug: "tour", title: "3D Tour", kind: "VIDEO", sortOrder: 30, content: { text: "A short line introducing the visual tour.", images: [] } },
  { slug: "amenities", title: "Amenities", kind: "GALLERY", sortOrder: 40, content: { text: "Introduce the amenities and lifestyle.", images: [] } },
  { slug: "floor-plans", title: "Floor Plans", kind: "FLOOR_PLAN", sortOrder: 50, content: { text: "A short note about the layouts.", items: [] } },
  { slug: "payment-plan", title: "Payment Plan", kind: "CUSTOM", sortOrder: 60, content: { text: "Summarise how payment is structured.", items: [{ value: "20%", label: "On booking" }] } },
];

/// Friendly names for the section types (the stored values stay as they are).
export const moduleKindLabels: Record<StarterModule["kind"], string> = {
  CUSTOM: "Text section",
  GALLERY: "Photo gallery",
  FLOOR_PLAN: "Floor plans",
  SPECIFICATIONS: "Key facts",
  LOCATION: "Location",
  VIDEO: "Slideshow / tour",
  BROCHURE: "Brochure download",
};

/// First free slug of the form "<base>-copy", "<base>-copy-2", ...
export function nextCopySlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  let candidate = `${base}-copy`;
  for (let n = 2; used.has(candidate); n += 1) candidate = `${base}-copy-${n}`;
  return candidate;
}

/// Swaps the item at `index` with its neighbour and returns the ids in their new order.
export function reorderIds(ids: string[], id: string, direction: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
