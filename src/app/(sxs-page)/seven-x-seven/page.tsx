import type { Metadata } from "next";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { SevenXSevenFresh } from "@/components/public/sxs/SevenXSevenFresh";
import { loadSxsContent } from "@/lib/sxs-content";

export const dynamic = "force-dynamic";

/// A second seven x seven page, brought over from the client's residence site.
/// /developments/seven-x-seven is unchanged. Copy and media come from the CMS.
export async function generateMetadata(): Promise<Metadata> {
  const content = await loadSxsContent();
  const title = typeof content.seo.title === "string" && content.seo.title.trim() ? content.seo.title : "seven x seven";
  const description = typeof content.seo.description === "string" && content.seo.description.trim() ? content.seo.description : "seven x seven Meydan Horizon Residences. Luxury, in balance.";
  return { title, description };
}

export default async function SevenXSevenResidencePage() {
  const content = await loadSxsContent();
  return <><DeliveredBodyClass bodyClass="sxs-residence" /><SevenXSevenFresh content={content} /></>;
}
