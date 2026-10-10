import { describe, expect, it } from "vitest";
import { isFreshPageDraft, pageDraftKey, paragraphBlocks } from "./page-preview";
import { sectionDraftMaxAgeMs } from "./section-preview";

describe("paragraphBlocks", () => {
  it("turns ## lines into headings and everything else into paragraphs", () => {
    expect(paragraphBlocks(["Intro text.", "## Contact", "Email us.", "##   Spaced  "])).toEqual([
      { type: "paragraph", text: "Intro text." },
      { type: "heading", heading: "Contact" },
      { type: "paragraph", text: "Email us." },
      { type: "heading", heading: "Spaced" },
    ]);
  });
  it("returns nothing for no lines", () => {
    expect(paragraphBlocks([])).toEqual([]);
  });
});

describe("page drafts", () => {
  it("keys a draft by page slug", () => {
    expect(pageDraftKey("terms")).toBe("preview:page:terms");
  });
  it("accepts only recent well-formed drafts", () => {
    const draft = { title: "Terms", content: [], savedAt: 1_000 };
    expect(isFreshPageDraft(draft, 2_000)).toBe(true);
    expect(isFreshPageDraft(draft, 1_000 + sectionDraftMaxAgeMs)).toBe(false);
    expect(isFreshPageDraft({ ...draft, savedAt: 9_000 }, 1_000)).toBe(false);
    expect(isFreshPageDraft({ title: "x", content: "no", savedAt: 1_000 }, 2_000)).toBe(false);
    expect(isFreshPageDraft(undefined)).toBe(false);
  });
});
