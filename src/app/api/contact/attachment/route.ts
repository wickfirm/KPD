import { NextRequest, NextResponse } from "next/server";
import { r2Upload, buildCmsKey } from "@/lib/r2";

/// Public CV upload for the contact form's Job Inquiry pane (multipart/form-data,
/// field "file"). Stores the document in the same R2 bucket as the media
/// library and returns its public URL, which the form then includes in the
/// submission message. Deliberately strict: PDF/DOC/DOCX only, 10 MB cap.
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file was received." }, { status: 400 });
  }

  const fileName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => fileName.endsWith(extension))) {
    return NextResponse.json({ error: "Only PDF, DOC and DOCX files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "The file is too large (10 MB maximum)." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await r2Upload(buildCmsKey(file.name), buffer, file.type || "application/octet-stream");
    return NextResponse.json({ url, name: file.name }, { status: 201 });
  } catch (err) {
    console.error("[api/contact/attachment] upload error:", err);
    return NextResponse.json({ error: "The file could not be stored right now. Please try again shortly." }, { status: 503 });
  }
}
