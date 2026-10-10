import { AboutView } from "@/components/public/page-views";
import { loadStaticBlocks } from "@/lib/static-blocks";

export const metadata = { title: "About", description: "Learn about Kasumigaseki Properties Development and its Dubai platform." };
export const revalidate = 300;

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function AboutPage() {
  return <AboutView blocks={await loadStaticBlocks("about")} />;
}
