import { db } from "@/lib/db";
import { restoreVersion } from "@/app/admin/(dashboard)/actions";
import { MAX_CONTENT_VERSIONS } from "@/lib/versions";
import { languageNames, type Locale } from "@/lib/locales";
import { ConfirmButton } from "./confirm-button";
import { CMS_TIME_ZONE } from "@/lib/time-zone";

/// "Safety net" panel shown under every versioned editor. Lists the rolling
/// history (newest first, max 5 — the oldest drops off on the 6th save) and
/// lets the editor put the content back to any earlier snapshot.
/// Each language has its own history: pass `locale` on an Arabic or Japanese
/// tab to show that language's saves; the English tab shows the English ones.
export default async function VersionHistory({
  entityType,
  entityId,
  entityLabel,
  locale,
}: {
  entityType: string;
  entityId: string;
  entityLabel?: string;
  locale?: Locale | null;
}) {
  const language = locale && locale !== "en" ? locale : null;
  // The history is a safety net, never a reason for an editor to fail: with
  // none readable (before the database has the language column) it is simply
  // not shown.
  const versions = await db.contentVersion
    .findMany({ where: { entityType, entityId, locale: language }, orderBy: { versionNumber: "desc" }, take: MAX_CONTENT_VERSIONS })
    .catch(() => []);
  // Quiet until the first save of this item — no confusing empty panel.
  if (!versions.length) return null;

  return (
    <section className="cms-card cms-history" aria-label="Version history">
      <span className="cms-eyebrow">Safety net</span>
      <h2>Version history{language ? ` — ${languageNames[language]}` : ""}</h2>
      <p className="cms-muted">
        Every save keeps a snapshot — up to {MAX_CONTENT_VERSIONS} per item, then the oldest drops off.
        Restoring puts {entityLabel ? `“${entityLabel}”` : "this content"} back exactly as it was{language ? ` in ${languageNames[language]}` : ""}.
      </p>
      <ol className="cms-history__list">
        {versions.map((version, index) => (
          <li key={version.id} className={index === 0 ? "is-current" : undefined}>
            <div className="cms-history__meta">
              <strong>v{version.versionNumber}{index === 0 ? " — current" : ""}</strong>
              <span>{version.createdAt.toLocaleString("en-GB", { timeZone: CMS_TIME_ZONE })}</span>
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
