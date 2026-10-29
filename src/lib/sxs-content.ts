import { db } from "@/lib/db";
import { sxsDefaults } from "@/lib/sxs-defaults";
import mediaMap from "@/lib/sxs-r2-map.json";

const sectionKeys = ["navigation", "hero", "about", "manifesto", "apartments", "gallery", "exterior", "amenities", "community", "location", "floorplans", "payment", "register", "footer", "privacy", "cta", "brand", "seo"] as const;

export type SxsSectionKey = (typeof sectionKeys)[number];
export type SxsContent = Record<SxsSectionKey, Record<string, unknown>>;
export const sxsSettingKey = "sxs";
export const sxsPreviewKey = "preview:sxs";

const migratedMedia = mediaMap as Record<string, string>;

/// The residence page renders its designed copy when a section has no CMS value.
export function emptySxsContent(): SxsContent {
  return Object.fromEntries(sectionKeys.map((key) => [key, {}])) as SxsContent;
}

export function applySxsMediaMap<T>(value: T): T {
  if (typeof value === "string") return (migratedMedia[value] || value) as T;
  if (Array.isArray(value)) return value.map((item) => applySxsMediaMap(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, applySxsMediaMap(item)])) as T;
  }
  return value;
}

function sectionRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/// Saved fields replace the designed copy. A blank string or empty list is kept
/// so the page can fall back to the designed value for that one field.
export function mergeSxsContent(saved: unknown): SxsContent {
  const source = sectionRecord(saved);
  const merged = Object.fromEntries(sectionKeys.map((key) => [key, { ...sxsDefaults[key], ...sectionRecord(source[key]) }])) as SxsContent;
  return applySxsMediaMap(merged);
}

export async function loadSxsContent(): Promise<SxsContent> {
  const designed = applySxsMediaMap(sxsDefaults);
  try {
    const row = await db.siteSetting.findUnique({ where: { key: sxsSettingKey } });
    if (!row) {
      await db.siteSetting.create({ data: { key: sxsSettingKey, value: designed as never } }).catch(() => null);
      return designed;
    }
    return mergeSxsContent(row.value);
  } catch {
    return designed;
  }
}

export type SxsFloorPlan = {
  image: string;
  alt: string;
  title: string;
  unit: string;
  totalSqft: string;
  totalSqm: string;
  suiteSqft: string;
  suiteSqm: string;
  balconySqft: string;
  balconySqm: string;
  legend: readonly (readonly [string, string, string])[];
};

function textOf(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function legendOf(value: unknown, fallback: readonly (readonly [string, string, string])[]) {
  if (!Array.isArray(value) || !value.length) return fallback;
  const rows = value.flatMap((row) => {
    if (Array.isArray(row) && row.length >= 3) return [[String(row[0]), String(row[1]), String(row[2])] as [string, string, string]];
    if (row && typeof row === "object") {
      const record = row as Record<string, unknown>;
      return [[textOf(record.number, ""), textOf(record.name, ""), textOf(record.size, "")] as [string, string, string]];
    }
    return [];
  }).filter((row) => row[0] || row[1]);
  return rows.length ? rows : fallback;
}

export function readFloorPlans(value: unknown, fallback: Record<"one" | "two" | "three", SxsFloorPlan>) {
  const source = sectionRecord(value);
  const one = (key: "one" | "two" | "three"): SxsFloorPlan => {
    const row = sectionRecord(source[key]);
    return {
      image: textOf(row.image, fallback[key].image),
      alt: textOf(row.alt, fallback[key].alt),
      title: textOf(row.title, fallback[key].title),
      unit: textOf(row.unit, fallback[key].unit),
      totalSqft: textOf(row.totalSqft, fallback[key].totalSqft),
      totalSqm: textOf(row.totalSqm, fallback[key].totalSqm),
      suiteSqft: textOf(row.suiteSqft, fallback[key].suiteSqft),
      suiteSqm: textOf(row.suiteSqm, fallback[key].suiteSqm),
      balconySqft: textOf(row.balconySqft, fallback[key].balconySqft),
      balconySqm: textOf(row.balconySqm, fallback[key].balconySqm),
      legend: legendOf(row.legend, fallback[key].legend),
    };
  };
  return { one: one("one"), two: one("two"), three: one("three") };
}

export type SxsMilestone = { percent: number; title: string; detail: string; phase: "calendar" | "construction" | "handover" };

export function readMilestones(value: unknown, fallback: readonly SxsMilestone[]) {
  if (!Array.isArray(value) || !value.length) return fallback;
  const rows = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const percent = Number(record.percent);
    if (!Number.isFinite(percent)) return [];
    const phase = record.phase === "construction" || record.phase === "handover" ? record.phase : "calendar";
    return [{ percent, title: textOf(record.title, ""), detail: textOf(record.detail, ""), phase }];
  });
  return rows.length ? rows : fallback;
}

export type SxsPlace = { name: string; minutes: string; lat: number; lng: number; reveal: number };

export function readPlaces(value: unknown, fallback: readonly SxsPlace[]) {
  if (!Array.isArray(value) || !value.length) return fallback;
  const rows = value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const lat = Number(record.lat);
    const lng = Number(record.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !textOf(record.name, "")) return [];
    const reveal = Number(record.reveal);
    return [{ name: String(record.name), minutes: textOf(record.minutes, ""), lat, lng, reveal: Number.isFinite(reveal) ? reveal : Math.min(0.08 + index * 0.08, 0.92) }];
  });
  return rows.length ? rows : fallback;
}
