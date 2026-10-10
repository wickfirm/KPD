import { LegacyView } from "@/components/public/page-views";
import { loadStaticBlocks } from "@/lib/static-blocks";

export const metadata = { title: "Legacy", description: "The long-horizon KPD platform, from Tokyo to Dubai." };
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function LegacyPage() {
  return <LegacyView blocks={await loadStaticBlocks("legacy")} />;
}
