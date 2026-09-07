import type { Metadata } from "next";
import Link from "next/link";
import { requireSession, clearSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import "../admin.css";

export const metadata: Metadata = { title: "KPD CMS", robots: { index: false } };
export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles", label: "News & Blog" },
  { href: "/admin/projects", label: "Developments" },
  { href: "/admin/rss", label: "RSS Queue" },
  { href: "/admin/submissions", label: "Submissions" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  async function logout() {
    "use server";
    await clearSessionCookie();
    redirect("/admin/login");
  }

  return (
    <div className="cms">
      <header className="cms-header">
        <span className="cms-brand">KPD CMS</span>
        <nav className="cms-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="cms-user">
          <span>{session.name}</span>
          <form action={logout}>
            <button type="submit" className="cms-btn">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="cms-main">{children}</main>
    </div>
  );
}
