import { readFileSync } from "node:fs";
import { join } from "node:path";

const tmp = process.env.TEMP;

function load(name) {
  return readFileSync(join(tmp, name), "utf8");
}

function clean(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<template[\s\S]*?<\/template>/gi, "");
}

/// Sort attributes inside every tag so declaration-order differences (React
/// JSX order vs delivered source order) do not register as DOM differences.
function sortAttributes(html) {
  return html.replace(/<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)(\/?)>/g, (_match, tag, attrs, slash) => {
    const list = attrs.match(/[a-zA-Z-:]+(="[^"]*")?/g) ?? [];
    return `<${tag}${list.length ? " " + list.sort((a, b) => a.localeCompare(b)).join(" ") : ""}${slash}>`;
  });
}

function normalize(html) {
  return sortAttributes(html
    .replace(/<(br|img|input|link|meta|hr|source|embed|track|wbr|area|base|col|path|circle|rect|line|polyline|polygon|ellipse|use|stop)\b([^>]*?)\s*\/>/gi, "<$1$2>")
    .replace(/(\s(?:autoplay|muted|playsinline|controls|defer|async|disabled|open|hidden|itemscope|loop|multiple|novalidate|readonly|required|selected|default|inert))=""/gi, "$1")
    .replace(/\sautoPlay\b/gi, " autoplay")
    .replace(/\splaysInline\b/gi, " playsinline")
    .replace(/\sencType\b/gi, " enctype")
    .replace(/\smaxLength=/gi, " maxlength=")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&copy;/gi, "©")
    .replace(/(\s[a-zA-Z-:_]+)=""/g, "$1")
    .replace(/(\sdata-[a-zA-Z-:]+)="true"/g, "$1")
    .replace(/style="([^"]*)"/gi, (_m, css) => `style="${css.replace(/\s*:\s*/g, ":").replace(/;\s*$/, "")}"`)
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .replace(/>\s/g, ">")
    .replace(/\s</g, "<")
    .trim())
    // React expands self-closing children (<path/>) to open+close pairs;
    // collapse empty pairs so both serializations compare equal.
    .replace(/<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)><\/\1>/g, "<$1$2>");
}

/// Header + menu panel: from <header to the end of the menu-panel nav.
function headerRegion(body) {
  const start = body.search(/<header class="site-header/);
  const end = body.search(/<\/nav>\s*<\/div>/i); // menu panel close pattern
  const menuEnd = body.toLowerCase().indexOf("</nav>", body.toLowerCase().indexOf('class="menu-panel"'));
  if (start === -1 || menuEnd === -1) return "";
  return body.slice(start, menuEnd + "</nav>".length);
}

/// Footer region.
function footerRegion(body) {
  const start = body.search(/<footer class="section_footer"/i);
  if (start === -1) return "";
  const end = body.indexOf("</footer>", start);
  return body.slice(start, end + "</footer>".length);
}

function firstDifferences(a, b, label) {
  if (a === b) {
    console.log(`  ${label}: EXACT MATCH (${a.length} chars)`);
    return 0;
  }
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endA - 1]) { endA -= 1; endB -= 1; }
  console.log(`  ${label}: DIFFERS (old ${a.length} vs new ${b.length}, prefix ${start})`);
  console.log(`    OLD >>${a.slice(start, Math.min(endA, start + 220))}<<`);
  console.log(`    NEW >>${b.slice(start, Math.min(endB, start + 220))}<<`);
  return 1;
}

let failures = 0;
for (const page of ["home", "about", "legacy"]) {
  console.log(`\n=== ${page}: shell (old delivered-slice vs new React) ===`);
  const oldBody = clean(load(`old-${page}.html`));
  const newBody = clean(load(`new-${page}.html`));
  // OLD pages wrapped the shell in a plain <div>; strip the wrapper boundaries.
  const oldHeader = headerRegion(oldBody);
  const newHeader = headerRegion(newBody);
  const oldFooter = footerRegion(oldBody);
  const newFooter = footerRegion(newBody);
  failures += firstDifferences(normalize(oldHeader), normalize(newHeader), "header+menu");
  failures += firstDifferences(normalize(oldFooter), normalize(newFooter), "footer");
}

console.log(`\n${failures === 0 ? "SHELL MATCHES" : `${failures} region(s) differ`}`);
process.exit(failures === 0 ? 0 : 1);
