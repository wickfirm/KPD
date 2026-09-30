"use client";

import { useActionState } from "react";
import { uploadMedia, type MediaFormState } from "./media-actions";

const initialState: MediaFormState = {};

/// Multi-file upload with plain-language feedback. Errors keep every file
/// selected so the editor can fix one bad file without starting over.
export function MediaUploadForm() {
  const [state, formAction, pending] = useActionState(uploadMedia, initialState);
  return (
    <form action={formAction}>
      {state.error ? <p className="cms-error">{state.error}</p> : null}
      {state.ok ? <p className="cms-ok" role="status">{state.ok}</p> : null}
      <div className="cms-upload cms-upload--drop">
        <input type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,application/pdf" disabled={pending} />
        <small>JPG, PNG, WebP, GIF, SVG, MP4 or PDF — up to 25 MB per file. Hold Ctrl/Cmd to pick several at once.</small>
      </div>
      <div className="cms-actions" style={{ marginTop: 12 }}>
        <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload to the library"}</button>
      </div>
    </form>
  );
}
