import { describe, expect, it } from "vitest";
import { getNewsPageShell } from "./news-shell";
import { injectNavDevelopments, type NavDevelopment } from "./nav-developments";

const extras: NavDevelopment[] = [
  { slug: "marina-tower", name: "Marina <Tower> & Co", heroImage: "https://cdn.example.com/hero.jpg" },
  { slug: "palm-house", name: "Palm House", heroImage: null },
];

describe("injectNavDevelopments", () => {
  const shell = getNewsPageShell();
  const raw = shell.beforeMain + shell.afterMain;

  it("changes nothing when there are no extra developments", () => {
    expect(injectNavDevelopments(raw, [])).toBe(raw);
  });

  it("adds each extra to the header dropdown, mobile menu and footer", () => {
    const out = injectNavDevelopments(raw, extras);
    expect(out).toContain('class="mega-project-link mega-project-extra mega-project-extra-1" href="/developments/marina-tower"');
    expect(out).toContain('mega-project-extra-2" href="/developments/palm-house"');
    expect(out).toContain('<li><a href="/developments/palm-house">Palm House</a></li>');
    expect(out).toContain('<a href="/developments/palm-house" class="footer_link text-size-footer">Palm House</a>');
  });

  it("only adds a preview image for extras that have a hero image, keeping numbering", () => {
    const out = injectNavDevelopments(raw, extras);
    expect(out).toContain('mega-preview-extra-1" src="https://cdn.example.com/hero.jpg"');
    expect(out).not.toContain("mega-preview-extra-2");
  });

  it("escapes project names", () => {
    const out = injectNavDevelopments(raw, extras);
    expect(out).toContain("Marina &lt;Tower&gt; &amp; Co");
    expect(out).not.toContain("<Tower>");
  });

  it("leaves the delivered three developments untouched", () => {
    const out = injectNavDevelopments(raw, extras);
    for (const slug of ["seven-x-seven", "emerald-villa", "dubai-hills-mansion"]) {
      expect(out.split(`/developments/${slug}`).length).toBe(raw.split(`/developments/${slug}`).length);
    }
  });
});
