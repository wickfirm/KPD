import { r2PresignedDownload } from "@/lib/r2";

/// Turns a CMS file address into an absolute link the visitor's browser can open.
export function brochureLink(origin: string, url: string) {
  const trimmed = url.trim();
  if (!trimmed || /^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!trimmed.startsWith("/")) return "";
  try {
    return new URL(trimmed, origin).toString();
  } catch {
    return "";
  }
}

/// The R2 object key behind a public CMS file URL, or "" when the link points elsewhere.
export function r2KeyFromPublicUrl(url: string, publicBase = process.env.R2_PUBLIC_BASE_URL ?? "") {
  const base = publicBase.trim().replace(/\/+$/, "");
  if (!base || !url.startsWith(`${base}/`)) return "";
  const path = url.slice(base.length + 1).split(/[?#]/)[0];
  try {
    return decodeURIComponent(path);
  } catch {
    return "";
  }
}

/// File name the visitor's download is saved under, e.g. "seven-x-seven-brochure.pdf".
export function brochureFileName(projectSlug: string, url: string) {
  const extension = url.split(/[?#]/)[0].toLowerCase().match(/\.([a-z0-9]{1,8})$/)?.[1] ?? "pdf";
  const slug = projectSlug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "kpd";
  return `${slug}-brochure.${extension}`;
}

/// Link handed back to the brochure pop-up once the lead is saved. Files in the
/// CMS bucket get a short-lived signed link that tells the browser to save the
/// file (Content-Disposition: attachment), so the download starts without
/// leaving the page. Any other address is returned as is.
export async function brochureDownload(input: { origin: string; url: string; projectSlug: string }) {
  const link = brochureLink(input.origin, input.url);
  if (!link) return null;
  const fileName = brochureFileName(input.projectSlug, link);
  const key = r2KeyFromPublicUrl(link);
  if (key) {
    try {
      return { url: await r2PresignedDownload(key, fileName), fileName, attachment: true };
    } catch (error) {
      console.error("[brochure] signed download link failed, using the public link:", error);
    }
  }
  return { url: link, fileName, attachment: false };
}
