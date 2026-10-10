import { sectionDraftMaxAgeMs } from "./section-preview";

// ── Unsaved-page preview (Homepage, Investor guide) ───────────────────────────
//
// Same mechanism as the section, article and legal-page previews: the page as it
// currently looks in the editor is kept in one throw-away site_settings row per
// editor and read only by the session-guarded admin preview. These pages go
// live the moment they are saved, so this is the only way to look before saving.

export type SitePreviewKind = "home" | "invest";

export type SiteDraft<T> = { data: T; savedAt: number };

/// One draft per page per editor, so two people editing never see each other's.
export const siteDraftKey = (kind: SitePreviewKind, editorEmail: string) => `preview:${kind}:${editorEmail.toLowerCase()}`;

export const newSiteDraft = <T>(data: T, now = Date.now()): SiteDraft<T> => ({ data, savedAt: now });

/// The draft's data when it is recent and well formed, otherwise null.
export function freshSiteDraftData<T = unknown>(value: unknown, now = Date.now()): T | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<SiteDraft<T>>;
  if (typeof draft.savedAt !== "number" || draft.data === undefined || draft.data === null) return null;
  const age = now - draft.savedAt;
  return age >= 0 && age < sectionDraftMaxAgeMs ? draft.data : null;
}
