import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// Plain ES module, shared with the unit tests.
import { build, mirrorAll, mirrorSheets, parseSheet } from "../../scripts/build-rtl-css.mjs";

// The right-to-left layout is one static file under public/, built from the
// public stylesheets: every physical left and right mirrored, every rule
// limited to a page marked dir="rtl". The root layout links it on Arabic
// pages only, so an English page can only be touched by a rule that is not
// scoped — which is what these tests rule out.

const rtlCss = () => readFileSync(new URL("../../public/locales/rtl.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const layout = () => readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

/// What the mirror emits for one rule.
function mirrored(rule: string): string[] {
  const sheet = parseSheet(rule);
  expect(sheet.unparsed, "the test's own CSS parses").toBe(0);
  if (sheet.rules.length !== 1) throw new Error(`the test's own CSS is not one rule: ${rule}`);
  return mirrorAll(sheet.rules[0].declarations, []);
}

/// A selector list split on the commas that separate its selectors, not on
/// the ones inside :is(...), :where(...) and the like.
function splitSelectors(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of selector) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += character;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

describe("mirroring a declaration", () => {
  // What the mirror writes for the rule, its resets first. A declaration with
  // no side to mirror is written again as it was.
  it.each([
    ["left: 10px", ["left:auto", "right:10px"]],
    ["left: 0; right: 0", ["right:0", "left:0"]],
    ["inset: 0 auto 0 0", ["inset:0 0 0 auto"]],
    ["margin-left: auto", ["margin-left:0", "margin-right:auto"]],
    ["margin: 0 0 0 24px", ["margin:0 24px 0 0"]],
    ["margin: 0 0 24px", ["margin:0 0 24px"]],
    ["margin: 0 0 var(--gap)", ["margin:0 0 var(--gap)"]],
    ["padding: 0 12px", ["padding:0 12px"]],
    ["padding-inline-start: 12px", ["padding-inline-start:12px"]],
    ["padding-left: 12px; padding-right: 0", ["padding-right:12px", "padding-left:0"]],
    ["padding: 0; padding-left: 12px", ["padding:0", "padding-right:12px"]],
    ["border-left: 1px solid red", ["border-left:0", "border-right:1px solid red"]],
    ["border: 1px solid red; border-left-width: 3px", ["border:1px solid red", "border-right-width:3px"]],
    ["border-top-left-radius: 8px", ["border-top-left-radius:0", "border-top-right-radius:8px"]],
    ["border-radius: 8px 0 0 8px", ["border-radius:0 8px 8px 0"]],
    ["border-radius: 8px 0 0 8px / 50% 0 0 50%", ["border-radius:0 8px 8px 0 / 0 50% 50% 0"]],
    ["text-align: left !important", ["text-align:right !important"]],
    ["text-align: start", ["text-align:start"]],
    ["text-align: center", ["text-align:center"]],
    ["float: left", ["float:right"]],
    ["flex-direction: row-reverse", []],
    ["transform: translate(-50%, -50%)", ["transform:translate(50%, -50%)"]],
    ["transform: translateX(100%)", ["transform:translateX(-100%)"]],
    ["transform: translate3d(var(--x, 0px), 0, 0)", ["transform:translate3d(calc(-1 * var(--x, 0px)), 0, 0)"]],
    ["transform: translateY(4px) scale(1.04)", ["transform:translateY(4px) scale(1.04)"]],
    ["transform: rotate(45deg)", ["transform:rotate(-45deg)"]],
    ["transform: scaleX(-1)", ["transform:scaleX(1)"]],
    ["transform: scale(1.04)", ["transform:scale(1.04)"]],
    ["transform-origin: left center", ["transform-origin:right center"]],
    ["transform-origin: 0", ["transform-origin:100%"]],
    ["translate: 0 4px", ["translate:0 4px"]],
    ["box-shadow: -8px 0 0 red, inset 2px 0 0 blue", ["box-shadow:8px 0 0 red, inset -2px 0 0 blue"]],
    ["box-shadow: 0 1px 2px rgba(0, 0, 0, .2)", ["box-shadow:0 1px 2px rgba(0, 0, 0, .2)"]],
    ["clip-path: inset(0 0 0 100%)", ["clip-path:inset(0 100% 0 0)"]],
    ["clip-path: inset(0 0 var(--inset) 0 round 8px)", ["clip-path:inset(0 0 var(--inset) 0 round 8px)"]],
    ["margin-top: 10px", ["margin-top:10px"]],
    ["top: auto; bottom: 50px", ["top:auto", "bottom:50px"]],
    ["border-top: none", ["border-top:none"]],
    ["border-collapse: collapse", []],
    ["color: red", []],
  ])("%s", (declarations, expected) => {
    expect(mirrored(`.a{${declarations}}`)).toEqual(expected);
  });

  it.each(["object-position: left center", "background-position: left top", "--rail-x: -10px"])("leaves %s alone", (declaration) => {
    expect(mirrored(`.a{${declaration}}`)).toEqual([]);
  });

  it("does not touch a rule that already names a direction", () => {
    expect(build().counts.find(([name]) => name === "redesign-pages.css")?.[2]).toBe(1);
  });
});

describe("mirroring a whole sheet", () => {
  const sheet = build();
  const css = rtlCss();
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
  const selectors = [...body.matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim()).filter((selector) => selector !== "" && !selector.startsWith("@"));
  const onRtlPage = /^(:where\(html\[dir="rtl"\]\)|html:where\(\[dir="rtl"\]\)|:root:where\(html\[dir="rtl"\]\)|html\[dir="rtl"\])/;

  it("public/locales/rtl.css is what the script builds: run node scripts/build-rtl-css.mjs after a change", () => {
    expect(css).toBe(sheet.css.replace(/\r\n/g, "\n"));
  });

  it("every rule, the hand-written ones included, is limited to a page marked dir=\"rtl\"", () => {
    expect(selectors.length).toBeGreaterThan(500);
    for (const selector of selectors) {
      for (const part of splitSelectors(selector)) expect(part, selector).toMatch(onRtlPage);
    }
  });

  it("reads every declaration of the public stylesheets", () => {
    expect(sheet.review.filter((line) => /could not be read/.test(line))).toEqual([]);
  });

  it("keeps the weight of the rule it mirrors, :root and html rules included", () => {
    const { css: out } = mirrorSheets([["t.css", ":root{left:4px} html body .a{left:1px} .b .c{margin-left:2px}"]], "");
    expect(out).toContain(":root:where(html[dir=\"rtl\"]){left:auto}");
    expect(out).toContain(":root:where(html[dir=\"rtl\"]){right:4px}");
    expect(out).toContain("html:where([dir=\"rtl\"]) body .a{left:auto}");
    expect(out).toContain("html:where([dir=\"rtl\"]) body .a{right:1px}");
    expect(out).toContain(":where(html[dir=\"rtl\"]) .b .c{margin-right:2px}");
  });

  it("writes the resets first, where every mirrored declaration out-ranks them", () => {
    const { css: out } = mirrorSheets([["t.css", ".a{margin-left:auto} .b{margin-right:10px}"]], "");
    const reset = out.indexOf(":where(html[dir=\"rtl\"]) .a{margin-left:0}");
    const mirrored = out.indexOf(":where(html[dir=\"rtl\"]) .b{margin-left:10px}");
    expect(reset).toBeGreaterThan(0);
    expect(mirrored).toBeGreaterThan(reset);
  });

  it("writes every rule that sets a side again, in order: a later cancellation still holds", () => {
    const { css: out } = mirrorSheets([["t.css", ".a{margin-left:24px} .b{margin:0} .c{color:red} .a{max-width:1px;margin:0}"]], "");
    const mirrored = out.indexOf(":where(html[dir=\"rtl\"]) .a{margin-right:24px}");
    const again = out.indexOf(":where(html[dir=\"rtl\"]) .a{margin:0}");
    expect(mirrored).toBeGreaterThan(0);
    expect(again).toBeGreaterThan(mirrored);
    expect(out).toContain(":where(html[dir=\"rtl\"]) .b{margin:0}");
    expect(out).not.toContain(".c{");
  });

  it("a later rule that cancels only the top or bottom of a shorthand still wins", () => {
    // Seen on the legal pages: the hero block's "top: auto" lost to a repeated
    // "inset: 0", and the title ended up behind the header.
    const { css: out } = mirrorSheets([["t.css", ".a{position:absolute;inset:0} .b{color:red} .a{top:auto;bottom:50px}"]], "");
    const inset = out.indexOf(":where(html[dir=\"rtl\"]) .a{inset:0}");
    const later = out.indexOf(":where(html[dir=\"rtl\"]) .a{top:auto;bottom:50px}");
    expect(inset).toBeGreaterThan(0);
    expect(later).toBeGreaterThan(inset);
    expect(out).not.toContain(".b{");
  });

  it("a rule for narrow screens still out-ranks the desktop rule it overrides", () => {
    // Seen on every page at 390: the floating buttons slid half-way off-screen.
    const { css: out } = mirrorSheets([["t.css", "@media (min-width: 800px){.x{left:50%;transform:translate(-50%,0)}} .x.on{transform:translateY(0)}"]], "");
    const desktop = out.indexOf("translate(50%, 0)");
    const narrow = out.indexOf(".x.on{transform:translateY(0)}");
    expect(desktop).toBeGreaterThan(0);
    expect(narrow).toBeGreaterThan(desktop);
  });

  it("a keyframe that moves sideways is redefined whole, mirrored", () => {
    const { css } = mirrorSheets([["test.css", "@keyframes slide{0%,\n 40%{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:none}} @keyframes fade{from{opacity:0}to{opacity:1}}"]], "");
    // Only the first one moves sideways; the fade is left to the delivered sheet.
    expect(css.match(/@keyframes/g)?.length).toBe(1);
    expect(css).toContain("@keyframes slide{0%, 40%{opacity:0;transform:translateX(100%)}to{opacity:1;transform:none}}");
  });

  it("the root layout links it for Arabic, inside the same condition as ar.css", () => {
    const arabic = /\{locale === "ar" \? <>([\s\S]*?)<\/> : null\}/.exec(layout());
    expect(arabic?.[1]).toContain('href="/locales/ar.css"');
    expect(arabic?.[1]).toContain('href="/locales/rtl.css"');
    expect(layout().match(/rtl\.css/g)?.length).toBe(1);
  });
});
