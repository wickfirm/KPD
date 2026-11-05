import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getHomeStaticTail } from "./legacy-home";

const delivered = readFileSync(new URL("../../public/legacy/index.html", import.meta.url), "utf8");

describe("getHomeStaticTail", () => {
  it("keeps the delivered visible bands (events, sunset)", () => {
    const tail = getHomeStaticTail();
    expect(tail).toContain("pdf-events-head");
    expect(tail).toContain("pdf-events-grid");
    expect(tail).toContain("pdf-sunset-band");
  });

  it("no longer ships the old homepage hidden with CSS (feedback batch 3, item 5)", () => {
    const tail = getHomeStaticTail();
    expect(tail).not.toContain("quiet luxury");
    expect(tail).not.toContain("<h1");
    expect(tail).not.toContain('class="hero"');
    expect(tail).not.toContain("cards-band");
    // The delivered file is untouched — the fix is in what we serve.
    expect(delivered).toContain("quiet luxury");
  });
});
