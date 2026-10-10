// ── Unsaved-section preview ───────────────────────────────────────────────────
//
// "Preview with unsaved changes" stores the section as it currently looks in the
// editor in one throw-away row per development (site_settings, key below) and
// opens the admin preview with that section swapped in. Nothing public changes:
// the draft is only ever read by the session-guarded preview page, and the next
// preview simply overwrites it.

export type SectionDraft = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  content: unknown;
  savedAt: number;
};

type PreviewModule = { id: string; slug: string; title: string; kind: string; content: unknown };

export const sectionDraftKey = (projectId: string) => `preview:section:${projectId}`;

/// A draft older than this is ignored, so a forgotten preview never shadows saved content.
export const sectionDraftMaxAgeMs = 2 * 60 * 60 * 1000;

export function isFreshDraft(draft: unknown, now = Date.now()): draft is SectionDraft {
  if (!draft || typeof draft !== "object") return false;
  const value = draft as Partial<SectionDraft>;
  return typeof value.title === "string" && typeof value.slug === "string" && typeof value.kind === "string"
    && typeof value.savedAt === "number" && now - value.savedAt >= 0 && now - value.savedAt < sectionDraftMaxAgeMs;
}

/// The saved sections with the draft swapped in (matched by id), or appended
/// when the draft is a brand-new section.
export function overlayDraftSection<T extends PreviewModule>(modules: T[], draft: SectionDraft): { modules: PreviewModule[]; replaced: boolean } {
  const replacement: PreviewModule = { id: draft.id || "draft", slug: draft.slug, title: draft.title, kind: draft.kind, content: draft.content };
  const index = draft.id ? modules.findIndex((module) => module.id === draft.id) : -1;
  if (index === -1) return { modules: [...modules, replacement], replaced: false };
  return { modules: modules.map((module, i) => (i === index ? replacement : module)), replaced: true };
}
