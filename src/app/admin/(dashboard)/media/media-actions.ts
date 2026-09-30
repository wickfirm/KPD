"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { r2Upload, r2Delete, r2List, r2PublicUrl, buildCmsKey, contentTypeFromKey } from "@/lib/r2";

// ─────────────────────────────────────────────────────────────────────────────
// Media library actions. Uploads are open to every signed-in CMS user (editors
// need images); deleting from storage and importing existing bucket files are
// administrator-only, matching the permission matrix.
// ─────────────────────────────────────────────────────────────────────────────

export type MediaFormState = { error?: string; ok?: string };

const MAX_BYTES = 25 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "application/pdf"]);

export async function uploadMedia(
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const { session } = await requireUser();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length) return { error: "Choose one or more files to upload." };

  const uploaded: string[] = [];
  for (const file of files) {
    if (!allowedTypes.has(file.type)) return { error: `“${file.name}” is not a supported type. Use JPG, PNG, WebP, GIF, SVG, MP4 or PDF.` };
    if (file.size > MAX_BYTES) return { error: `“${file.name}” is larger than 25 MB.` };
  }

  try {
    for (const file of files) {
      const key = buildCmsKey(file.name);
      const result = await r2Upload(key, new Uint8Array(await file.arrayBuffer()), file.type);
      await db.mediaAsset.create({
        data: { key: result.key, url: result.url, fileName: file.name, contentType: file.type, size: file.size, uploadedBy: session.email },
      });
      uploaded.push(file.name);
    }
  } catch (error) {
    console.error("[media] upload failed:", error);
    return { error: "Upload failed — check the storage configuration and try again." };
  }

  await logActivity({
    action: "media.upload",
    session,
    entityType: "MEDIA",
    summary: `Uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"}: ${uploaded.slice(0, 3).join(", ")}${uploaded.length > 3 ? "…" : ""}`,
  });
  revalidatePath("/admin/media");
  return { ok: `Uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"}. Copy a link below, or use the upload button inside any page editor.` };
}

export async function deleteMedia(formData: FormData) {
  const { session } = await requireRole(["ADMIN"]);
  const id = String(formData.get("id") || "");
  if (!id) return;

  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) return;

  const removalFailure = await r2Delete(asset.key).then(() => false).catch(() => true);
  await db.mediaAsset.delete({ where: { id } }).catch(() => null);
  await logActivity({
    action: "media.delete",
    session,
    entityType: "MEDIA",
    entityId: asset.key,
    summary: removalFailure
      ? `Removed ${asset.fileName} from the library (the storage copy could not be deleted — check R2 manually)`
      : `Deleted ${asset.fileName} from the media library`,
  });
  revalidatePath("/admin/media");
  redirect(`/admin/media?msg=${encodeURIComponent(removalFailure ? `${asset.fileName} was removed from the library, but its storage copy needs manual cleanup.` : `${asset.fileName} was deleted.`)}`);
}

/// Backfill: register files that already live in the R2 bucket (uploaded before
/// the media library existed). Safe to run repeatedly — existing keys are kept.
export async function importExistingMedia(formData: FormData) {
  const { session } = await requireRole(["ADMIN"]);
  void formData;
  try {
    const objects = await r2List("", 2000);
    const known = new Set((await db.mediaAsset.findMany({ select: { key: true } })).map((row) => row.key));
    const fresh = objects.filter((object) => !known.has(object.key));
    if (fresh.length) {
      await db.mediaAsset.createMany({
        data: fresh.map((object) => ({
          key: object.key,
          url: r2PublicUrl(object.key),
          fileName: object.key.split("/").pop() || object.key,
          contentType: contentTypeFromKey(object.key),
          size: object.size,
          uploadedBy: null,
        })),
        skipDuplicates: true,
      });
    }
    await logActivity({ action: "media.import", session, entityType: "MEDIA", summary: `Imported ${fresh.length} existing storage file${fresh.length === 1 ? "" : "s"} into the media library` });
    revalidatePath("/admin/media");
    redirect(`/admin/media?msg=${encodeURIComponent(fresh.length ? `Imported ${fresh.length} existing file${fresh.length === 1 ? "" : "s"} from storage.` : "Storage is already fully in the library — nothing new to import.")}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error; // re-throw NEXT_REDIRECT
    console.error("[media] import failed:", error);
    redirect(`/admin/media?error=${encodeURIComponent("Could not read the storage bucket. Check the R2 configuration.")}`);
  }
}
