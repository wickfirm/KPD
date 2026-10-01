import { revalidatePath } from "next/cache";

/// Busts the whole public route cache: every ISR page (export const revalidate)
/// re-renders with fresh database content on its next request. Called from each
/// admin mutation that can change public-facing content — including the shared
/// chrome, because (public)/layout.tsx renders the "global" settings record on
/// every public route. Existing targeted revalidatePath() calls stay in place;
/// this is the coarse safety net that also covers detail pages and the sitemap.
export function revalidatePublicContent(): void {
  revalidatePath("/", "layout");
}
