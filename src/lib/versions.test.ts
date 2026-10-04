import { describe, expect, it, vi } from "vitest";

// versions.ts pulls in the Prisma singleton — the snapshot helpers never touch
// it, so stub the db import to keep the test hermetic.
vi.mock("@/lib/db", () => ({ db: {} }));

import { snapshotFormData, snapshotToFormData } from "@/lib/versions";

function buildForm(entries: Record<string, string | string[]>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) form.append(key, item);
  }
  return form;
}

describe("version snapshots", () => {
  it("round-trips every entry, including repeated keys", () => {
    const form = buildForm({ title: "Legacy", managementName: ["A", "B"], managementRole: ["CEO", "CTO"] });
    const restored = snapshotToFormData(snapshotFormData(form));
    expect(restored.getAll("managementName")).toEqual(["A", "B"]);
    expect(restored.getAll("managementRole")).toEqual(["CEO", "CTO"]);
    expect(restored.get("title")).toBe("Legacy");
  });

  it("drops the id key so restores always target the current record", () => {
    const snapshot = snapshotFormData(buildForm({ id: "old-id", title: "x" }));
    expect(snapshot.id).toBeUndefined();
    expect(snapshot.title).toEqual(["x"]);
  });

  it("omits keys whose every value is an empty string", () => {
    const snapshot = snapshotFormData(buildForm({ title: "x", summary: ["", ""] }));
    expect(Object.keys(snapshot).sort()).toEqual(["title"]);
  });

  it("returns an empty FormData for malformed snapshots", () => {
    expect(snapshotToFormData(null).keys().next().done).toBe(true);
    expect(snapshotToFormData("nope").keys().next().done).toBe(true);
    expect(snapshotToFormData([1, 2]).keys().next().done).toBe(true);
    // non-array values inside an object are skipped, array values survive
    const restored = snapshotToFormData({ title: ["x"], bad: 42 });
    expect(restored.get("title")).toBe("x");
    expect(restored.get("bad")).toBeNull();
  });
});
