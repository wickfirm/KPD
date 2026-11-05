import { describe, expect, it } from "vitest";
import { cmsDirectionalFigure, directionalFigure } from "./directional-figure";

const delivered = `<figure class="single-project-calm-media single-project-directional-media" data-directional-media>
  <img src="assets/images/single-project/pdf/seven-x-seven-pool-hero.jpg" alt="Seven X Seven pool" data-directional-image>
  <button type="button" aria-label="Previous image" data-directional-prev></button>
  <button type="button" aria-label="Next image" data-directional-next></button>
  <span hidden data-directional-slide data-image="assets/images/a.jpg" data-alt="First"></span>
  <span hidden data-directional-slide data-image="assets/images/b.jpg" data-alt="Second"></span>
</figure>`;

describe("directionalFigure", () => {
  it("keeps the delivered figure untouched when the editor never saved a list", () => {
    expect(directionalFigure(delivered, undefined, "alt")).toBe(delivered);
  });

  it("removes the figure entirely when the CMS list is explicitly emptied", () => {
    expect(directionalFigure(delivered, [], "alt")).toBe("");
  });

  it("drives the visible image and every hidden slide from the CMS list", () => {
    const result = directionalFigure(delivered, ["/uploads/one.jpg", "/uploads/two.jpg", "/uploads/three.jpg"], "Villa 24 — Composed");
    expect(result).toContain('<img src="/uploads/one.jpg"');
    expect(result).toContain('data-image="/uploads/two.jpg"');
    expect(result).toContain('data-image="/uploads/three.jpg"');
    expect(result).toContain('data-alt="Villa 24 — Composed"');
    expect(result).not.toContain("assets/images/a.jpg");
    expect(result).not.toContain("assets/images/b.jpg");
    expect(result).toContain('data-directional-prev');
    expect((result.match(/data-directional-slide/g) ?? []).length).toBe(3);
  });

  it("generates more slides than the delivered figure had", () => {
    const result = directionalFigure(delivered, ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg"], "alt");
    expect((result.match(/data-directional-slide/g) ?? []).length).toBe(4);
  });

  it("escapes quotes and angle brackets in CMS values", () => {
    const result = directionalFigure(delivered, ['/x.jpg" onerror="alert(1)'], "alt");
    expect(result).not.toContain('onerror="alert(1)"');
    expect(result).toContain("/x.jpg&quot; onerror=&quot;alert(1)");
  });
});

describe("cmsDirectionalFigure", () => {
  it("builds a full delivered-shaped slider from CMS images", () => {
    const figure = cmsDirectionalFigure(["/a.jpg", "/b.jpg"], "Alt text");
    expect(figure).toContain('class="single-project-calm-media single-project-directional-media" data-directional-media');
    expect(figure).toContain('<img src="/a.jpg" alt="Alt text" data-directional-image>');
    expect(figure).toContain("data-directional-prev");
    expect((figure.match(/data-directional-slide/g) ?? []).length).toBe(2);
  });

  it("renders nothing without images", () => {
    expect(cmsDirectionalFigure([], "alt")).toBe("");
  });
});
