import "../(public)/public.css";
import { ShellPrefetch } from "@/components/public/shell-prefetch";

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-development-page legacy-design-page"><ShellPrefetch />{children}</div>;
}
