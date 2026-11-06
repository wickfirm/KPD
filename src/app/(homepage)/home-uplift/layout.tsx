import "../../(public)/public.css";
import "../home-uplift.css";

/// Loads the Gallery-light uplift layer after the whole public chain
/// (figtree → planner → site.css → planner-end), so the restyle always wins
/// the cascade while the delivered stylesheet stays byte-frozen. This nested
/// layout exists so "/" (one level up) never receives the uplift CSS.
export default function UpliftLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
