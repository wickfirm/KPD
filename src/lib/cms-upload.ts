/// Browser upload used by the CMS media picker and the media library.
/// Files over 4 MB go through this app as a multipart upload, so a large video
/// or brochure does not depend on a single browser-to-storage request (those
/// fail once the file is tens of megabytes).
///
/// Two limits meet here. Vercel rejects any request body above 4.5 MB, so the
/// browser never sends more than 4 MiB at a time. R2 (like S3) rejects a
/// multipart upload whose parts, except the last, are under 5 MiB, and it
/// wants those parts to be the same size ("Your proposed upload is smaller
/// than the minimum allowed object size"). So each storage part is 8 MiB,
/// sent as two 4 MiB requests: the server holds the first half in storage
/// and uploads the whole part when the second half arrives.

export const DIRECT_LIMIT = 4 * 1024 * 1024;
/// Largest body the browser sends in one request (Vercel's cap is 4.5 MB).
export const CHUNK = 4 * 1024 * 1024;
/// Storage part size: at least R2's 5 MiB minimum, and a whole number of chunks.
export const PART = 2 * CHUNK;

export type UploadChunk = { start: number; end: number; index: number; count: number };
export type UploadPart = { partNumber: number; chunks: UploadChunk[] };

/// Splits a file into equal 8 MiB storage parts (the last may be smaller),
/// each made of the 1 or 2 request-sized chunks that carry it.
export function planUploadParts(size: number): UploadPart[] {
  const parts: UploadPart[] = [];
  for (let offset = 0, partNumber = 1; offset < size; offset += PART, partNumber += 1) {
    const partEnd = Math.min(size, offset + PART);
    const bounds: [number, number][] = [];
    for (let start = offset; start < partEnd; start += CHUNK) bounds.push([start, Math.min(partEnd, start + CHUNK)]);
    parts.push({ partNumber, chunks: bounds.map(([start, end], index) => ({ start, end, index, count: bounds.length })) });
  }
  return parts;
}

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

export function contentTypeForFile(file: File) {
  if (file.type && Object.values(TYPES).includes(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPES[extension] ?? "";
}

export async function uploadCmsAsset(file: File, onProgress?: (message: string) => void): Promise<string> {
  const contentType = contentTypeForFile(file);
  if (!contentType) throw new Error("Use a JPG, PNG, WebP, GIF, SVG, MP4, WebM, or PDF file.");
  if (file.size <= DIRECT_LIMIT) {
    onProgress?.("Uploading…");
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/assets", { method: "POST", body });
    const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Upload failed.");
    return result.url;
  }

  onProgress?.("Preparing upload…");
  const started = await fetch("/api/admin/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start", fileName: file.name, contentType, size: file.size }),
  });
  const start = await started.json().catch(() => ({})) as { key?: string; uploadId?: string; error?: string };
  if (!started.ok || !start.key || !start.uploadId) throw new Error(start.error || "Unable to prepare the upload.");

  const parts: { partNumber: number; eTag: string }[] = [];
  const plan = planUploadParts(file.size);
  const total = plan.length;
  try {
    for (const { partNumber, chunks } of plan) {
      onProgress?.(`Uploading part ${partNumber} of ${total} (${(file.size / 1024 / 1024).toFixed(0)} MB)…`);
      let eTag = "";
      for (const chunk of chunks) {
        const body = file.slice(chunk.start, chunk.end);
        const uploaded = await fetch("/api/admin/assets", {
          method: "PUT",
          headers: {
            "content-type": "application/octet-stream",
            "x-kpd-upload-key": start.key,
            "x-kpd-upload-id": start.uploadId,
            "x-kpd-part-number": String(partNumber),
            "x-kpd-part-length": String(body.size),
            "x-kpd-chunk-index": String(chunk.index),
            "x-kpd-chunk-count": String(chunk.count),
          },
          body,
        });
        const result = await uploaded.json().catch(() => ({})) as { eTag?: string; staged?: boolean; error?: string };
        const last = chunk.index === chunk.count - 1;
        if (!uploaded.ok || (last ? !result.eTag : !result.staged)) throw new Error(result.error || `Upload stopped on part ${partNumber} of ${total}.`);
        if (last) eTag = result.eTag as string;
      }
      parts.push({ partNumber, eTag });
    }
  } catch (error) {
    // Drop the unfinished upload so storage does not keep orphaned parts.
    await fetch("/api/admin/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "abort", key: start.key, uploadId: start.uploadId, partNumber: parts.length + 1 }),
    }).catch(() => undefined);
    throw error;
  }

  onProgress?.("Finishing upload…");
  const completed = await fetch("/api/admin/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete", key: start.key, uploadId: start.uploadId, fileName: file.name, contentType, size: file.size, parts }),
  });
  const result = await completed.json().catch(() => ({})) as { url?: string; error?: string };
  if (!completed.ok || !result.url) throw new Error(result.error || "Upload finished in storage but could not be saved.");
  return result.url;
}
