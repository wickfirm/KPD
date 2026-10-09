import { describe, expect, it } from "vitest";
import { getProjectShell } from "@/lib/legacy-project";
import { parseFigure } from "./raw-figure-parse";

const attrs = (html: string) => Object.fromEntries([...html.match(/^<figure\b([^>]*)>/)![1].matchAll(/([\w:-]+)(?:="([^"]*)")?/g)].map((m) => [m[1] === "class" ? "className" : m[1], m[2] ?? ""]));

describe("parseFigure", () => {
  it.each(["seven-x-seven", "emerald-villa", "dubai-hills-mansion"])("splits the delivered %s figures into their original attributes and inner markup", (slug) => {
    const shell = getProjectShell(slug)!;
    for (const fragment of [shell.overviewFigure, shell.meydanFigure, shell.calmFigure]) {
      const parsed = parseFigure(fragment)!;
      expect(parsed).not.toBeNull();
      expect(parsed.props).toEqual(attrs(fragment));
      expect(parsed.props.className).toMatch(/directional-media|sketch|media/);
      expect(parsed.inner).toBe(fragment.slice(fragment.indexOf(">") + 1, fragment.lastIndexOf("</figure>")));
    }
  });
  it("returns null for anything that is not a single figure", () => {
    expect(parseFigure("<div>x</div>")).toBeNull();
  });
});
