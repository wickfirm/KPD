import "../(public)/public.css";
import { ShellPrefetch } from "@/components/public/shell-prefetch";

export default function ProjectPageLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-development-page single-project-page"><ShellPrefetch />{children}</div>;
}
