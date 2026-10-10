import { HomeView } from "@/components/public/home-view";
import { loadHomeSettings } from "@/lib/home-saved";

export const revalidate = 300;

/// Unified delivered shell + React content. CMS-managed sections render as
/// React; the delivered design is the fallback for every field.
export default async function HomePage() {
  return <HomeView home={await loadHomeSettings()} />;
}
