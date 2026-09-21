import "../(public)/public.css";

export default function ProjectPageLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-development-page single-project-page">{children}</div>;
}
