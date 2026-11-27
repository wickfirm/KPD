// ── The seven x seven landing page's built-in wording in another language ────
// The landing page shows its CMS content and, where a field is empty, wording
// built into its components (src/components/public/sxs/*). A translation in
// the CMS comes first, as everywhere. What it leaves in English — a field the
// translation does not cover, or the built-in wording itself — reads in the
// page's language here, from the dictionary (sxs and sxsFallback in
// src/lib/i18n/en.ts), when it is one of those built-in strings.
//
// The match is by English, and only on strings the page shows as words: a
// label, a title, a name, an image description. Never on an anchor, a path, a
// number or a measurement, which stay as they are. An English page is given
// everything back as it came.

import { t, type MessageKey } from "@/lib/i18n";
import en from "@/lib/i18n/en";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import type { FloorPlanKey, SxsFloorPlan, SxsMilestone, SxsPlace } from "@/lib/sxs-content";

export type SxsMedia = { src: string; alt: string; label?: string; position?: string };
export type SxsNavigation = { id: string; label: string; progress: number };

/// The dictionary's built-in strings of the landing page by their English. The
/// fallbacks are read first, so that where both hold the same English the
/// fallback's key stands for it.
const builtIn: ReadonlyMap<string, MessageKey> = new Map(
  (["sxsFallback", "sxs"] as const).flatMap((area) =>
    (Object.keys(en[area]) as (keyof (typeof en)[typeof area])[]).map((name) => {
      const key = `${area}.${name}` as MessageKey;
      return [t(DEFAULT_LOCALE, key), key] as const;
    }),
  ),
);

/// A built-in string in the page's language; anything else is given back as it is.
export function sxsWord(locale: Locale, english: string): string {
  if (locale === DEFAULT_LOCALE) return english;
  const key = builtIn.get(english);
  return key ? t(locale, key) : english;
}

const same = <T>(locale: Locale, list: readonly T[], word: (item: T) => T): T[] => (locale === DEFAULT_LOCALE ? (list as T[]) : list.map(word));

/// Image descriptions and the label under an image.
export function sxsScenes(locale: Locale, scenes: readonly SxsMedia[]): SxsMedia[] {
  return same(locale, scenes, (scene) => ({ ...scene, alt: sxsWord(locale, scene.alt), ...(scene.label !== undefined ? { label: sxsWord(locale, scene.label) } : {}) }));
}

/// The section menu's labels; its anchors are never touched.
export function sxsNavigation(locale: Locale, items: readonly SxsNavigation[]): SxsNavigation[] {
  return same(locale, items, (item) => ({ ...item, label: sxsWord(locale, item.label) }));
}

/// A list of choices, one entry to a string.
export function sxsStrings(locale: Locale, list: readonly string[]): string[] {
  return same(locale, list, (item) => sxsWord(locale, item));
}

/// Each floor plan: its description, its title, its unit and the names in its legend.
export function sxsFloorPlans(locale: Locale, plans: Record<FloorPlanKey, SxsFloorPlan>): Record<FloorPlanKey, SxsFloorPlan> {
  if (locale === DEFAULT_LOCALE) return plans;
  const out = {} as Record<FloorPlanKey, SxsFloorPlan>;
  for (const key of Object.keys(plans) as FloorPlanKey[]) {
    const plan = plans[key];
    out[key] = {
      ...plan,
      alt: sxsWord(locale, plan.alt),
      title: sxsWord(locale, plan.title),
      unit: sxsWord(locale, plan.unit),
      legend: plan.legend.map(([number, name, size]) => [number, sxsWord(locale, name), size] as [string, string, string]),
    };
  }
  return out;
}

/// The payment milestones: their titles and the line under each. The list is
/// given back with its own element type, which is wider than SxsMilestone.
export function sxsMilestones<T extends Pick<SxsMilestone, "title" | "detail">>(locale: Locale, list: readonly T[]): T[] {
  return same(locale, list, (milestone) => ({ ...milestone, title: sxsWord(locale, milestone.title), detail: sxsWord(locale, milestone.detail) }));
}

/// A travel time as the page writes it ("9 min", "10-12 min").
const TRAVEL_TIME = /^(\d+(?:-\d+)?) min$/;

/// The travel time in the page's language, as the client's sheet words it for
/// the development pages ("{number} min" → "{number}分"); any other wording
/// stays as it is.
function travelTime(locale: Locale, minutes: string): string {
  const match = TRAVEL_TIME.exec(minutes);
  return match && locale !== DEFAULT_LOCALE ? t(locale, "dev.minutes", { number: match[1] }) : minutes;
}

/// The places on the map and in the list: their names and travel times; the
/// coordinates stay as they are.
export function sxsPlaces(locale: Locale, list: readonly SxsPlace[]): SxsPlace[] {
  return same(locale, list, (place) => ({ ...place, name: sxsWord(locale, place.name), minutes: travelTime(locale, place.minutes) }));
}
