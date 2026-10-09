import { describe, expect, it } from "vitest";
import { moduleKindLabels, nextCopySlug, reorderIds, starterModules } from "./project-starter";

describe("project starter", () => {
  it("offers the standard sections in order with unique slugs", () => {
    expect(starterModules.map((module) => module.slug)).toEqual(["overview", "location", "tour", "amenities", "floor-plans", "payment-plan"]);
    expect(new Set(starterModules.map((module) => module.slug)).size).toBe(starterModules.length);
    expect([...starterModules].sort((a, b) => a.sortOrder - b.sortOrder)).toEqual(starterModules);
  });
  it("has a friendly label for every section type used", () => {
    for (const module of starterModules) expect(moduleKindLabels[module.kind]).toBeTruthy();
  });
});

describe("nextCopySlug", () => {
  it("finds the first free copy slug", () => {
    expect(nextCopySlug("emerald-villa", ["emerald-villa"])).toBe("emerald-villa-copy");
    expect(nextCopySlug("emerald-villa", ["emerald-villa", "emerald-villa-copy"])).toBe("emerald-villa-copy-2");
    expect(nextCopySlug("emerald-villa", ["emerald-villa-copy", "emerald-villa-copy-2"])).toBe("emerald-villa-copy-3");
  });
});

describe("reorderIds", () => {
  const ids = ["a", "b", "c"];
  it("moves an item up or down by one", () => {
    expect(reorderIds(ids, "b", -1)).toEqual(["b", "a", "c"]);
    expect(reorderIds(ids, "b", 1)).toEqual(["a", "c", "b"]);
  });
  it("leaves the list alone at the ends or for unknown ids", () => {
    expect(reorderIds(ids, "a", -1)).toEqual(ids);
    expect(reorderIds(ids, "c", 1)).toEqual(ids);
    expect(reorderIds(ids, "zzz", 1)).toEqual(ids);
  });
});
