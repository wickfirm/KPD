import type { Metadata } from "next";
import { SevenXSevenFresh } from "@/components/public/sxs/SevenXSevenFresh";
import { emptySxsContent } from "@/lib/sxs-content";

export const metadata: Metadata = {
  title: "seven x seven",
  description: "seven x seven Meydan Horizon Residences. Luxury, in balance.",
};

/// A second seven x seven page, brought over from the client's residence site.
/// /developments/seven-x-seven is unchanged.
export default function SevenXSevenResidencePage() {
  return <SevenXSevenFresh content={emptySxsContent()} />;
}
