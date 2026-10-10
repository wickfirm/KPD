import { describe, expect, it } from "vitest";
import { isFreshDraft, overlayDraftSection, sectionDraftMaxAgeMs, type SectionDraft } from "./section-preview";

const saved = [
  { id: "a", slug: "overview", title: "Overview", kind: "CUSTOM", content: { text: "old" } },
  { id: "b", slug: "gallery", title: "Gallery", kind: "GALLERY", content: {} },
];
const draft = (patch: Partial<SectionDraft> = {}): SectionDraft => ({ id: "a", slug: "overview", title: "Overview (edited)", kind: "CUSTOM", content: { text: "new" }, savedAt: 1_000, ...patch });

describe("overlayDraftSection", () => {
  it("swaps an edited section in place, keeping the order", () => {
    const out = overlayDraftSection(saved, draft());
    expect(out.replaced).toBe(true);
    expect(out.modules.map((module) => module.id)).toEqual(["a", "b"]);
    expect(out.modules[0].title).toBe("Overview (edited)");
    expect(saved[0].title).toBe("Overview");
  });

  it("appends a brand-new section", () => {
    const out = overlayDraftSection(saved, draft({ id: "", slug: "new-one", title: "New one" }));
    expect(out.replaced).toBe(false);
    expect(out.modules.map((module) => module.slug)).toEqual(["overview", "gallery", "new-one"]);
  });

  it("appends when the edited section no longer exists", () => {
    expect(overlayDraftSection(saved, draft({ id: "gone" })).modules).toHaveLength(3);
  });
});

describe("isFreshDraft", () => {
  it("accepts a recent well-formed draft", () => {
    expect(isFreshDraft(draft(), 2_000)).toBe(true);
  });
  it("rejects stale, future-dated and malformed drafts", () => {
    expect(isFreshDraft(draft(), 1_000 + sectionDraftMaxAgeMs)).toBe(false);
    expect(isFreshDraft(draft({ savedAt: 5_000 }), 1_000)).toBe(false);
    expect(isFreshDraft(null)).toBe(false);
    expect(isFreshDraft({ title: "x" })).toBe(false);
  });
});
