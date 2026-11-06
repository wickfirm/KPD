import { HomeUpliftView } from "@/components/public/home-uplift-view";
import { loadHomeSettings } from "@/lib/home-saved";

export const dynamic = "force-dynamic";

/// Comparison preview for the homepage redesign — deliberately NOT in the
/// sitemap and not indexed; the live homepage stays at "/" until approval.
export const metadata = {
  title: "Homepage uplift preview | Kasumigaseki Properties Development",
  description: "Internal comparison preview of the homepage redesign.",
  robots: { index: false, follow: false },
};

export default async function HomeUpliftPage() {
  return <HomeUpliftView home={await loadHomeSettings()} />;
}
