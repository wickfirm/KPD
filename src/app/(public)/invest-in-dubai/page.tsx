import { InvestView } from "@/components/public/invest-view";
import { loadInvestPage } from "@/lib/invest-page";

export const metadata = { title: "Invest in Dubai", description: "Invest in Dubai with Kasumigaseki Properties Development through a disciplined residential platform shaped by long-horizon value, location logic, and clear advisory pathways." };
export const revalidate = 300;

/// The page renders the delivered design (public/legacy/invest-in-dubai.html);
/// every section's copy, lists and images come from the investor-guide editor
/// (staticPage "invest-in-dubai": "hero" + "invest" blocks) with the delivered
/// content as the fallback (src/lib/invest-defaults.ts).
export default async function InvestPage() {
  const { hero, saved } = await loadInvestPage();
  return <InvestView hero={hero} saved={saved} />;
}
