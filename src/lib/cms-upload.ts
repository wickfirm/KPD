/// Browser upload used by the CMS media picker and the media library.
/// Files over 4 MB are sent to this app in 4 MB chunks. The server forwards
/// each chunk to storage, so a large video does not depend on a single
/// browser-to-storage request (those fail once the file is tens of megabytes).

const DIRECT_LIMIT = 4 * 1024 * 1024;
const CHUNK = 4 * 1024 * 1024;

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
  const total = Math.ceil(file.size / CHUNK);
  for (let index = 0; index < total; index += 1) {
    const partNumber = index + 1;
    onProgress?.(`Uploading part ${partNumber} of ${total} (${(file.size / 1024 / 1024).toFixed(0)} MB)…`);
    const chunk = file.slice(index * CHUNK, Math.min(file.size, partNumber * CHUNK));
    const uploaded = await fetch("/api/admin/assets", {
      method: "PUT",
      headers: {
        "content-type": "application/octet-stream",
        "x-kpd-upload-key": start.key,
        "x-kpd-upload-id": start.uploadId,
        "x-kpd-part-number": String(partNumber),
        "x-kpd-part-length": String(chunk.size),
      },
      body: chunk,
    });
    const part = await uploaded.json().catch(() => ({})) as { eTag?: string; error?: string };
    if (!uploaded.ok || !part.eTag) throw new Error(part.error || `Upload stopped on part ${partNumber} of ${total}.`);
    parts.push({ partNumber, eTag: part.eTag });
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
