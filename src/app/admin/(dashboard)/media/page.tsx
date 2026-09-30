import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SavedBanner } from "@/components/admin/flash";
import { CopyButton } from "@/components/admin/copy-button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteMedia, importExistingMedia } from "./media-actions";
import { MediaUploadForm } from "./media-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

function formatSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function first(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/// One library for every photo, video and document. Upload here (or straight
/// inside any editor), then reuse files anywhere via "Copy link".
export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);
  const isAdmin = user.role === "ADMIN";
  const page = Math.max(1, Number(params.page) || 1);

  const [assets, total] = await Promise.all([
    db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.mediaAsset.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Library</span>
          <h1>Media</h1>
          <p>Photos, videos and documents used across the website. Upload once, then copy a file's link into any editor — no need to upload the same image twice.</p>
        </div>
        <span className="cms-section-count">{total} file{total === 1 ? "" : "s"}</span>
      </div>
      <SavedBanner params={params} />

      <div className="cms-card">
        <span className="cms-eyebrow">Add files</span>
        <h2>Upload to the library</h2>
        <MediaUploadForm />
        {isAdmin ? (
          <form action={importExistingMedia} className="cms-inline-form cms-import-row">
            <button className="cms-btn cms-btn--ghost cms-btn--small" type="submit">Import files already in storage</button>
            <small className="cms-muted">One-time housekeeping for files uploaded before this library existed.</small>
          </form>
        ) : null}
      </div>

      {assets.length ? (
        <div className="cms-media-grid">
          {assets.map((asset) => {
            const isImage = asset.contentType.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(asset.url);
            return (
              <figure className="cms-media-card" key={asset.id}>
                <div className="cms-media-card__preview">
                  {isImage ? <img src={asset.url} alt={asset.fileName} loading="lazy" /> : <span className="cms-media-card__kind">{asset.contentType.replace("image/", "").toUpperCase() || "FILE"}</span>}
                </div>
                <figcaption>
                  <strong title={asset.fileName}>{asset.fileName}</strong>
                  <span>{formatSize(asset.size)} · {asset.createdAt.toLocaleDateString("en-GB")}{asset.uploadedBy ? ` · ${asset.uploadedBy}` : ""}</span>
                  <div className="cms-media-card__actions">
                    <CopyButton value={asset.url} />
                    <a className="cms-btn cms-btn--ghost cms-btn--small" href={asset.url} target="_blank" rel="noopener noreferrer">Open</a>
                    {isAdmin ? (
                      <form action={deleteMedia}>
                        <input type="hidden" name="id" value={asset.id} />
                        <ConfirmButton className="cms-text-button cms-text-button--danger" message={`Delete “${asset.fileName}” from the library and storage? Pages using it will lose the image.`}>Delete</ConfirmButton>
                      </form>
                    ) : null}
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <div className="cms-card cms-empty">
          <h2>The library is empty</h2>
          <p>Upload your first photos above — or just use the upload button inside any page editor and the file lands here automatically.</p>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="cms-pagination">
          {page > 1 ? <a className="cms-btn cms-btn--ghost cms-btn--small" href={`/admin/media?page=${page - 1}`}>← Newer</a> : null}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages ? <a className="cms-btn cms-btn--ghost cms-btn--small" href={`/admin/media?page=${page + 1}`}>Older →</a> : null}
        </div>
      ) : null}
    </>
  );
}
