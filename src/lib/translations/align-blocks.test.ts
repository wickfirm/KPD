import { describe, expect, it } from "vitest";
import { alignToSaved } from "./align-blocks";
import { mergeLocale, translationDiff } from "./merge-locale";

describe("alignToSaved", () => {
  // The browser test of the History page caught this one: its editor has no
  // body box, so the translation of its history section was filed one block
  // too early and refused on the page.
  it("files a translation under the saved block it belongs to when the editor cannot show every saved block", () => {
    const saved = [{ type: "hero", heading: "History" }, { type: "paragraph", text: "A paragraph the History editor has no box for." }, { type: "legacy", nameHeading: "The name." }];
    const englishForm = [{ type: "hero", heading: "History" }, { type: "legacy", nameHeading: "The name." }];
    const arabicForm = [{ type: "hero", heading: "History" }, { type: "legacy", nameHeading: "الاسم." }];
    const translation = translationDiff(saved, alignToSaved(saved, englishForm));
    expect(translation).toBeNull();
    const stored = translationDiff(alignToSaved(saved, englishForm), alignToSaved(saved, arabicForm));
    expect(stored).toEqual([null, null, { type: "legacy", nameHeading: "الاسم." }]);
    expect(mergeLocale(saved, stored)).toEqual([...saved.slice(0, 2), { type: "legacy", nameHeading: "الاسم." }]);
  });

  it("keeps the order of each kind and pairs a block without a counterpart with itself", () => {
    const saved = [{ type: "hero" }, { type: "paragraph", text: "one" }, { type: "paragraph", text: "two" }, { type: "paragraph", text: "three" }, { type: "about" }];
    const shown = [{ type: "hero" }, { type: "paragraph", text: "one" }, { type: "paragraph", text: "two" }, { type: "about" }];
    expect(alignToSaved(saved, shown)).toEqual([{ type: "hero" }, { type: "paragraph", text: "one" }, { type: "paragraph", text: "two" }, { type: "paragraph", text: "three" }, { type: "about" }]);
  });

  it("leaves a list that already lines up as it is", () => {
    const saved = [{ type: "hero" }, { type: "contact-form" }];
    expect(alignToSaved(saved, [{ type: "hero" }, { type: "contact-form" }])).toEqual(saved);
    expect(alignToSaved([], [])).toEqual([]);
  });
});
