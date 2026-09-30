import { db } from "@/lib/db";
import { restoreVersion } from "@/app/admin/(dashboard)/actions";
import { MAX_CONTENT_VERSIONS } from "@/lib/versions";
import { ConfirmButton } from "./confirm-button";

/// "Safety net" panel shown under every versioned editor. Lists the rolling
/// history (newest first, max 5 — the oldest drops off on the 6th save) and
/// lets the editor put the content back to any earlier snapshot.
export default async function VersionHistory({
  entityType,
  entityId,
  entityLabel,
}: {
  entityType: string;
  entityId: string;
  entityLabel?: string;
}) {
  const versions = await db.contentVersion.findMany({
    where: { entityType, entityId },
    orderBy: { versionNumber: "desc" },
    take: MAX_CONTENT_VERSIONS,
  });
  // Quiet until the first save of this item — no confusing empty panel.
  if (!versions.length) return null;

  return (
    <section className="cms-card cms-history" aria-label="Version history">
      <span className="cms-eyebrow">Safety net</span>
      <h2>Version history</h2>
      <p className="cms-muted">
        Every save keeps a snapshot — up to {MAX_CONTENT_VERSIONS} per item, then the oldest drops off.
        Restoring puts {entityLabel ? `“${entityLabel}”` : "this content"} back exactly as it was.
      </p>
      <ol className="cms-history__list">
        {versions.map((version, index) => (
          <li key={version.id} className={index === 0 ? "is-current" : undefined}>
            <div className="cms-history__meta">
              <strong>v{version.versionNumber}{index === 0 ? " — current" : ""}</strong>
              <span>{version.createdAt.toLocaleString("en-GB")}</span>
              {version.authorEmail ? <span>{version.authorEmail}</span> : null}
              <span className="cms-history__label">{version.label}</span>
            </div>
            {index !== 0 ? (
              <form action={restoreVersion}>
                <input type="hidden" name="versionId" value={version.id} />
                <ConfirmButton
                  className="cms-btn cms-btn--ghost cms-btn--small"
                  message={`Restore “${version.label}” to how it was at version ${version.versionNumber}?`}
                >
                  Restore this version
                </ConfirmButton>
              </form>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
