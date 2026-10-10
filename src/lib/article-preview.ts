import { sectionDraftMaxAgeMs } from "./section-preview";

// ── Unsaved-article preview ───────────────────────────────────────────────────
//
// Same mechanism as the development section preview (section-preview.ts): the
// article as it currently looks in the editor is kept in one throw-away
// site_settings row and read only by the session-guarded admin preview.

export type ArticleDraft = {
  kind: "NEWS" | "BLOG";
  slug: string;
  title: string;
  summary: string;
  body: string[];
  coverImage: string | null;
  coverImageAlt: string | null;
  savedAt: number;
};

/// One draft per article being edited; one per editor for a brand-new article
/// (it has no id yet), so two people writing at once never see each other's.
export const articleDraftKey = (id: string, editorEmail: string) => (id ? `preview:article:${id}` : `preview:article:new:${editorEmail.toLowerCase()}`);

export function isFreshArticleDraft(draft: unknown, now = Date.now()): draft is ArticleDraft {
  if (!draft || typeof draft !== "object") return false;
  const value = draft as Partial<ArticleDraft>;
  return typeof value.title === "string" && typeof value.summary === "string" && Array.isArray(value.body)
    && (value.kind === "NEWS" || value.kind === "BLOG")
    && typeof value.savedAt === "number" && now - value.savedAt >= 0 && now - value.savedAt < sectionDraftMaxAgeMs;
}
