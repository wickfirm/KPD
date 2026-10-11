import { describe, expect, it } from "vitest";
import { allowedStatus, can, canViewPath, mayEditContent, normaliseRole, roles, type Permission } from "./permissions";

const everyPermission: Permission[] = [
  "content.write", "content.editLive", "content.publish", "content.delete", "media.upload", "media.delete",
  "messages.manage", "rss.review", "settings.manage", "team.manage", "activity.read",
];

const allowed = (role: string) => everyPermission.filter((permission) => can(role, permission));

describe("permission matrix", () => {
  it("lets an Admin do everything", () => {
    expect(allowed("ADMIN")).toEqual(everyPermission);
  });

  it("lets an Editor work and publish but not delete, configure or manage the team", () => {
    expect(allowed("EDITOR")).toEqual(["content.write", "content.editLive", "content.publish", "media.upload", "messages.manage", "rss.review"]);
    expect(can("EDITOR", "content.delete")).toBe(false);
    expect(can("EDITOR", "media.delete")).toBe(false);
    expect(can("EDITOR", "team.manage")).toBe(false);
  });

  it("lets a Contributor write drafts and upload media only", () => {
    expect(allowed("CONTRIBUTOR")).toEqual(["content.write", "media.upload"]);
  });

  it("gives a Viewer no write permission at all", () => {
    expect(allowed("VIEWER")).toEqual([]);
  });

  it("treats an unknown or missing role as the least privileged", () => {
    expect(normaliseRole("SUPERUSER")).toBe("VIEWER");
    expect(normaliseRole(undefined)).toBe("VIEWER");
    expect(everyPermission.some((permission) => can("SUPERUSER", permission))).toBe(false);
  });

  it("covers exactly the four roles", () => {
    expect([...roles]).toEqual(["ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"]);
  });
});

describe("mayEditContent", () => {
  it("lets Editors and Admins edit anything", () => {
    for (const status of ["DRAFT", "PUBLISHED", "ARCHIVED"]) {
      expect(mayEditContent("EDITOR", status)).toBe(true);
      expect(mayEditContent("ADMIN", status)).toBe(true);
    }
  });
  it("lets a Contributor edit only drafts and brand-new items", () => {
    expect(mayEditContent("CONTRIBUTOR", "DRAFT")).toBe(true);
    expect(mayEditContent("CONTRIBUTOR", undefined)).toBe(true);
    expect(mayEditContent("CONTRIBUTOR", null)).toBe(true);
    expect(mayEditContent("CONTRIBUTOR", "PUBLISHED")).toBe(false);
    expect(mayEditContent("CONTRIBUTOR", "ARCHIVED")).toBe(false);
  });
  it("never lets a Viewer edit", () => {
    expect(mayEditContent("VIEWER", "DRAFT")).toBe(false);
    expect(mayEditContent("VIEWER", undefined)).toBe(false);
  });
});

describe("allowedStatus", () => {
  it("keeps the requested status for roles that can publish", () => {
    expect(allowedStatus("EDITOR", "PUBLISHED")).toBe("PUBLISHED");
    expect(allowedStatus("ADMIN", "ARCHIVED")).toBe("ARCHIVED");
  });
  it("forces Draft for everyone else", () => {
    expect(allowedStatus("CONTRIBUTOR", "PUBLISHED")).toBe("DRAFT");
    expect(allowedStatus("VIEWER", "PUBLISHED")).toBe("DRAFT");
  });
});

describe("canViewPath", () => {
  it("keeps settings, team and activity for Admins", () => {
    for (const path of ["/admin/users", "/admin/settings", "/admin/activity", "/admin/users/x"]) {
      expect(canViewPath("ADMIN", path)).toBe(true);
      for (const role of ["EDITOR", "CONTRIBUTOR", "VIEWER"]) expect(canViewPath(role, path)).toBe(false);
    }
  });
  it("keeps live pages, the calculator and enquiries away from Contributors", () => {
    for (const path of ["/admin/pages", "/admin/pages/home", "/admin/calculator", "/admin/submissions", "/admin/rss"]) {
      expect(canViewPath("CONTRIBUTOR", path)).toBe(false);
      expect(canViewPath("EDITOR", path)).toBe(true);
      expect(canViewPath("VIEWER", path)).toBe(true);
    }
  });
  it("lets everyone into the shared areas", () => {
    for (const role of roles) {
      for (const path of ["/admin", "/admin/projects", "/admin/articles", "/admin/media", "/admin/guide", "/admin/profile"]) {
        expect(canViewPath(role, path)).toBe(true);
      }
    }
  });
  it("does not confuse similarly named paths", () => {
    expect(canViewPath("CONTRIBUTOR", "/admin/pagesx")).toBe(true);
    expect(canViewPath("EDITOR", "/admin/users-guide")).toBe(true);
  });
});
