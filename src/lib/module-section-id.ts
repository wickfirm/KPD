/// The section id the delivered template uses for this module ("tour" lives
/// in the showcase section; everything else uses its own slug).
export function moduleSectionId(slug: string) {
  return slug === "tour" ? "showcase" : slug;
}
