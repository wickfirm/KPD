import { db } from "@/lib/db";

// ── Developments created in the CMS, shown in the site navigation ─────────────
//
// The header dropdown, the mobile menu and the footer list the three delivered
// developments in fixed markup. Any further PUBLISHED development (created in
// /admin) is appended after them, so a new project is reachable from every
// page without a code change. The delivered three are never touched.

export const coreDevelopmentSlugs = ["seven-x-seven", "emerald-villa", "dubai-hills-mansion"];

/// Keep the dropdown's preview rules (public.css) and the menu a sensible size.
export const maxNavExtras = 6;

export type NavDevelopment = { slug: string; name: string; heroImage: string | null };

/// Published, public (FULL profile) developments beyond the delivered three.
/// Never throws: a database failure just means no extras are shown.
export async function getNavDevelopments(): Promise<NavDevelopment[]> {
  try {
    const rows = await db.project.findMany({
      where: { status: "PUBLISHED", profile: "FULL", slug: { notIn: coreDevelopmentSlugs } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: maxNavExtras,
      select: { slug: true, name: true, heroImage: true },
    });
    return rows;
  } catch {
    return [];
  }
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/// Insert the extra developments into delivered (raw) page chrome: after the
/// Dubai Hills Mansion entry in the header dropdown, its preview image, the
/// mobile menu and the footer column. Each insertion is skipped if its anchor
/// is not found, so a changed delivered file can never break the page.
export function injectNavDevelopments(html: string, extras: NavDevelopment[]) {
  if (!extras.length) return html;
  const link = (project: NavDevelopment) => `/developments/${project.slug}`;
  const header = extras.map((project, index) => `<a class="mega-project-link mega-project-extra mega-project-extra-${index + 1}" href="${link(project)}" role="menuitem">${escapeHtml(project.name)}</a>`).join("\n              ");
  const preview = extras.filter((project) => project.heroImage).map((project) => `<img class="mega-preview-image mega-preview-extra-${extras.indexOf(project) + 1}" src="${escapeHtml(project.heroImage as string)}" alt="">`).join("\n            ");
  const mobile = extras.map((project) => `<li><a href="${link(project)}">${escapeHtml(project.name)}</a></li>`).join("\n          ");
  const footer = extras.map((project) => `<li class="footer_links_item"><a href="${link(project)}" class="footer_link text-size-footer">${escapeHtml(project.name)}</a></li>`).join("\n            ");
  return html
    .replace(/(<a class="mega-project-link mega-project-hills"[^>]*>[^<]*<\/a>)/, `$1\n              ${header}`)
    .replace(/(<img class="mega-preview-image mega-preview-hills"[^>]*>)/, preview ? `$1\n            ${preview}` : "$1")
    .replace(/(<li><a href="\/developments\/dubai-hills-mansion">[^<]*<\/a><\/li>)/, `$1\n          ${mobile}`)
    .replace(/(<li class="footer_links_item"><a href="\/developments\/dubai-hills-mansion"[^>]*>[^<]*<\/a><\/li>)/, `$1\n            ${footer}`);
}
