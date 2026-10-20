import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActor, requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { r2CompleteMultipartUpload, r2PresignedUpload, r2StartMultipartUpload, r2Upload, r2UploadPart, buildCmsKey, r2PublicUrl } from "@/lib/r2";

const MAX_BYTES = 25 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "application/pdf"]);

async function requireMediaUploader() {
  const session = await requireSession();
  const actor = await getActor();
  if (!actor || !can(actor.user.role, "media.upload")) throw new Error("FORBIDDEN");
  return session;
}

function validUpload(fileName: string, contentType: string, size: number) {
  if (!fileName || !allowedTypes.has(contentType) || !Number.isFinite(size) || size <= 0 || size > MAX_BYTES) return false;
  return true;
}

/// Authenticated CMS media upload. Public assets are served from the configured
/// R2 CDN and the returned URL can be inserted directly into CMS fields. Every
/// upload is registered in the media library (media_assets) so it shows up at
/// /admin/media; registration failure never blocks the upload itself.
export async function POST(request: NextRequest) {
  let session;
  try { session = await requireMediaUploader(); }
  catch { return NextResponse.json({ error: "Your account is not allowed to upload files." }, { status: 403 }); }
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = await request.json().catch(() => null) as { action?: string; fileName?: string; contentType?: string; size?: number; key?: string; uploadId?: string; parts?: { partNumber?: number; eTag?: string }[] } | null;
    if (!body) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    try {
      if (body.action === "start") {
        if (!validUpload(String(body.fileName || ""), String(body.contentType || ""), Number(body.size))) return NextResponse.json({ error: "Use a supported file type up to 25 MB." }, { status: 400 });
        const key = buildCmsKey(String(body.fileName));
        const uploadId = await r2StartMultipartUpload(key, String(body.contentType));
        return NextResponse.json({ key, uploadId });
      }
      if (body.action === "presign") {
        if (!validUpload(String(body.fileName || ""), String(body.contentType || ""), Number(body.size))) return NextResponse.json({ error: "Use a supported file type up to 25 MB." }, { status: 400 });
        const key = buildCmsKey(String(body.fileName));
        return NextResponse.json({ key, uploadUrl: await r2PresignedUpload(key, String(body.contentType)) });
      }
      if (body.action === "register") {
        const key = String(body.key || "");
        const fileName = String(body.fileName || "");
        const contentType = String(body.contentType || "");
        const size = Number(body.size);
        if (!key.startsWith("cms/") || !validUpload(fileName, contentType, size)) return NextResponse.json({ error: "Invalid upload registration." }, { status: 400 });
        const url = r2PublicUrl(key);
        await db.mediaAsset.create({ data: { key, url, fileName, contentType, size, uploadedBy: session.email } });
        return NextResponse.json({ key, url }, { status: 201 });
      }
      if (body.action === "complete") {
        const key = String(body.key || "");
        const uploadId = String(body.uploadId || "");
        const fileName = String(body.fileName || "");
        const contentType = String(body.contentType || "");
        const size = Number(body.size);
        const parts = (body.parts || []).map((part) => ({ partNumber: Number(part.partNumber), eTag: String(part.eTag || "") }));
        if (!key.startsWith("cms/") || !uploadId || !validUpload(fileName, contentType, size) || !parts.length || parts.some((part) => !Number.isInteger(part.partNumber) || part.partNumber < 1 || !part.eTag)) return NextResponse.json({ error: "Invalid multipart upload." }, { status: 400 });
        const uploaded = await r2CompleteMultipartUpload(key, uploadId, parts);
        await db.mediaAsset.create({ data: { key: uploaded.key, url: uploaded.url, fileName, contentType, size, uploadedBy: session.email } }).catch((error) => console.error("[admin/assets] library registration failed:", error));
        return NextResponse.json(uploaded, { status: 201 });
      }
      return NextResponse.json({ error: "Unknown upload action." }, { status: 400 });
    } catch (error) {
      console.error("[admin/assets] multipart setup error:", error);
      return NextResponse.json({ error: error instanceof Error ? error.message : "Multipart upload failed." }, { status: 503 });
    }
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF, SVG, MP4, or PDF file." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Files must be 25 MB or smaller." }, { status: 400 });
  try {
    const uploaded = await r2Upload(buildCmsKey(file.name), new Uint8Array(await file.arrayBuffer()), file.type);
    await db.mediaAsset.create({
      data: {
        key: uploaded.key,
        url: uploaded.url,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        uploadedBy: session.email,
      },
    }).catch((error) => console.error("[admin/assets] library registration failed:", error));
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    console.error("[admin/assets] upload error:", error);
    return NextResponse.json({ error: "Upload failed. Check the R2 configuration and try again." }, { status: 503 });
  }
}

/// A multipart chunk stays below Vercel's 4.5 MB request cap; R2 assembles
/// the completed object after the client sends the final metadata request.
export async function PUT(request: NextRequest) {
  try { await requireMediaUploader(); }
  catch { return NextResponse.json({ error: "Your account is not allowed to upload files." }, { status: 403 }); }
  const key = String(request.headers.get("x-kpd-upload-key") || "");
  const uploadId = String(request.headers.get("x-kpd-upload-id") || "");
  const partNumber = Number(request.headers.get("x-kpd-part-number"));
  const length = Number(request.headers.get("content-length"));
  if (!key.startsWith("cms/") || !uploadId || !Number.isInteger(partNumber) || partNumber < 1 || !Number.isFinite(length) || length <= 0 || length > 4 * 1024 * 1024) return NextResponse.json({ error: "Invalid upload chunk." }, { status: 400 });
  try {
    const eTag = await r2UploadPart(key, uploadId, partNumber, new Uint8Array(await request.arrayBuffer()));
    return NextResponse.json({ eTag });
  } catch (error) {
    console.error("[admin/assets] multipart part error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload chunk failed." }, { status: 503 });
  }
}

