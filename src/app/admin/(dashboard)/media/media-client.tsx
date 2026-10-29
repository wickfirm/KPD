"use client";

import { FormEvent, useRef, useState } from "react";
import { uploadCmsAsset } from "@/lib/cms-upload";

/// Multi-file uploads use the streaming route, rather than a Server Action.
/// This keeps the browser's request below Vercel's Server Action payload limit
/// and preserves the 25 MB per-file limit enforced by the API route.
export function MediaUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [progress, setProgress] = useState("");
  const [pending, setPending] = useState(false);

  async function uploadFile(file: File) {
    await uploadCmsAsset(file, setProgress);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = Array.from(inputRef.current?.files ?? []);
    if (!files.length) {
      setError("Choose one or more files to upload.");
      return;
    }

    setPending(true);
    setError("");
    setOk("");
    const failures: string[] = [];
    let uploaded = 0;

    for (const [index, file] of files.entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
      try {
        await uploadFile(file);
        uploaded += 1;
      } catch (reason) {
        failures.push(`${file.name}: ${reason instanceof Error ? reason.message : "Upload failed."}`);
      }
    }

    setPending(false);
    setProgress("");
    if (inputRef.current) inputRef.current.value = "";
    if (failures.length) {
      setError(`${uploaded ? `${uploaded} file${uploaded === 1 ? "" : "s"} uploaded. ` : ""}${failures.join(" ")}`);
      return;
    }
    setOk(`Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}. Refreshing the library…`);
    window.setTimeout(() => window.location.reload(), 500);
  }

  return (
    <form onSubmit={upload}>
      {error ? <p className="cms-error">{error}</p> : null}
      {ok ? <p className="cms-ok" role="status">{ok}</p> : null}
      <div className="cms-upload cms-upload--drop">
        <input ref={inputRef} type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,application/pdf" disabled={pending} />
        <small>JPG, PNG, WebP, GIF, SVG, MP4, WebM or PDF — up to 250 MB per file. Hold Ctrl/Cmd to pick several at once.</small>
      </div>
      <div className="cms-actions" style={{ marginTop: 12 }}>
        <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload to the library"}</button>
      </div>
      {progress ? <p className="cms-muted" role="status">{progress}</p> : null}
    </form>
  );
}
