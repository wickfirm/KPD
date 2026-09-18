"use client";

import { ChangeEvent, useId, useState } from "react";

export function AssetUrlField({ name, defaultValue = "", value, onChange, accept = "image/*,video/mp4,application/pdf", placeholder }: { name?: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; accept?: string; placeholder?: string }) {
  const [internalUrl, setInternalUrl] = useState(defaultValue);
  const url = value ?? internalUrl;
  const fieldId = useId();
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setStatus("Uploading…");
    const body = new FormData(); body.set("file", file);
    try {
      const response = await fetch("/api/admin/assets", { method: "POST", body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      if (onChange) onChange(result.url); else setInternalUrl(result.url); setStatus("Uploaded and selected.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); event.target.value = ""; }
  }
  function update(next: string) { if (onChange) onChange(next); else setInternalUrl(next); }
  return <><input name={name} value={url} onChange={(event) => update(event.target.value)} placeholder={placeholder} aria-describedby={`${fieldId}-help`} /><span className="cms-upload"><input type="file" accept={accept} onChange={upload} disabled={uploading} aria-label="Upload a file" /><small id={`${fieldId}-help`} aria-live="polite">{status || "Upload a file. Existing imported media can be replaced here."}</small></span>{url && /\.(?:png|jpe?g|webp|gif|svg)(?:\?|$)/i.test(url) ? <img className="cms-asset-preview" src={url} alt="Selected asset preview" /> : null}</>;
}
