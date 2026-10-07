import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

const tmp = process.env.TEMP;
const delivered = readFileSync(join(process.cwd(), "public", "legacy", "news-article.html"), "utf8");
const live = readFileSync(join(tmp, "live-article.html"), "utf8");

// Route + asset rewriting on the delivered side, same as the shell pipeline.
let deliveredMain = mainOf(delivered);
deliveredMain = deliveredMain
  .replace(/\b(src|href|poster)="assets\//g, '$1="/legacy/assets/')
  .replace(/href="news\.html[^"]*"/g, 'href="/news"')
  .replace(/href="contact\.html"/g, 'href="/contact"');
const a0 = normalize(deliveredMain);
// Simulate what the delivered articles.js populates for this exact article
// (design-underwriting-endurance): the seed content matches articles.js, so
// the live page should equal the delivered DOM with these values baked in.
const a = normalize(a0
  .replace(">2026</time>", ">June 10, 2026</time>")
  .replace(">News Article</h1>", ">Design, Underwriting &amp; Endurance Forum</h1>")
  .replace("data-article-summary></p>", "data-article-summary>A closed-room discussion on land logic, delivery discipline, design intent, and how long-horizon value is protected before a project reaches market.</p>")
  .replace(" alt></figure>", ' alt="Dubai financial district and real estate context"></figure>')
  .replace("data-article-body></div>", "data-article-body><p>KPD convened a focused forum around the relationship between design, underwriting, and long-term project relevance. The conversation centered on how early feasibility decisions shape every later layer of a development, from frontage and arrival to operations, maintenance, leasing, and resale confidence.</p><p>The session treated design as a commercial discipline rather than a decorative layer. Participants discussed why enduring residential value depends on a project being clear about its audience, its service logic, its public edges, and the daily routines it supports.</p><p>For KPD, this is where development begins: with the patience to test assumptions, the restraint to avoid unnecessary complexity, and the discipline to make places that remain useful and memorable beyond launch.</p></div>"));
const b = normalize(mainOf(live));

writeFileSync(join(tmp, "delivered-main.txt"), a.split("><").join(">\n<"));
writeFileSync(join(tmp, "live-main.txt"), b.split("><").join("><\n"));

if (a === b) { console.log("EXACT MATCH", a.length); process.exit(0); }
console.log(`DIFFERS: delivered ${a.length} vs live ${b.length}`);
let start = 0;
while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
let endA = a.length, endB = b.length;
while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA -= 1; endB -= 1; }
console.log(`common prefix: ${start}, common suffix: ${a.length - endA}`);
console.log(`DELIVERED >>${a.slice(start, Math.min(endA, start + 900))}<<`);
console.log(`LIVE      >>${b.slice(start, Math.min(endB, start + 900))}<<`);
