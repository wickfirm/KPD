"use client";

import { ChangeEvent, useId, useState } from "react";
import { contentTypeForFile, uploadCmsAsset } from "@/lib/cms-upload";

const MAX_BYTES = 250 * 1024 * 1024;

/// The same limits the upload route enforces, written for the person choosing the file.
function uploadSpec(accept: string) {
  const names = accept.split(",").map((part) => part.trim().toLowerCase()).flatMap((part) => {
    if (part === "image/*") return ["JPG", "PNG", "WebP", "GIF", "SVG"];
    if (part === "image/jpeg") return ["JPG"];
    if (part === "image/png") return ["PNG"];
    if (part === "image/webp") return ["WebP"];
    if (part === "image/gif") return ["GIF"];
    if (part === "image/svg+xml") return ["SVG"];
    if (part === "video/mp4") return ["MP4"];
    if (part === "video/webm") return ["WebM"];
    if (part === "application/pdf") return ["PDF"];
    return [];
  });
  const unique = [...new Set(names)];
  const list = unique.length <= 1 ? (unique[0] ?? "A supported file") : `${unique.slice(0, -1).join(", ")} or ${unique[unique.length - 1]}`;
  return `${list}. Maximum size 250 MB.`;
}

export function AssetUrlField({ name, defaultValue = "", value, onChange, accept = "image/*,video/mp4,video/webm,application/pdf", placeholder, fileLabel = "file", hidePreview = false }: { name?: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; accept?: string; placeholder?: string; fileLabel?: string; hidePreview?: boolean }) {
  const [internalUrl, setInternalUrl] = useState(defaultValue);
  const url = value ?? internalUrl;
  const fieldId = useId();
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const spec = uploadSpec(accept);
    if (!contentTypeForFile(file)) {
      setStatus(`This file is not an accepted type. ${spec}`);
      event.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus(`This file is ${(file.size / 1024 / 1024).toFixed(0)} MB. ${spec}`);
      event.target.value = "";
      return;
    }
    setUploading(true); setStatus("Uploading…");
    try {
      const next = await uploadCmsAsset(file, setStatus);
      if (onChange) onChange(next); else setInternalUrl(next); setStatus("Uploaded and selected.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); event.target.value = ""; }
  }
  function update(next: string) { if (onChange) onChange(next); else setInternalUrl(next); }
  return <><input type="hidden" name={name} value={url} /><div className="cms-media-picker"><div className="cms-media-picker__action"><input id={fieldId} type="file" accept={accept} onChange={upload} disabled={uploading} aria-label={`Upload ${fileLabel}`} /><label htmlFor={fieldId}>{uploading ? "Uploading…" : url ? `Replace ${fileLabel}` : `Upload ${fileLabel}`}</label><small>{uploadSpec(accept)}</small><small aria-live="polite">{status || (url ? "File selected" : "")}</small></div>{url && !hidePreview && /\.(?:png|jpe?g|webp|gif|svg)(?:\?|$)/i.test(url) ? <img className="cms-asset-preview" src={url} alt="Selected asset preview" /> : null}</div><details className="cms-advanced-input"><summary>Use an existing file link</summary><input value={url} onChange={(event) => update(event.target.value)} placeholder={placeholder} aria-describedby={`${fieldId}-help`} /><small id={`${fieldId}-help`}>For a previously hosted file only.</small></details></>;
}
