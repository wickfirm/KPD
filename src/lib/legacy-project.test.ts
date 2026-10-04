import { describe, expect, it } from "vitest";
import { getProjectShell } from "@/lib/legacy-project";

const slugs = ["seven-x-seven", "emerald-villa", "dubai-hills-mansion"] as const;

describe("getProjectShell", () => {
  it.each(slugs)("extracts a complete shell for %s", (slug) => {
    const shell = getProjectShell(slug);
    expect(shell).not.toBeNull();
    if (!shell) return;
    expect(shell.beforeMain).toContain("site-header");
    expect(shell.afterMain).toContain("section_footer");
    expect(shell.heroVideo).toMatch(/^\/legacy\/assets\//);
    expect(shell.heroPoster).toMatch(/^\/legacy\/assets\//);
    expect(shell.overviewHeading.length).toBeGreaterThan(0);
    expect(shell.overviewText.length).toBeGreaterThan(0);
    expect(shell.overviewFigure).toContain("single-project-directional-media");
    expect(shell.meydanFigure).toContain("single-project-meydan-media");
    expect(shell.calmFigure).toContain("single-project-calm-media");
    expect(shell.locationShell).toContain("villa23-travel-shell");
    // the location slice must stop before the React section's own closing tag
    expect(shell.locationShell).not.toContain("</section>");
  });

  it("rewrites delivered asset paths and routes legacy links", () => {
    const shell = getProjectShell("seven-x-seven");
    if (!shell) throw new Error("shell missing");
    const all = shell.beforeMain + shell.afterMain + shell.locationShell;
    expect(all).not.toContain('src="assets/');
    expect(all).not.toContain('href="contact.html"');
    expect(shell.afterMain).toContain('href="/contact"');
  });

  it("strips the delivered script tags from the shell", () => {
    const shell = getProjectShell("emerald-villa");
    if (!shell) throw new Error("shell missing");
    expect(shell.afterMain).not.toContain("site.js");
    expect(shell.afterMain).not.toContain("ownership-cost-planner.js");
  });

  it("returns null for an unknown template slug", () => {
    expect(getProjectShell("unknown-project")).toBeNull();
  });
});
