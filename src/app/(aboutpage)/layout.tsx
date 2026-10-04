import "../(public)/public.css";
import { ShellPrefetch } from "@/components/public/shell-prefetch";

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-development-page about-design-page"><ShellPrefetch />{children}</div>;
}
