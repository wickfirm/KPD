"use client";

import { ChangeEvent, useId, useState } from "react";

export function AssetUrlField({ name, defaultValue = "", value, onChange, accept = "image/*,video/mp4,application/pdf", placeholder, fileLabel = "file", hidePreview = false }: { name?: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; accept?: string; placeholder?: string; fileLabel?: string; hidePreview?: boolean }) {
  const [internalUrl, setInternalUrl] = useState(defaultValue);
  const url = value ?? internalUrl;
  const fieldId = useId();
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setStatus("Uploading…");
    try {
      let result: { url?: string };
      // Vercel rejects requests over 4.5 MB. Large video files upload straight
      // to R2 through a short-lived signed URL, then the CMS registers them.
      if (file.size > 4 * 1024 * 1024) {
        setStatus("Preparing secure direct upload…");
        const signedResponse = await fetch("/api/admin/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "presign", fileName: file.name, contentType: file.type, size: file.size }) });
        const signed = await signedResponse.json().catch(() => ({}));
        if (!signedResponse.ok || !signed.uploadUrl || !signed.key) throw new Error(signed.error || "Unable to prepare the large-file upload.");
        setStatus(`Uploading ${(file.size / 1024 / 1024).toFixed(1)} MB directly to storage…`);
        const uploadResponse = await fetch(signed.uploadUrl, { method: "PUT", body: file, headers: { "x-amz-content-sha256": "UNSIGNED-PAYLOAD" } });
        if (!uploadResponse.ok) throw new Error("Direct upload failed. Please ask us to enable the R2 upload CORS policy for this website.");
        const registerResponse = await fetch("/api/admin/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", key: signed.key, fileName: file.name, contentType: file.type, size: file.size }) });
        result = await registerResponse.json().catch(() => ({}));
        if (!registerResponse.ok) throw new Error((result as { error?: string }).error || "Upload completed but could not be added to the CMS media library.");
      } else {
        const body = new FormData(); body.set("file", file);
        const response = await fetch("/api/admin/assets", { method: "POST", body });
        result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error((result as { error?: string }).error || "Upload failed.");
      }
      if (!result.url) throw new Error("Upload completed but did not return a media URL.");
      if (onChange) onChange(result.url); else setInternalUrl(result.url); setStatus("Uploaded and selected.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); event.target.value = ""; }
  }
  function update(next: string) { if (onChange) onChange(next); else setInternalUrl(next); }
  return <><input type="hidden" name={name} value={url} /><div className="cms-media-picker"><div className="cms-media-picker__action"><input id={fieldId} type="file" accept={accept} onChange={upload} disabled={uploading} aria-label={`Upload ${fileLabel}`} /><label htmlFor={fieldId}>{uploading ? "Uploading…" : url ? `Replace ${fileLabel}` : `Upload ${fileLabel}`}</label><small aria-live="polite">{status || (url ? "File selected" : "Choose an image, video, or document")}</small></div>{url && !hidePreview && /\.(?:png|jpe?g|webp|gif|svg)(?:\?|$)/i.test(url) ? <img className="cms-asset-preview" src={url} alt="Selected asset preview" /> : null}</div><details className="cms-advanced-input"><summary>Use an existing file link</summary><input value={url} onChange={(event) => update(event.target.value)} placeholder={placeholder} aria-describedby={`${fieldId}-help`} /><small id={`${fieldId}-help`}>For a previously hosted file only.</small></details></>;
}
