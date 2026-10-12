// Markup parity check: the client's delivered HTML (public/legacy/*.html) vs a running site.
// Usage: node markup-parity.mjs <base-url>   e.g. https://kpd-eight.vercel.app
// Per page it compares the elements and class names (as a multiset), whether the
// delivered stylesheets load, and the delivered <body> classes. Expected differences:
// CMS-entered content (extra timeline/team items), the cost calculator on development
// pages, the CEO block the client asked us to remove, and Next.js's own hidden <div>.
// Compares, per page: elements+class names (as a multiset), stylesheet files, body classes.
import { readFileSync } from "node:fs";
const base = process.argv[2];
if (!base) { console.error("Usage: node markup-parity.mjs <base-url>"); process.exit(1); }
const root = new URL("./public/legacy/", import.meta.url);
const pairs = [
  ["Homepage", "index.html", "/"], ["About", "about-us.html", "/about"], ["Legacy", "legacy.html", "/legacy"],
  ["Investor guide", "invest-in-dubai.html", "/invest-in-dubai"], ["Contact", "contact.html", "/contact"], ["News", "news.html", "/news"],
  ["Seven X Seven", "single-project.html", "/developments/seven-x-seven"], ["Emerald Villa", "emerald-villa.html", "/developments/emerald-villa"],
  ["Dubai Hills Mansion", "dubai-hills-mansion.html", "/developments/dubai-hills-mansion"],
];
const body = (h) => (h.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, h])[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<template[\s\S]*?<\/template>/gi, "");
const bodyClass = (h) => ((h.match(/<body[^>]*class="([^"]*)"/i) || h.match(/document\.body\.className="([^"]*)"/) || [, ""])[1]).trim().split(/\s+/).filter(Boolean).sort().join(" ");
const tags = (b) => [...b.matchAll(/<([a-z0-9-]+)([^>]*)>/gi)].map((m) => `${m[1].toLowerCase()}.${((m[2].match(/class="([^"]*)"/) || [, ""])[1]).trim().split(/\s+/).filter(Boolean).sort().join(".")}`);
const count = (l) => l.reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map());
const css = (h) => [...h.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]*)"/gi)].map((m) => m[1].split("/").pop().split("?")[0]);
const fetchText = async (url) => { for (let i = 0; i < 4; i++) { try { return await (await fetch(url, { signal: AbortSignal.timeout(60000) })).text(); } catch {} } throw new Error("unreachable " + url); };
for (const [label, file, path] of pairs) {
  const o = readFileSync(new URL(file, root), "utf8");
  const l = await fetchText(base + path);
  const a = count(tags(body(o))), b = count(tags(body(l)));
  const diffs = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) { const d = (b.get(k) || 0) - (a.get(k) || 0); if (d) diffs.push(`${d > 0 ? "+" : ""}${d} ${k.replace(/\.$/, "")}`); }
  const oc = css(o), lc = css(l);
  // His site.css reaches the site through an @import inside the bundled CSS, so look inside the linked sheets too.
  let imported = "";
  for (const m of l.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]*\.css[^"]*)"/gi)) imported += await fetchText(new URL(m[1], base).href).catch(() => "");
  const loaded = (name) => lc.includes(name) || imported.includes(name);
  const sheets = oc.every(loaded) ? "his stylesheets all loaded" : `MISSING ${oc.filter((x) => !loaded(x))}`;
  console.log(`${label.padEnd(20)} body classes ${bodyClass(o) === bodyClass(l) ? "same" : "DIFF"} | ${sheets} | markup diff: ${diffs.length ? diffs.slice(0, 6).join(", ") + (diffs.length > 6 ? ` (+${diffs.length - 6} more)` : "") : "none"}`);
}
