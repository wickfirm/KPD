"use client";

import { useState } from "react";

/// One-click "copy the file link" for the media library, with a fallback for
/// browsers/contexts where the async clipboard API is unavailable.
export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button type="button" className="cms-btn cms-btn--ghost cms-btn--small" onClick={copy} aria-live="polite">
      {copied ? "Copied ✓" : label}
    </button>
  );
}
