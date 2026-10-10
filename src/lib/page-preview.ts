import { sectionDraftMaxAgeMs } from "./section-preview";

// ── Unsaved-page preview (legal pages) ────────────────────────────────────────
//
// Same mechanism as the section and article previews: the page as it currently
// looks in the editor is kept in one throw-away site_settings row and read only
// by the session-guarded admin preview.

export type PageDraft = {
  title: string;
  content: unknown[];
  savedAt: number;
};

export const pageDraftKey = (slug: string) => `preview:page:${slug}`;

export function isFreshPageDraft(draft: unknown, now = Date.now()): draft is PageDraft {
  if (!draft || typeof draft !== "object") return false;
  const value = draft as Partial<PageDraft>;
  return typeof value.title === "string" && Array.isArray(value.content)
    && typeof value.savedAt === "number" && now - value.savedAt >= 0 && now - value.savedAt < sectionDraftMaxAgeMs;
}

/// Editor paragraphs → stored blocks. A line starting with "## " is a section
/// heading; everything else is a paragraph. Used by the real save and by the
/// preview so the two can never disagree.
export function paragraphBlocks(lines: string[]) {
  return lines.map((text) => text.startsWith("## ")
    ? { type: "heading", heading: text.replace(/^##\s*/, "").trim() }
    : { type: "paragraph", text });
}
