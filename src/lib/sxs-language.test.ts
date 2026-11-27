import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { FloorPlanKey, SxsFloorPlan, SxsPlace } from "@/lib/sxs-content";
import { sxsFloorPlans, sxsMilestones, sxsNavigation, sxsPlaces, sxsScenes, sxsStrings, sxsWord } from "@/lib/sxs-language";

// The landing page shows its CMS content and, where a field is empty, wording
// built into its components. On another language's page a built-in string
// that is still in English reads in the page's language; an English page is
// given everything back as it came.

const scenes = [{ src: "/a.png", alt: "seven x seven residents lounge", label: "Residents lounge", position: "62% 50%" }];
const plan = (alt: string, title: string, unit: string): SxsFloorPlan => ({
  image: "/plan.png", alt, title, unit,
  totalSqft: "858 sqft", totalSqm: "79.79 sqm", suiteSqft: "709 sqft", suiteSqm: "65.84 sqm", balconySqft: "150 sqft", balconySqm: "13.95 sqm",
  legend: [["01", "guest toilet", "1.95m x 4.66m"], ["02", "kitchen", "open plan"]],
});
const plans: Record<FloorPlanKey, SxsFloorPlan> = {
  one: plan("Rendered one bedroom residence floor plan", "one-bedroom residences", "1 bhk apartment"),
  two: plan("Rendered two bedroom residence floor plan", "two-bedroom residences", "2 bhk apartment"),
  three: plan("Rendered three bedroom residence floor plan", "three-bedroom residences", "3 bhk apartment"),
  penthouse: plan("Rendered penthouse floor plan", "penthouse", "4 bhk penthouse"),
};

describe("a built-in string of the landing page", () => {
  it("is given back as it came on an English page", () => {
    expect(sxsWord("en", "home")).toBe("home");
    expect(sxsScenes("en", scenes)).toBe(scenes);
    expect(sxsFloorPlans("en", plans)).toBe(plans);
  });

  it("reads in the page's language: the client's own words where their sheet has them", () => {
    expect(sxsWord("ar", "home")).toBe("الرئيسية");
    expect(sxsWord("ja", "floor plans")).toBe("間取り");
    expect(sxsWord("ar", "Residents lounge")).toBe("صالة السكان");
  });

  it("is left alone when it is not one of them, as an editor's own words are", () => {
    expect(sxsWord("ar", "A heading the editor wrote")).toBe("A heading the editor wrote");
    // Nor is an anchor, a path or a measurement mistaken for a word.
    expect(sxsWord("ar", "floor-plans")).toBe("floor-plans");
    expect(sxsWord("ar", "858 sqft")).toBe("858 sqft");
    expect(sxsWord("ar", "9 min")).toBe("9 min");
  });
});

describe("the landing page's lists in another language", () => {
  it("images: the description and the label, never the file or its position", () => {
    expect(sxsScenes("ar", scenes)).toEqual([{ src: "/a.png", alt: "صالة السكان في seven x seven", label: "صالة السكان", position: "62% 50%" }]);
  });

  it("the section menu: the labels, never the anchors", () => {
    expect(sxsNavigation("ar", [{ id: "floor-plans", label: "floor plans", progress: 24.3 }, { id: "own", label: "An editor's section", progress: 25 }])).toEqual([
      { id: "floor-plans", label: "المخططات", progress: 24.3 },
      { id: "own", label: "An editor's section", progress: 25 },
    ]);
  });

  it("a list of choices", () => {
    expect(sxsStrings("ja", ["Book a private viewing", "An editor's choice"])).toEqual(["プライベート内覧を予約", "An editor's choice"]);
  });

  it("floor plans: the description, the title, the unit and the legend's names; not its number, size or areas", () => {
    const first = sxsFloorPlans("ar", plans).one;
    expect(first).toMatchObject({ image: "/plan.png", alt: "مخطط مرسوم لمسكن بغرفة نوم واحدة", title: "مساكن بغرفة نوم واحدة", unit: "شقة بغرفة نوم واحدة", totalSqft: "858 sqft", suiteSqm: "65.84 sqm" });
    expect(first.legend).toEqual([["01", "دورة مياه الضيوف", "1.95m x 4.66m"], ["02", "المطبخ", "open plan"]]);
    // The penthouse has no row in the client's sheet: translated here.
    expect(sxsFloorPlans("ja", plans).penthouse).toMatchObject({ title: "ペントハウス", unit: "4ベッドルーム・ペントハウス" });
  });

  it("payment milestones: the title and the line under it; the percentages are kept", () => {
    expect(sxsMilestones("ar", [{ percent: 10, title: "60 days", detail: "After the reservation date", phase: "calendar" }])).toEqual([{ percent: 10, title: "60 يومًا", detail: "بعد تاريخ الحجز", phase: "calendar" }]);
  });

  it("places: the names and the travel times in the client's wording; the coordinates are kept, and any other wording for a time", () => {
    const places: SxsPlace[] = [
      { name: "Dubai Marina", minutes: "22 min", lat: 25.0805, lng: 55.1403, reveal: 0.7 },
      { name: "City Walk", minutes: "10-12 min", lat: 0, lng: 0, reveal: 0.6 },
      { name: "An editor's place", minutes: "about a quarter of an hour", lat: 0, lng: 0, reveal: 0.5 },
    ];
    expect(sxsPlaces("en", places)).toBe(places);
    expect(sxsPlaces("ar", places)).toEqual([
      { name: "دبي مارينا", minutes: "22 د", lat: 25.0805, lng: 55.1403, reveal: 0.7 },
      { name: "سيتي ووك", minutes: "10-12 د", lat: 0, lng: 0, reveal: 0.6 },
      { name: "An editor's place", minutes: "about a quarter of an hour", lat: 0, lng: 0, reveal: 0.5 },
    ]);
    expect(sxsPlaces("ja", places)[0].minutes).toBe("22分");
  });
});

describe("the landing page's components", () => {
  const source = (name: string) => readFileSync(join(process.cwd(), "src/components/public/sxs", name), "utf8");

  // A word written in a component is English for every visitor: it goes in the
  // dictionary (en.ts, sxs) and is read with t(). Only the brand is written
  // here, in every language as it is.
  it.each(["SevenXSevenFresh.tsx", "MobilePublicSite.tsx"])("%s holds no wording of its own but the brand", (name) => {
    const text = source(name);
    for (const match of text.matchAll(/\b(?:aria-label|placeholder|alt)="([^"]*)"/g)) {
      // A number is not wording: the phone field's example stays as it is.
      if (/^\+?[\d\s-]+$/.test(match[1])) continue;
      expect(match[1], `${name}: ${match[0]}`).toMatch(/^(|seven x seven(?: residences)?)$/);
    }
    for (const match of text.matchAll(/>([^<>{}]+)<\//g)) {
      const wording = match[1].trim();
      if (!/[A-Za-z]{2,}/.test(wording)) continue;
      expect(wording, `${name}: ${wording}`).toMatch(/^seven x seven(?: residences)?$/);
    }
  });
});
