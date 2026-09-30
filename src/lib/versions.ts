import { db } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Rolling content versions. Every content save stores a snapshot of the
// editor's form payload; at most MAX_CONTENT_VERSIONS (5) are kept per entity —
// the 6th save evicts the oldest (FIFO), per the client work order. Restore
// replays the stored payload through the regular save path, so validation,
// revalidation and activity logging all behave exactly like a manual save.
// Versioning is best-effort: a failure must never block the save itself.
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_CONTENT_VERSIONS = 5;

export const contentVersionEntities = [
  "ARTICLE",
  "STATIC_PAGE",
  "PROJECT",
  "PROJECT_MODULE",
  "HOME_SETTINGS",
  "GLOBAL_SETTINGS",
  "CALCULATOR",
] as const;

export type ContentVersionEntity = (typeof contentVersionEntities)[number];

/// Record<string, string[]> — every FormData entry, stringified. This shape
/// round-trips through Prisma's JSON column and rebuilds into a FormData
/// losslessly (including repeated keys like managementName).
export type VersionSnapshot = Record<string, string[]>;

export function snapshotFormData(formData: FormData): VersionSnapshot {
  const keys = new Set<string>();
  formData.forEach((_, key) => keys.add(key));
  const snapshot: VersionSnapshot = {};
  for (const key of keys) {
    if (key === "id") continue; // restore always targets the current record
    const values = formData.getAll(key).map((value) => String(value));
    if (values.some((value) => value.length)) snapshot[key] = values;
  }
  return snapshot;
}

export function snapshotToFormData(snapshot: unknown): FormData {
  const formData = new FormData();
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return formData;
  for (const [key, values] of Object.entries(snapshot as VersionSnapshot)) {
    if (!Array.isArray(values)) continue;
    for (const value of values) formData.append(key, String(value));
  }
  return formData;
}

export async function recordVersion(input: {
  entityType: ContentVersionEntity;
  entityId: string;
  path: string;
  label: string;
  snapshot: VersionSnapshot;
  authorEmail?: string | null;
}): Promise<void> {
  if (!input.entityId) return;
  try {
    // Retry once on the (rare) version-number race between concurrent saves.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const last = await db.contentVersion.findFirst({
          where: { entityType: input.entityType, entityId: input.entityId },
          orderBy: { versionNumber: "desc" },
          select: { versionNumber: true },
        });
        const versionNumber = (last?.versionNumber ?? 0) + 1;
        await db.contentVersion.create({
          data: {
            entityType: input.entityType,
            entityId: input.entityId,
            path: input.path,
            label: input.label.slice(0, 160),
            versionNumber,
            snapshot: input.snapshot as never,
            authorEmail: input.authorEmail ?? null,
          },
        });
        // FIFO eviction: keep only the newest MAX_CONTENT_VERSIONS rows.
        const stale = await db.contentVersion.findMany({
          where: { entityType: input.entityType, entityId: input.entityId },
          orderBy: { versionNumber: "desc" },
          skip: MAX_CONTENT_VERSIONS,
          select: { id: true },
        });
        if (stale.length) {
          await db.contentVersion.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
        }
        return;
      } catch (error) {
        const isUniqueRace = String((error as { code?: string }).code) === "P2002";
        if (!isUniqueRace || attempt === 1) throw error;
      }
    }
  } catch (error) {
    console.error("[versions] failed to record version:", error);
  }
}
