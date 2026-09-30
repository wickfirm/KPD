"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string; hint: string; icon: string };
export type NavGroup = { title: string; links: NavLink[] };

/// Left-hand navigation with plain-language labels and hints. Highlights the
/// active section so editors always know where they are.
export default function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav className="cms-sidenav" aria-label="CMS sections">
      {groups.map((group) => (
        <div className="cms-sidenav__group" key={group.title}>
          <span className="cms-sidenav__title">{group.title}</span>
          {group.links.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={`cms-sidenav__link${active ? " is-active" : ""}`} title={link.hint} aria-current={active ? "page" : undefined}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
