import { readFileSync } from "node:fs";
import { join } from "node:path";

const tmp = process.env.TEMP;
const routes = {
  "index.html#top": "/#top", "single-project.html": "/developments/seven-x-seven", "emerald-villa.html": "/developments/emerald-villa", "dubai-hills-mansion.html": "/developments/dubai-hills-mansion", "about-us.html": "/about", "legacy.html": "/legacy", "news.html": "/news", "invest-in-dubai.html": "/invest-in-dubai", "contact.html": "/contact", "terms.html": "/terms", "privacy-policy.html": "/privacy-policy", "cookie-policy.html": "/cookie-policy",
};

function load(name) {
  return readFileSync(join(tmp, name), "utf8");
}

function clean(html) {
  const lower = html.toLowerCase();
  const bodyOpen = html.indexOf(">", lower.indexOf("<body")) + 1;
  const bodyEnd = lower.lastIndexOf("</body>");
  let body = bodyOpen > 0 && bodyEnd > bodyOpen ? html.slice(bodyOpen, bodyEnd) : html;
  // Strip <script>...</script>, <!-- ... -->, and <template>...</template>.
  let out = "";
  let rest = body;
  for (;;) {
    const next = rest.search(/<(script|template|!--)/i);
    if (next === -1) { out += rest; break; }
    out += rest.slice(0, next);
    rest = rest.slice(next);
    if (rest.startsWith("<!--")) {
      const end = rest.indexOf("-->");
      if (end === -1) break;
      rest = rest.slice(end + 3);
    } else {
      const tag = rest.slice(1, rest.search(/[> ]/)).toLowerCase();
      const closer = "</" + tag + ">";
      const end = rest.toLowerCase().indexOf(closer);
      if (end === -1) break;
      rest = rest.slice(end + closer.length);
    }
  }
  return out;
}

function canonicalizeTags(html) {
  // HTML attribute order and case are not semantic; sort attributes within
  // each tag so React's serialization order never masks real DOM differences.
  return html.replace(/<[a-zA-Z][^>]*>/g, (tag) => {
    if (tag.startsWith("<!--")) return tag;
    const close = tag.endsWith("/>");
    const inner = tag.slice(1, close ? -2 : -1);
    const spaceAt = inner.search(/[ \t]/);
    if (spaceAt === -1) return tag;
    const name = inner.slice(0, spaceAt);
        const attrs = (inner.slice(spaceAt).match(/[^\s=]+(?:=\"[^\"]*)?/g) || []).map((a) => a.replace(/^([^=]+)/, (m) => m.toLowerCase()));
    attrs.sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
    return "<" + name + (attrs.length ? " " + attrs.join(" ") : "") + (close ? " />" : ">");
  });
}

function normalize(html) {
  html = html
    .replace(/<!-- -->/g, "")
    .replace(/\sclass=""/g, "")
    .replace(/(<input[^>]*?)\sid="([^"]*)"(\sname="[^"]*")/g, '$1$3 id="$2"')
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
  return canonicalizeTags(html).trim();
}

/// Delivered side: main region of the legacy file, with asset paths rewritten
/// the same way the shell pipeline does and links routed.
function deliveredMain(file) {
  const doc = readFileSync(join(process.cwd(), "public", "legacy", file), "utf8");
  const body = doc.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
  let html = body.slice(body.indexOf("<main"), body.indexOf("</main>") + "</main>".length);
  html = html.replace(/\b(src|href|poster)="assets\//g, '$1="/legacy/assets/');
  for (const [from, to] of Object.entries(routes)) html = html.replaceAll(`href="${from}`, `href="${to}`);
  // Expected content deviations (documented): production serves CMS-managed
  // contact details (the kpd.ae set the client confirmed) instead of the
  // placeholder kpd.com values baked into the delivered file, and the form
  // submits to /api/contact instead of the delivered mailto action. Normalize
  // the delivered side to those so only unexpected diffs surface.
  html = html.replaceAll("+971 48 567 891", "+971 4 388 3099").replaceAll("tel:+97148567891", "tel:+97143883099");
  html = html.replaceAll("info@kpd.com", "info@kpd.ae").replaceAll("https://kpd.com", "https://kpd.ae").replaceAll("\">kpd.com<", "\">kpd.ae<");
  html = html.replace(/ action="mailto:[^"]*" method="post" enctype="multipart\/form-data"/, "");
  return normalize(html);
}

/// Rendered side: main region of the captured page (wrapper divs stripped).
function renderedMain(name) {
  const body = clean(load(name));
  const start = body.search(/<main\b/i);
  const end = body.toLowerCase().lastIndexOf("</main>");
  return normalize(body.slice(start, end + "</main>".length));
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
  console.log(`  ${label}: DIFFERS (delivered ${a.length} chars vs rendered ${b.length} chars, common prefix ${start})`);
  console.log(`    DELIVERED >>${a.slice(start, Math.min(endA, start + 400))}<<`);
  console.log(`    RENDERED  >>${b.slice(start, Math.min(endB, start + 400))}<<`);
  return 1;
}

let failures = 0;
for (const [route, file] of [["contact", "contact.html"], ["invest-in-dubai", "invest-in-dubai.html"]]) {
  console.log(`\n=== /${route} ===`);
  failures += firstDifferences(deliveredMain(file), renderedMain(`new-${route}.html`), "main");
}
console.log(`\n${failures === 0 ? "MAIN REGIONS MATCH" : `${failures} region(s) differ`}`);
