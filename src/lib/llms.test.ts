import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "./llms";

describe("buildLlmsTxt", () => {
  const text = buildLlmsTxt({
    projects: [{ slug: "emerald-villa", name: "Emerald Villa", description: "A private home composed around landscape." }],
    articles: [{ slug: "news-1", title: "A news item", summary: "What happened." }],
  });

  it("starts with the site name and a one-line summary", () => {
    const [heading, blank, summary] = text.split("\n");
    expect(heading).toBe("# Kasumigaseki Properties Development (KPD)");
    expect(blank).toBe("");
    expect(summary.startsWith("> ")).toBe(true);
  });
  it("lists the key pages, developments and news as absolute links with a summary", () => {
    expect(text).toContain("## Key pages");
    expect(text).toMatch(/- \[Investor guide\]\(https?:\/\/[^)]+\/invest-in-dubai\): .+/);
    expect(text).toMatch(/- \[Emerald Villa\]\(https?:\/\/[^)]+\/developments\/emerald-villa\): A private home/);
    expect(text).toMatch(/- \[A news item\]\(https?:\/\/[^)]+\/news\/news-1\): What happened\./);
  });
  it("leaves out empty sections", () => {
    const bare = buildLlmsTxt({ projects: [], articles: [] });
    expect(bare).not.toContain("## Developments");
    expect(bare).not.toContain("## Latest news");
    expect(bare).toContain("## Key pages");
  });
  it("ends with a newline", () => {
    expect(text.endsWith("\n")).toBe(true);
  });
});
