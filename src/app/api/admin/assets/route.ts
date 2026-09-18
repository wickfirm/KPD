import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { r2Upload } from "@/lib/r2";

const MAX_BYTES = 25 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "application/pdf"]);

function safeName(name: string) {
  const extension = name.toLowerCase().match(/\.[a-z0-9]{1,8}$/)?.[0] || "";
  return `${crypto.randomUUID()}${extension}`;
}

/// Authenticated CMS media upload. Public assets are served from the configured
/// R2 CDN and the returned URL can be inserted directly into CMS fields.
export async function POST(request: NextRequest) {
  await requireSession();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF, SVG, MP4, or PDF file." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Files must be 25 MB or smaller." }, { status: 400 });
  try {
    const uploaded = await r2Upload(`cms/${new Date().toISOString().slice(0, 10)}/${safeName(file.name)}`, new Uint8Array(await file.arrayBuffer()), file.type);
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    console.error("[admin/assets] upload error:", error);
    return NextResponse.json({ error: "Upload failed. Check the R2 configuration and try again." }, { status: 503 });
  }
}
