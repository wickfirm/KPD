import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActor, requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { r2Upload, buildCmsKey } from "@/lib/r2";

const MAX_BYTES = 25 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "application/pdf"]);

/// Authenticated CMS media upload. Public assets are served from the configured
/// R2 CDN and the returned URL can be inserted directly into CMS fields. Every
/// upload is registered in the media library (media_assets) so it shows up at
/// /admin/media; registration failure never blocks the upload itself.
export async function POST(request: NextRequest) {
  const session = await requireSession();
  // The cookie only proves who signed in; check the live account and its role.
  const actor = await getActor();
  if (!actor || !can(actor.user.role, "media.upload")) return NextResponse.json({ error: "Your account is not allowed to upload files." }, { status: 403 });
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

