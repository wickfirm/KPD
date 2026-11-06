import { HomeMain } from "./home-page";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";
import { getHomeStaticTail } from "@/lib/legacy-home";
import type { HomeSettings } from "@/lib/home-defaults";
import { getPublishedDevelopmentCards } from "@/lib/nav-developments";

/// The homepage-uplift comparison view ("/home-uplift"): the exact delivered
/// shell and homepage content, with the "Gallery light" concept restyle of the
/// main sections applied through home-uplift.css (scoped to the extra
/// home-uplift-page body class). The live homepage ("/") renders HomeView and
/// is untouched until the client approves the flip.
export async function HomeUpliftView({ home }: { home: HomeSettings }) {
  const developmentCards = await getPublishedDevelopmentCards();
  return <>
    <DeliveredBodyClass bodyClass="home-development-page home-uplift-page" />
    <div className="uplift-ribbon" role="note">Uplift preview — the live homepage is still at /</div>
    <SiteShellHeader />
    <HomeMain settings={home} staticTail={getHomeStaticTail()} developmentCards={developmentCards} variant="uplift" />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page home-uplift-page" sources={["/legacy/assets/js/live-news.js?v=20261007-internal-links"]} />
  </>;
}
