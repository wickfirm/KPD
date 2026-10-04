import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { editablePages } from "@/lib/editable-pages";
import SidebarNav, { type NavGroup } from "@/components/admin/sidebar-nav";
import "../admin.css";

export const metadata: Metadata = { title: "KPD CMS", robots: { index: false } };
export const dynamic = "force-dynamic";

const icons = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  home: "M4 11l8-7 8 7M6 9.5V21h12V9.5",
  building: "M4 21V5l8-3v19M12 21h8V9l-8-3M7 9h1.5M7 13h1.5M7 17h1.5M15 12h1.5M15 16h1.5",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4",
  pages: "M4 7h12v14H4zM8 3h12v14",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  inbox: "M4 4h16v12h-5l-3 4-3-4H4zM8 9h8M8 12h5",
  image: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M8.5 9.5a1 1 0 1 1-.01 0",
  calculator: "M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h6",
  users: "M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 21c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 15.4c2.6.9 4.5 3 4.5 5.6",
  pulse: "M3 12h4l2.5-6 4 12 2.5-6H21",
  sliders: "M4 8h10M18 8h2M4 16h4M12 16h8M15 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8 13.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  user: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5",
  rss: "M5 19a1 1 0 1 0 0-.01M5 12a7 7 0 0 1 7 7M5 5a14 14 0 0 1 14 14",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.user.role === "ADMIN";

  async function logout() {
    "use server";
    const session = await getSession();
    if (session) await logActivity({ action: "auth.logout", session, summary: `${session.name} signed out` });
    await clearSessionCookie();
    redirect("/admin/login");
  }

  // Every editable content page is listed directly in the sidebar. The fixed
  // registry (src/lib/editable-pages.ts) is merged with any additional
  // StaticPage rows so nothing hides behind the All-pages overview.
  const registeredSlugs = new Set(editablePages.map((page) => page.key));
  let extraPages: { id: string; slug: string; title: string }[] = [];
  try {
    const rows = await db.staticPage.findMany({ select: { id: true, slug: true, title: true } });
    extraPages = rows.filter((row) => !registeredSlugs.has(row.slug));
  } catch {
    // If the database is unreachable the sidebar still lists the fixed pages.
  }
  const pageLinks: NavGroup["links"] = [
    ...editablePages.map((entry) => ({
      href: entry.href,
      label: entry.title,
      hint: entry.description,
      icon: entry.editor === "home" ? icons.home : entry.editor === "about" ? icons.user : icons.pages,
    })),
    ...extraPages.map((page) => ({
      href: `/admin/pages/${page.id}`,
      label: page.title,
      hint: `Additional page — /${page.slug}`,
      icon: icons.pages,
    })),
    { href: "/admin/pages", label: "All pages", hint: "Overview of every page: status and last update", icon: icons.list, exact: true },
  ];

  const groups: NavGroup[] = [
    {
      title: "Overview",
      links: [{ href: "/admin", label: "Dashboard", hint: "What needs your attention today", icon: icons.grid }],
    },
    {
      title: "Pages",
      links: pageLinks,
    },
    {
      title: "Content",
      links: [
        { href: "/admin/projects", label: "Developments", hint: "Project pages: copy, galleries, floor plans", icon: icons.building },
        { href: "/admin/articles", label: "News & Blog", hint: "Write and publish articles", icon: icons.doc },
        { href: "/admin/calculator", label: "Calculator", hint: "Fees, rates and payment plans for the public calculator", icon: icons.calculator },
      ],
    },
    {
      title: "Audience",
      links: [
        { href: "/admin/submissions", label: "Messages", hint: "Enquiries from the website forms", icon: icons.inbox },
        { href: "/admin/rss", label: "News inbox", hint: "Press mentions waiting for review", icon: icons.rss },
      ],
    },
    {
      title: "Library",
      links: [{ href: "/admin/media", label: "Media", hint: "Photos, videos and documents — upload and copy links", icon: icons.image }],
    },
    ...(isAdmin
      ? [{
          title: "Administration",
          links: [
            { href: "/admin/settings", label: "Site settings", hint: "Contact details shown site-wide", icon: icons.sliders },
            { href: "/admin/users", label: "Team", hint: "Accounts, roles and passwords", icon: icons.users },
            { href: "/admin/activity", label: "Activity log", hint: "Who changed what, and when", icon: icons.pulse },
          ] satisfies NavGroup["links"],
        }]
      : []),
  ];

  const initials = user.user.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="cms">
      <a className="cms-skip" href="#cms-content">Skip to content</a>
      <aside className="cms-sidebar">
        <div className="cms-sidebar__brand">
          <span className="cms-brand-mark" aria-hidden="true">KPD</span>
          <span className="cms-brand-name">KPD CMS<small>Kasumigaseki Properties</small></span>
        </div>
        <SidebarNav groups={groups} />
        <div className="cms-sidebar__foot">
          <div className="cms-usercard">
            <span className="cms-avatar" aria-hidden="true">{initials || "K"}</span>
            <span className="cms-usercard__meta">
              <strong>{user.user.name}</strong>
              <span className={`cms-role cms-role--${user.user.role}`}>{isAdmin ? "Administrator" : "Editor"}</span>
            </span>
          </div>
          <div className="cms-sidebar__foot-actions">
            <Link className="cms-sidebar__foot-link" href="/admin/profile">My profile</Link>
            <form action={logout}>
              <button type="submit" className="cms-signout">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <main id="cms-content" className="cms-main">{children}</main>
    </div>
  );
}

