#!/usr/bin/env node
/// Builds public/locales/rtl.css: the public stylesheets with every physical
/// left and right mirrored, every rule limited to a page marked dir="rtl".
///
/// The delivered site.css cannot change, and it positions with left and right.
/// On an Arabic page (<html dir="rtl">) the browser already mirrors the order
/// of flex and grid items, text-align: start and the logical properties; this
/// sheet mirrors the rest. The root layout links it on Arabic pages only,
/// after every other stylesheet, so English and Japanese pages never request
/// it.
///
/// How the mirror keeps the delivered cascade. The delivered rules still
/// apply, so the sheet does not try to out-rank them: every rule that sets a
/// side is written again, in order, through :where(), with exactly the weight
/// it had, and it wins only because it comes later. Whatever out-ranked a
/// rule in English (a more specific rule, a rule for phones, a rule written
/// further down) therefore still out-ranks its mirror in Arabic.
/// - A mirrored declaration is the delivered one with the other side
///   (left: 10px becomes right: 10px).
/// - The delivered declaration still sets the side it named, so that side is
///   put back to nothing. Those resets are written first in each sheet, where
///   every mirrored declaration out-ranks them.
/// - A declaration that states both sides at once (margin: 0) is written again
///   unchanged, so a later "margin: 0" still cancels an earlier
///   "margin-left: 24px", exactly as it does in English. So is anything that
///   sets only the top or the bottom of such a shorthand (margin-top after
///   margin), which is why the set of properties written again is closed.
///
/// What is mirrored: left/right, margin-*, padding-*, border-* (one side),
/// the fourth value of the margin/padding/inset/border-width shorthands, the
/// corners of border-radius, float, clear, text-align: left|right,
/// transform-origin, the horizontal part of transforms and shadows, and the
/// keyframes that animate any of these.
///
/// What is left alone: photos (object-position) and background images
/// (background-position), custom properties, logical properties (the browser
/// mirrors those), three-value shorthands (they already set both sides
/// alike), flex-direction (row and row-reverse each mirror themselves), and
/// any rule that already names a direction or a language. A value the script
/// cannot read with certainty is listed by --report.
///
/// scripts/rtl-manual.css is appended after the generated part for what a
/// mirror cannot express: icons drawn as backgrounds, elements a script
/// positions, text that must stay left-to-right.
///
/// usage: node scripts/build-rtl-css.mjs             write the file
///        node scripts/build-rtl-css.mjs --check     exit 1 if out of date
///        node scripts/build-rtl-css.mjs --report    also list what was skipped

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "public/locales/rtl.css";
const MANUAL = "scripts/rtl-manual.css";

/// In cascade order: each sheet is mirrored as the public pages load it.
const SOURCES = [
  ["ownership-planner-top.css", "public/legacy/assets/css/ownership-planner-top.css"],
  ["site.css", "public/legacy/assets/css/site.css"],
  ["ownership-planner-end.css", "public/legacy/assets/css/ownership-planner-end.css"],
  ["public.css", "src/app/(public)/public.css"],
  ["redesign-pages.css", "src/app/(public)/redesign-pages.css"],
  ["sxs.css", "src/app/(sxs-page)/sxs.css"],
];

