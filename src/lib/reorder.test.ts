import { describe, expect, it } from "vitest";
import { reorder } from "./reorder";

describe("reorder", () => {
  it("moves an item forward and backward", () => {
    expect(reorder(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(reorder(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
  it("returns the same list for no-ops and out-of-range moves", () => {
    const list = ["a", "b"];
    expect(reorder(list, 1, 1)).toBe(list);
    expect(reorder(list, 0, -1)).toBe(list);
    expect(reorder(list, 0, 2)).toBe(list);
  });
});
