// ── Roles and permissions ─────────────────────────────────────────────────────
//
// One place defines who may do what. Pure and dependency-free, so the edge
// middleware, server actions, pages and the sidebar all use the same rules.
//
//   ADMIN        everything, including settings, the team, the activity log and
//                permanent deletion.
//   EDITOR       writes and publishes content, edits the live pages, manages
//                media uploads, messages and the news inbox. Cannot delete
//                content permanently, change settings or manage the team.
//   CONTRIBUTOR  writes drafts of articles and developments only. Cannot
//                publish, unpublish, archive or delete, cannot change anything
//                that is already live, and cannot see enquiries.
//   VIEWER       read-only: can look at content, messages and the news inbox
//                but cannot change anything.

export const roles = ["ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"] as const;
export type Role = (typeof roles)[number];

export type Permission =
  | "content.write" //      create and edit drafts of articles and developments
  | "content.editLive" //   change anything already live; edit the pages that go live on save; restore versions
  | "content.publish" //    publish, unpublish, archive, restore, reorder the site
  | "content.delete" //     permanently delete developments, articles and pages
  | "media.upload"
  | "media.delete"
  | "messages.manage" //    retry syncing enquiries to Salesforce
  | "rss.review" //         approve or reject items in the news inbox
  | "settings.manage"
  | "team.manage"
  | "activity.read";

const grants: Record<Permission, readonly Role[]> = {
  "content.write": ["ADMIN", "EDITOR", "CONTRIBUTOR"],
  "content.editLive": ["ADMIN", "EDITOR"],
  "content.publish": ["ADMIN", "EDITOR"],
  "content.delete": ["ADMIN"],
  "media.upload": ["ADMIN", "EDITOR", "CONTRIBUTOR"],
  "media.delete": ["ADMIN"],
  "messages.manage": ["ADMIN", "EDITOR"],
  "rss.review": ["ADMIN", "EDITOR"],
  "settings.manage": ["ADMIN"],
  "team.manage": ["ADMIN"],
  "activity.read": ["ADMIN"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (roles as readonly string[]).includes(value);
}

/// Anything unrecognised is treated as the least-privileged role.
export function normaliseRole(value: unknown): Role {
  return isRole(value) ? value : "VIEWER";
}

export function can(role: unknown, permission: Permission): boolean {
  return grants[permission].includes(normaliseRole(role));
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrator",
  EDITOR: "Editor",
  CONTRIBUTOR: "Contributor",
  VIEWER: "Viewer",
};

export const roleSummaries: Record<Role, string> = {
  ADMIN: "Full control: content, publishing, deleting, media, settings, the team and the activity log.",
  EDITOR: "Writes and publishes content and edits the live pages. Cannot delete content permanently, change settings or manage the team.",
  CONTRIBUTOR: "Writes drafts of articles and developments. Cannot publish, delete, change anything already live, or see enquiries.",
  VIEWER: "Read-only. Can look at everything except settings, the team and the activity log, but cannot change anything.",
};

export const roleLabel = (role: unknown) => roleLabels[normaliseRole(role)];

// ── Content rules ─────────────────────────────────────────────────────────────

/// May this role save changes to an item that currently has this status?
/// Editors and Admins always may. Contributors only while it is still a draft
/// (or does not exist yet), so they can never change what visitors see.
export function mayEditContent(role: unknown, currentStatus?: string | null): boolean {
  if (can(role, "content.editLive")) return true;
  if (!can(role, "content.write")) return false;
  return !currentStatus || currentStatus === "DRAFT";
}

/// The status a save is allowed to store. Only roles that can publish may pick
/// anything other than Draft.
export function allowedStatus<T extends string>(role: unknown, requested: T): T | "DRAFT" {
  return can(role, "content.publish") ? requested : "DRAFT";
}

// ── Which screens a role may open ─────────────────────────────────────────────

const adminOnlyPaths = ["/admin/users", "/admin/settings", "/admin/activity"];
/// Contributors write articles and developments; these areas hold live pages,
/// visitors' personal details or publishing controls.
const noContributorPaths = ["/admin/pages", "/admin/about", "/admin/calculator", "/admin/submissions", "/admin/rss", "/admin/seven-x-seven"];

const under = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

export function canViewPath(role: unknown, pathname: string): boolean {
  const current = normaliseRole(role);
  if (adminOnlyPaths.some((path) => under(pathname, path))) return current === "ADMIN";
  if (current === "CONTRIBUTOR" && noContributorPaths.some((path) => under(pathname, path))) return false;
  return true;
}