/// A rule that already names a direction or a language is somebody's own.
const OWN_DIRECTION = /\[dir\s*=|:dir\(|:lang\(|\[lang\s*=/i;

// ── Parsing ──────────────────────────────────────────────────────────────────

/// (Exported for the unit tests.) Every qualified rule of a sheet, in order, each with the at-rules around it.
export function parseSheet(text) {
  /** @type {{ rules: { selector: string, ctx: string[], declarations: { property: string, value: string, important: boolean }[] }[], keyframes: { prelude: string, ctx: string[], steps: { selector: string, declarations: { property: string, value: string, important: boolean }[] }[] }[], unparsed: number }} */
  const sheet = { rules: [], keyframes: [], unparsed: 0 };
  walk(text.replace(/\/\*[\s\S]*?\*\//g, ""), 0, undefined, []);
  return sheet;

  function walk(s, start, stop, ctx) {
    const end = stop ?? s.length;
    let i = start;
    while (i < end) {
      while (i < end && /\s/.test(s[i])) i++;
      if (i >= end) break;
      let j = i;
      for (let depth = 0; j < end; j++) {
        const c = s[j];
        if (c === "(") depth++;
        else if (c === ")") depth--;
        else if (depth === 0 && (c === "{" || c === ";")) break;
      }
      // One line whatever the delivered sheet's own line endings are, so the
      // built file is the same on every machine.
      const prelude = s.slice(i, j).trim().replace(/\s+/g, " ");
      if (j >= end || s[j] === ";") {
        i = j + 1;
        continue;
      }
      let k = j + 1;
      for (let depth = 1; k < end && depth > 0; k++) {
        if (s[k] === "{") depth++;
        else if (s[k] === "}") depth--;
      }
      const body = s.slice(j + 1, k - 1);
      i = k;
      const at = /^@([a-z-]+)/i.exec(prelude);
      if (!at) {
        sheet.rules.push({ selector: prelude, declarations: parseDeclarations(body, sheet), ctx });
        continue;
      }
      const name = at[1].toLowerCase().replace(/^-webkit-/, "");
      if (["media", "supports", "container", "layer", "scope"].includes(name)) {
        walk(body, 0, body.length, [...ctx, prelude.replace(/\s+/g, " ")]);
      } else if (name === "keyframes") {
        sheet.keyframes.push({ prelude: prelude.replace(/\s+/g, " "), ctx, steps: parseSteps(body, sheet) });
      }
    }
  }

  function parseSteps(body, sheet) {
    const steps = [];
    for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      steps.push({ selector: m[1].trim().replace(/\s+/g, " "), declarations: parseDeclarations(m[2], sheet) });
    }
    return steps;
  }
}

function parseDeclarations(body, sheet) {
  const out = [];
  let start = 0;
  for (let i = 0, depth = 0, quote = null; i <= body.length; i++) {
    const c = body[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if ((c === ";" && depth === 0) || i === body.length) {
      const text = body.slice(start, i).trim();
      start = i + 1;
      const m = /^([-\w]+)\s*:\s*([\s\S]*?)\s*(!important)?$/i.exec(text);
      if (m) out.push({ property: m[1], value: m[2].replace(/\s+/g, " "), important: Boolean(m[3]) });
      else if (text) sheet.unparsed++;
    }
  }
  return out;
}

// ── Values ───────────────────────────────────────────────────────────────────

/// Splits `value` where `sep` matches one character outside parentheses and
/// quotes. Whitespace separators may repeat.
function splitTop(value, sep) {
  const parts = [];
  let depth = 0, quote = null, current = "";
  const flush = () => {
    if (current.trim()) parts.push(current.trim());
    current = "";
  };
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) {
      current += c;
      if (c === quote && value[i - 1] !== "\\") quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
      current += c;
    } else if (c === "(") {
      depth++;
      current += c;
    } else if (c === ")") {
      depth--;
      current += c;
    } else if (depth === 0 && sep.test(c)) flush();
    else current += c;
  }
  flush();
  return parts;
}

const LENGTH = /^(?:-?[\d.]+(?:[a-z%]+)?|calc\(.*\)|var\(.*\))$/;
const KEYWORD = /^(?:inset|inherit|initial|unset|revert|none|currentcolor)$/i;

/// The mirror image of a horizontal distance or angle, or null.
function negate(term) {
  const t = term.trim();
  if (/^-?0(?:\.0+)?(?:[a-z%]+)?$/.test(t)) return t.replace(/^-/, "");
  if (t.startsWith("-")) return t.slice(1);
  if (/^[+.]?\d/.test(t)) return `-${t.replace(/^\+/, "")}`;
  if (/^calc\(.*\)$/.test(t)) return `calc((${t.slice(5, -1).trim()}) * -1)`;
  if (/^var\(.*\)$/.test(t)) return `calc(-1 * ${t})`;
  return null;
}

/// `top right bottom left` as seen in a mirror. One to three values set both
/// sides alike and have no side to mirror.
function mirrorSides(value) {
  const t = splitTop(value, /\s/);
  if (t.length !== 4) return null;
  return [t[0], t[3], t[2], t[1]].join(" ");
}

/// The four corners, each group around a slash.
function mirrorRadius(value) {
  const groups = splitTop(value, /\//).map((group) => {
    const t = splitTop(group, /\s/);
    if (t.length === 2) return [t[1], t[0]];
    if (t.length === 3) return [t[1], t[0], t[2]];
    if (t.length === 4) return [t[1], t[0], t[3], t[2]];
    return [group];
  });
  const out = groups.map((g) => g.join(" ")).join(" / ");
  return out !== value ? out : null;
}

/// Every function of a transform, mirrored about the vertical axis.
function mirrorTransform(value, review) {
  let any = false;
  const out = value.replace(/([a-z0-9]+)\(((?:[^()]|\([^()]*\))*)\)/gi, (whole, name, args) => {
    const fn = name.toLowerCase();
    const a = splitTop(args, /[\s,]/);
    // Index of the horizontal part, and whether it may be any value at all.
    const slot = { translate: [0, 1, 2], translate3d: [0, 3, 3], translatex: [0, 1, 1], rotate: [0, 1, 1], rotatez: [0, 1, 1], skew: [0, 1, 2], skewx: [0, 1, 1] }[fn];
    if (slot && a.length >= slot[1] && a.length <= slot[2]) {
      const n = negate(a[0]);
      if (n === null) {
        review.push(`${whole}: its horizontal part cannot be read`);
        return whole;
      }
      if (n !== a[0]) any = true;
      a[0] = n;
    } else if (fn === "rotate3d" && a.length === 4 && a[0] === "0" && a[1] === "0") {
      const n = negate(a[3]);
      if (n === null) return whole;
      if (n !== a[3]) any = true;
      a[3] = n;
    } else if ((fn === "scale" || fn === "scalex") && a.length >= 1 && /^-\d|^-\.|^calc\(-1 \*/.test(a[0])) {
      // A flip in the delivered sheet is, in a mirror, no flip.
      a[0] = a[0].replace(/^-(?=\d)|^-(?=\.)/, "").replace(/^calc\(-1 \* (.*)\)$/, "$1");
      any = true;
    } else if (fn === "matrix" || fn === "matrix3d") {
      review.push(`${whole}: a matrix is not mirrored`);
    }
    return `${name}(${a.join(", ")})`;
  });
  if (!any && /\bscalex?\(\s*var\(/i.test(value)) review.push(`${value}: a scale from a variable is not mirrored`);
  return any ? out : null;
}

/// The horizontal offset of each shadow of a list.
function mirrorShadow(value, review) {
  let any = false;
  const out = splitTop(value, /,/).map((shadow) => {
    let x = true;
    return splitTop(shadow, /\s/).map((token) => {
      if (x && LENGTH.test(token) && !KEYWORD.test(token)) {
        x = false;
        const n = negate(token);
        if (n === null) {
          review.push(`${value}: its horizontal offset cannot be read`);
          return token;
        }
        if (n !== token) any = true;
        return n;
      }
      return token;
    }).join(" ");
  });
  return any ? out.join(", ") : null;
}

/// `left|center|right|<x> [top|center|bottom|<y>]` (either order) as seen in a mirror.
function mirrorOrigin(value) {
  const t = splitTop(value, /\s/);
  // A distance from the left edge is the same distance from the right edge.
  const flipX = (token) => {
    const k = token.toLowerCase();
    if (k === "left") return "right";
    if (k === "right") return "left";
    if (/^-?0(?:[a-z%]+)?$/.test(token)) return "100%";
    const percent = /^([\d.]+)%$/.exec(token);
    if (percent) return parseFloat(percent[1]) === 50 ? null : `${100 - parseFloat(percent[1])}%`;
    return `calc(100% - (${token}))`;
  };
  if (t.length === 1) {
    const x = flipX(t[0]);
    return x && x !== t[0] ? x : null;
  }
  if (/^(top|bottom)$/i.test(t[0])) {
    const x = flipX(t[1]);
    return x ? [t[0], x].join(" ") : null;
  }
  const x = flipX(t[0]);
  return x && x !== t[0] ? [x, ...t.slice(1)].join(" ") : null;
}

// ── Mirroring declarations ───────────────────────────────────────────────────

/// A property that names one side: its mirror, the shorthand that already
/// sets both sides (the side left behind then needs no reset) and what that
/// side goes back to.
const SIDE = {};
for (const [, reset, shorthands, pairs] of [
  ["inset", "auto", ["inset"], [["left", "right"]]],
  ["margin", "0", ["margin"], [["margin-left", "margin-right"]]],
  ["padding", "0", ["padding"], [["padding-left", "padding-right"]]],
  ["scroll-margin", "0", ["scroll-margin"], [["scroll-margin-left", "scroll-margin-right"]]],
  ["scroll-padding", "0", ["scroll-padding"], [["scroll-padding-left", "scroll-padding-right"]]],
  ["border", "0", ["border"], [["border-left", "border-right"]]],
  ["border-width", "0", ["border", "border-width"], [["border-left-width", "border-right-width"]]],
  ["border-style", "none", ["border", "border-style"], [["border-left-style", "border-right-style"]]],
  ["border-color", "currentcolor", ["border", "border-color"], [["border-left-color", "border-right-color"]]],
  ["border-radius", "0", ["border-radius"], [
    ["border-top-left-radius", "border-top-right-radius"],
    ["border-bottom-left-radius", "border-bottom-right-radius"],
  ]],
]) {
  for (const [a, b] of pairs) {
    SIDE[a] = { to: b, reset, shorthands };
    SIDE[b] = { to: a, reset, shorthands };
  }
}
const FOUR_SIDES = new Set(["margin", "padding", "inset", "border-width", "border-style", "border-color", "scroll-margin", "scroll-padding"]);
/// Whether a property sets a side. Every such declaration is written again,
/// mirrored or as it was, so a rule that cancels a side in English still
/// cancels it in Arabic.
///
/// The set is closed. Every property that a shorthand here also sets is here
/// too (inset sets top and bottom, border sets all four sides and the border
/// image), and so is every property that sets one of them (margin-block sets
/// margin-top). Otherwise a shorthand written again would out-rank a later
/// rule that only cancels its top or its bottom: on the legal pages the hero
/// block's later "top: auto" lost to a repeated "inset: 0", and the title
/// ended up behind the header.
const BOX = ["margin", "padding", "scroll-margin", "scroll-padding", "inset", "border"];
const SETS_A_SIDE = new RegExp(`^(?:${[
  ...BOX.map((box) => `${box}-(?:top|right|bottom|left)`),
  ...BOX,
  "border-(?:width|style|color)",
  "border-image(?:-[a-z-]+)?",
  "border-radius",
  "border-(?:top|bottom)-(?:left|right)-radius",
  "border-(?:start|end)-(?:start|end)-radius",
  ...BOX.map((box) => `${box}-(?:inline|block)(?:-(?:start|end))?`),
  "top", "right", "bottom", "left", "float", "clear", "text-align",
  "transform", "transform-origin", "perspective-origin", "translate", "rotate", "scale", "box-shadow", "text-shadow", "clip-path",
].join("|")})$`);

/// What one declaration becomes in the mirror: `mirrored` replaces it, or
/// `symmetric` is the declaration as written when it has no side to mirror
/// but sets one, and `reset` puts back the side the delivered one still sets.
export function mirrorDeclaration(d, present, review) {
  const p = d.property.toLowerCase();
  const tail = d.important ? " !important" : "";
  const make = (property, value) => `${property}:${value}${tail}`;
  const unchanged = { mirrored: null, symmetric: null, reset: null };
  if (p.startsWith("--")) return unchanged;
  const asWritten = make(p, d.value);
  const flip = (value) => (value ? { mirrored: [make(p, value)], symmetric: null, reset: null } : { ...unchanged, symmetric: asWritten });

  if (SIDE[p]) {
    const side = SIDE[p];
    // The delivered rule still sets the side it named: put it back to nothing,
    // unless something in the same rule already sets both.
    const reset = !present.has(side.to) && !side.shorthands.some((s) => present.has(s)) ? make(p, side.reset) : null;
    return { mirrored: [make(side.to, d.value)], symmetric: null, reset };
  }
  if (FOUR_SIDES.has(p)) return flip(mirrorSides(d.value));
  if (p === "border-radius") return flip(mirrorRadius(d.value));
  if (p === "text-align" || p === "float" || p === "clear") {
    const k = d.value.toLowerCase();
    return k === "left" || k === "right" ? flip(k === "left" ? "right" : "left") : { ...unchanged, symmetric: asWritten };
  }
  if (p === "transform" || p === "translate" || p === "rotate") {
    // The single-value transform properties are written as a function, mirrored
    // as one, and written back without the function.
    const v = mirrorTransform(p === "transform" ? d.value : `${p}(${d.value})`, review);
    return flip(v && p === "transform" ? v : v && v.slice(p.length + 1, -1));
  }
  if (p === "scale") {
    const t = splitTop(d.value, /\s/);
    if (t.length >= 2 && /^-\d|^-\.|^calc\(-1 \*/.test(t[0])) return flip([t[0].replace(/^-(?=\d)|^-(?=\.)/, ""), ...t.slice(1)].join(" "));
    return { ...unchanged, symmetric: asWritten };
  }
  if (p === "box-shadow" || p === "text-shadow") return flip(mirrorShadow(d.value, review));
  if (p === "transform-origin" || p === "perspective-origin") return flip(mirrorOrigin(d.value));
  // A wipe that uncovers from one side (inset(top right bottom left)) uncovers
  // from the other.
  if (p === "clip-path") {
    const inset = /^inset\(([\s\S]+)\)$/.exec(d.value);
    const t = inset ? splitTop(inset[1], /\s/) : [];
    const round = t.indexOf("round");
    const box = round < 0 ? t : t.slice(0, round);
    return flip(box.length === 4 ? `inset(${[box[0], box[3], box[2], box[1]].join(" ")}${round < 0 ? "" : ` ${t.slice(round).join(" ")}`})` : null);
  }
  // Anything else that sets a side is written again as it was.
  if (SETS_A_SIDE.test(p)) return { ...unchanged, symmetric: asWritten };
  return unchanged;
}

/// A rule, or a keyframe step, as the mirror writes it: `emitted` in source
/// order, with each mirrored declaration in place of the one it mirrors and
/// every other declaration that sets a side written again as it was (when
/// `whole` is set, every declaration, as a keyframe is redefined whole);
/// `resets` apart, and `mirrored` how many declarations changed.
function mirrorInto(declarations, review, whole) {
  const present = new Set(declarations.map((d) => d.property.toLowerCase()));
  const out = { emitted: [], resets: [], mirrored: 0 };
  for (const d of declarations) {
    if (!d.property) continue;
    const asWritten = `${d.property}:${d.value}${d.important ? " !important" : ""}`;
    const { mirrored, symmetric, reset } = mirrorDeclaration(d, present, review);
    if (reset) out.resets.push(reset);
    if (mirrored) {
      out.emitted.push(...mirrored);
      out.mirrored += mirrored.length;
    } else if (symmetric) out.emitted.push(symmetric);
    else if (whole) out.emitted.push(asWritten);
  }
  return out;
}

/// (Exported for the unit tests.) One rule as the mirror writes it, its resets
/// first.
export function mirrorAll(declarations, review) {
  const { emitted, resets } = mirrorInto(declarations, review, false);
  return [...resets, ...emitted];
}

/// The same selector, with the same weight, on a right-to-left page only.
/// :where() adds no weight, so the copy wins by coming later, never by rank.
function scope(selector) {
  return splitTop(selector, /,/).map((part) => {
    if (/^:root(?![\w-])/.test(part)) return `:root:where(${RTL})${part.slice(5)}`;
    if (/^html(?![\w-])/.test(part)) return `html:where([dir="rtl"])${part.slice(4)}`;
    return `:where(${RTL}) ${part}`;
  }).join(",");
}

// ── Building ─────────────────────────────────────────────────────────────────

const RTL = 'html[dir="rtl"]';

const HEADER = [
  "/* ── Right-to-left layout ───────────────────────────────────────────────────",
  "   GENERATED by scripts/build-rtl-css.mjs. Do not edit the generated part:",
  "   change the script, or scripts/rtl-manual.css, and run",
  "",
  "       node scripts/build-rtl-css.mjs",
  "",
  "   This is the public stylesheets with every physical left and right mirrored,",
  "   every rule limited to a page marked dir=\"rtl\" and keeping the weight of the",
  "   rule it mirrors (it wins by coming last, never by rank). The root layout",
  "   links it on Arabic pages only, after every other stylesheet; English and",
  "   Japanese pages never request it. The delivered site.css is not touched. */",
  "",
];
const banner = (text) => `/* ── ${text} ${"─".repeat(Math.max(3, 76 - text.length))} */`;

/// Mirrors whole sheets. `sources` are [name, css] in cascade order; `manual`
/// is appended after them, as written.
export function mirrorSheets(sources, manual) {
  const review = [];
  const counts = [];
  const lines = [...HEADER];
  let open = [];

  const closeAll = () => {
    if (open.length) lines[lines.length - 1] += "}".repeat(open.length);
    open = [];
  };
  /// Opens the at-rules around what comes next, closing those that end.
  const enter = (ctx) => {
    let same = 0;
    while (same < ctx.length && same < open.length && ctx[same] === open[same]) same++;
    if (open.length > same) lines[lines.length - 1] += "}".repeat(open.length - same);
    for (let i = same; i < ctx.length; i++) lines.push(`${ctx[i]}{`);
    open = ctx;
  };
  const write = (ctx, selector, declarations) => {
    enter(ctx);
    lines.push(`${scope(selector)}{${declarations.join(";")}}`);
  };

  for (const [name, css] of sources) {
    const sheet = parseSheet(css);
    const before = lines.length;
    lines.push(banner(`resets: ${name}`));
    const rules = [];
    const resets = new Map();
    let own = 0;
    for (const rule of sheet.rules) {
      if (OWN_DIRECTION.test(rule.selector)) {
        own++;
        continue;
      }
      const { emitted, resets: list } = mirrorInto(rule.declarations, review, false);
      if (list.length) resets.set(rule, list);
      if (emitted.length) rules.push({ rule, emitted });
    }

    for (const [rule, list] of resets) write(rule.ctx, rule.selector, list);
    closeAll();
    lines.push(banner(name));
    for (const { rule, emitted } of rules) write(rule.ctx, rule.selector, emitted);
    for (const frame of sheet.keyframes) {
      // A keyframe is redefined whole, or its other steps would be lost.
      const steps = frame.steps.map((step) => ({ step, ...mirrorInto(step.declarations, review, true) }));
      if (!steps.some((s) => s.mirrored)) continue;
      enter(frame.ctx);
      lines.push(`${frame.prelude}{${steps.map((s) => `${s.step.selector}{${s.emitted.join(";")}}`).join("")}}`);
    }
    closeAll();
    if (sheet.unparsed) review.push(`${name}: ${sheet.unparsed} declaration(s) could not be read`);
    counts.push([name, lines.length - before - 2, own]);
  }

  lines.push(banner("Written by hand: scripts/rtl-manual.css"));
  lines.push(manual.trim());
  lines.push("");
  return { css: lines.join("\n"), review, counts };
}

export function build() {
  return mirrorSheets(
    SOURCES.map(([name, file]) => [name, readFileSync(join(ROOT, file), "utf8")]),
    readFileSync(join(ROOT, MANUAL), "utf8"),
  );
}

function main() {
  const args = new Set(process.argv.slice(2));
  const { css, review, counts } = build();
  if (args.has("--report")) {
    for (const [name, n, own] of counts) console.log(`${name.padEnd(30)} ${String(n).padStart(5)} lines${own ? `, ${own} rule(s) left to their own direction` : ""}`);
    console.log(`review list: ${review.length}`);
    for (const line of review) console.log("  " + line);
  }
  if (args.has("--check")) {
    const current = readFileSync(join(ROOT, OUTPUT), "utf8").replace(/\r\n/g, "\n");
    if (current !== css) {
      console.log(`${OUTPUT} is out of date: run node scripts/build-rtl-css.mjs`);
      process.exit(1);
    }
    console.log(`${OUTPUT} is up to date`);
    return;
  }
  writeFileSync(join(ROOT, OUTPUT), css);
  console.log(`wrote ${OUTPUT}: ${css.length.toLocaleString()} bytes`);
}

if (process.argv[1] && join(process.argv[1]) === fileURLToPath(import.meta.url)) main();
