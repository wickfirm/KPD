import { readFileSync } from "node:fs";
import { join } from "node:path";

const tmp = process.env.TEMP;

function load(name) {
  return readFileSync(join(tmp, name), "utf8");
}

/// Extract <body> and strip everything that is not the delivered DOM:
/// scripts (bootstrap + RSC payload), HTML comments, template shadows.
function clean(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<template[\s\S]*?<\/template>/gi, "");
  return body;
}

/// Normalize equivalent-but-differently-serialized markup so only real DOM
/// differences remain: React void-element syntax, boolean attributes,
/// style formatting, entity escapes, React camelCase attribute names, and
/// whitespace between tags.
function normalize(html) {
  return html
    .replace(/<(br|img|input|link|meta|hr|source|embed|track|wbr|area|base|col)\b([^>]*?)\s*\/>/gi, "<$1$2>")
    .replace(/(\s(?:autoplay|muted|playsinline|controls|defer|async|disabled|open|hidden|itemscope|loop|multiple|novalidate|readonly|required|selected|default|inert))=""/gi, "$1")
    .replace(/\sautoPlay\b/gi, " autoplay")
    .replace(/\splaysInline\b/gi, " playsinline")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/(\s[a-zA-Z-:_]+)=""/g, "$1")
    .replace(/(\sdata-[a-zA-Z-:]+)="true"/g, "$1")
    .replace(/style="([^"]*)"/gi, (_m, css) => `style="${css.replace(/\s*:\s*/g, ":").replace(/;\s*$/, "")}"`)
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .replace(/>\s/g, ">")
    .replace(/\s</g, "<")
    .trim();
}

function regions(body) {
  const mainStart = body.search(/<main\b/i);
  const mainEnd = body.toLowerCase().lastIndexOf("</main>");
  if (mainStart === -1 || mainEnd === -1) return { before: body, main: "", after: "" };
  return {
    before: body.slice(0, mainStart),
    main: body.slice(mainStart, mainEnd + "</main>".length),
    after: body.slice(mainEnd + "</main>".length),
  };
}

function firstDifferences(a, b, label) {
  if (a === b) {
    console.log(`  ${label}: EXACT MATCH (${a.length} chars)`);
    return 0;
  }
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA -= 1; endB -= 1; }
  const oldPart = a.slice(start, Math.min(endA, start + 260));
  const newPart = b.slice(start, Math.min(endB, start + 260));
  console.log(`  ${label}: DIFFERS (old ${a.length} chars vs new ${b.length} chars)`);
  console.log(`    common prefix: ${start} chars`);
  console.log(`    OLD >>${oldPart}<<`);
  console.log(`    NEW >>${newPart}<<`);
  return 1;
}

let failures = 0;
for (const page of ["home", "about", "legacy"]) {
  console.log(`\n=== /${page === "home" ? "" : page} ===`);
  const oldRegions = regions(normalize(clean(load(`old-${page}.html`))));
  let newBefore = regions(normalize(clean(load(`new-${page}.html`)))).before;
  const newRegionsRaw = regions(normalize(clean(load(`new-${page}.html`))));
  // The new architecture renders each shell half inside a plain wrapper <div>
  // (dangerouslySetInnerHTML needs an element). Verified: no CSS uses direct-
  // child selectors on these elements, so strip the wrappers and compare 1:1.
  let newAfter = newRegionsRaw.after.replace(/^<div>/, "");
  newBefore = newBefore.replace(/<\/div>$/, "");
  let newMain = newRegionsRaw.main;
  if (page === "home") {
    // The documented homepage architecture: the delivered static tail rides in
    // a wrapper div. Remove the wrapper tags so the DOM inside compares 1:1.
    newMain = newMain
      .replace(/<div class="pdf-static-tail">/i, "")
      .replace(/<\/div>(<\/main>$)/, "$1");
  }

  failures += firstDifferences(oldRegions.before, newBefore, "shell-before-main");
  failures += firstDifferences(oldRegions.main, newMain, "main");
  failures += firstDifferences(oldRegions.after, newAfter, "shell-after-main");
}

console.log(`\n${failures === 0 ? "ALL REGIONS MATCH" : `${failures} region(s) differ`}`);
process.exit(failures === 0 ? 0 : 1);
