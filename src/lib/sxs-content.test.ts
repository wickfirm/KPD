import { describe, expect, it } from "vitest";
import { sxsDefaults } from "./sxs-defaults";
import { applySxsMediaMap, mergeSxsContent, readFloorPlans, type SxsFloorPlan } from "./sxs-content";
import mediaMap from "./sxs-r2-map.json";

const plans = sxsDefaults.floorplans.plans as Record<"one" | "two" | "three", SxsFloorPlan>;

describe("seven x seven content", () => {
  it("keeps the designed copy when a saved field is blank", () => {
    const merged = mergeSxsContent({ hero: { headline: "  ", body: "A private address." } });
    expect(merged.hero.body).toBe("A private address.");
    expect(merged.hero.headline).toBe("  ");
    expect(merged.about.headline).toBe(sxsDefaults.about.headline);
  });

  it("keeps the three-bedroom legend to the rooms already confirmed", () => {
    const floorPlans = readFloorPlans(plans, plans);
    expect(floorPlans.three.legend.map((row) => row[1])).toEqual(["powder room", "kitchen", "living & dining area", "laundry", "store room"]);
    expect(floorPlans.three.legend.some((row) => row[1] === "bedroom 2")).toBe(false);
  });

  it("points every designed asset at R2", () => {
    const paths = new Set<string>();
    const walk = (value: unknown) => {
      if (typeof value === "string" && value.startsWith("/assets/")) paths.add(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(sxsDefaults);
    const map = mediaMap as Record<string, string>;
    for (const path of paths) expect(map[path], path).toMatch(/^https:\/\//);
    const migrated = applySxsMediaMap(sxsDefaults);
    expect(migrated.hero.media).toMatch(/^https:\/\//);
  });
});
