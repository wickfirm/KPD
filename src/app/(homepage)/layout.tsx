import "../(public)/public.css";
import { ShellPrefetch } from "@/components/public/shell-prefetch";

/// The homepage intentionally owns its chrome. It is a faithful migration of
/// the client-delivered document, rather than a composition of the simplified
/// shared public shell used by the other Phase 1 routes.
export default function HomepageLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-development-page"><ShellPrefetch />{children}</div>;
}
