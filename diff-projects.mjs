import { readFileSync } from "node:fs";
import { join } from "node:path";

const pairs = [
  ["emerald-villa.html", "https://kpd-eight.vercel.app/developments/emerald-villa"],
  ["single-project.html", "https://kpd-eight.vercel.app/developments/seven-x-seven"],
  ["dubai-hills-mansion.html", "https://kpd-eight.vercel.app/developments/dubai-hills-mansion"],
];

function mainOf(html) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const start = body.indexOf("<main");
  const end = body.lastIndexOf("</main>");
  return start === -1 ? "(no main)" : body.slice(start, end + "</main>".length);
}

function normalize(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(br|img|input|link|meta|hr|source|embed|track|wbr|area|base|col)\b([^>]*?)\s*\/>/gi, "<$1$2>")
    .replace(/(\s(?:autoplay|muted|playsinline|controls|defer|async|disabled|open|hidden|itemscope|loop|multiple|novalidate|readonly|required|selected|default|inert))=""/gi, "$1")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/(\s[a-zA-Z-:_]+)=""/g, "$1")
    .replace(/(\sdata-[a-zA-Z-:]+)="true"/g, "$1")
    .replace(/style="([^"]*)"/gi, (_m, css) => `style="${css.replace(/\s*:\s*/g, ":").replace(/\s*;\s*/g, ";").replace(/;$/, "")}"`)
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .replace(/>\s/g, ">")
    .replace(/\s</g, "<")
    .trim();
}

/// Split a normalized main into top-level sections + their headings, for a
/// section-by-section structural comparison.
function sectionOutline(main) {
  const parts = main.split(/(?=<section\b)/g).filter((p) => p.startsWith("<section") || !p.startsWith("<"));
  return parts.map((part) => {
    const cls = part.match(/<section[^>]*class="([^"]*)"/)?.[1] ?? "(no class)";
    const label = part.match(/aria-label="([^"]*)"/)?.[1] ?? "";
    const h2 = part.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "";
    const h3s = [...part.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => m[1]).slice(0, 6).join(" | ");
    return { cls, label, h2, h3s, length: part.length };
  });
}

for (const [file, url] of pairs) {
  console.log(`\n=========== ${file} vs ${url} ===========`);
  const doc = readFileSync(join(process.cwd(), "public", "legacy", file), "utf8");
  const routes = { "index.html#top": "/#top", "single-project.html": "/developments/seven-x-seven", "emerald-villa.html": "/developments/emerald-villa", "dubai-hills-mansion.html": "/developments/dubai-hills-mansion", "about-us.html": "/about", "legacy.html": "/legacy", "news.html": "/news", "invest-in-dubai.html": "/invest-in-dubai", "contact.html": "/contact", "terms.html": "/terms", "privacy-policy.html": "/privacy-policy", "cookie-policy.html": "/cookie-policy" };
  let deliveredMain = mainOf(doc).replace(/\b(src|href|poster|data-lightbox-src|data-image)="assets\//g, '$1="/legacy/assets/');
  for (const [from, to] of Object.entries(routes)) deliveredMain = deliveredMain.replaceAll(`href="${from}`, `href="${to}`);

  const res = await fetch(url);
  const live = await res.text();
  const a = normalize(deliveredMain);
  const b = normalize(mainOf(live));
  console.log(`delivered main: ${a.length} chars | live main: ${b.length} chars`);

  const outlineA = sectionOutline(a);
  const outlineB = sectionOutline(b);
  console.log(`\n--- delivered sections (${outlineA.length}) vs live sections (${outlineB.length}) ---`);
  const max = Math.max(outlineA.length, outlineB.length);
  for (let i = 0; i < max; i += 1) {
    const x = outlineA[i];
    const y = outlineB[i];
    const mark = !x || !y ? "!!!" : x.cls === y.cls ? "   " : "!!!";
    console.log(`${mark} [${i}]`);
    if (x) console.log(`    D: ${x.cls} | h2="${x.h2}" | h3: ${x.h3s} | ${x.length}ch`);
    if (y) console.log(`    L: ${y.cls} | h2="${y.h2}" | h3: ${y.h3s} | ${y.length}ch`);
    if (!x || !y) console.log(`    ^^^ section count mismatch`);
  }

  if (a === b) { console.log("EXACT MATCH"); continue; }
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA -= 1; endB -= 1; }
  console.log(`\nfirst divergence at ${start} (suffix common: ${a.length - endA}):`);
  console.log(`DELIVERED >>${a.slice(start, Math.min(endA, start + 700))}<<`);
  console.log(`LIVE      >>${b.slice(start, Math.min(endB, start + 700))}<<`);
}
