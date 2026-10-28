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

  it("removes every fixed development when none are published", () => {
    const out = injectNavDevelopments(raw, []);
    for (const slug of ["seven-x-seven", "emerald-villa", "dubai-hills-mansion"]) expect(out).not.toContain(`/developments/${slug}`);
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

  it("uses the supplied published list in place of the delivered three", () => {
    const published: NavDevelopment[] = [{ slug: "seven-x-seven", name: "Seven X Seven", heroImage: null }, ...extras];
    const out = injectNavDevelopments(raw, published);
    expect(out).toContain('/developments/seven-x-seven');
    expect(out).not.toContain('/developments/emerald-villa');
    expect(out).not.toContain('/developments/dubai-hills-mansion');
  });
});
