/// Delivered-vs-live DOM comparison for the news listing route (main region).
/// Captures BOTH sides in a real browser (so live-news.js state is symmetric),
/// empties the JS-populated feed + status text on both, applies the same
/// rewrites the shell pipeline does to the delivered file, then diffs the
/// normalized <main> region.
/// Usage: node diff-news.mjs [live-url]   (default http://localhost:3123/news)
import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DELIVERED = "file:///C:/Users/mbonm/OneDrive/Documents/claude/ai.withmb/KPD/public/legacy/news.html";
const LIVE = process.argv[2] || "http://localhost:3123/news";
const routes = {
  "index.html#top": "/#top", "index.html#development-cards": "/#development-cards", "single-project.html": "/developments/seven-x-seven", "emerald-villa.html": "/developments/emerald-villa", "dubai-hills-mansion.html": "/developments/dubai-hills-mansion", "about-us.html": "/about", "legacy.html": "/legacy", "news.html": "/news", "invest-in-dubai.html": "/invest-in-dubai", "contact.html": "/contact", "terms.html": "/terms", "privacy-policy.html": "/privacy-policy", "cookie-policy.html": "/cookie-policy",
};

const browser = await chromium.launch({ executablePath: EDGE, headless: true });

async function captureSettledMain(url, label) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url, { waitUntil: "load" });
  await page
    .waitForFunction(() => {
      const s = document.querySelector("[data-live-news-status]");
      return Boolean(s && /updated|saved|unavailable|No matching|No published/.test(s.textContent || ""));
    }, { timeout: 20000 })
    .catch(() => {});
  const html = await page.evaluate(() => {
    const feed = document.querySelector("[data-live-news-feed]");
    if (feed) feed.innerHTML = "";
    const status = document.querySelector("[data-live-news-status]");
    if (status) status.textContent = "";
    /// The delivered reveal system (site.js/site-cms.js) adds motion-reveal /
    /// is-revealed classes and --motion-delay inline styles at runtime with
    /// timing that differs between environments — strip that presentation
    /// state so only structural DOM is compared.
    document.querySelectorAll(".motion-reveal, .is-revealed").forEach((el) => {
      el.classList.remove("motion-reveal", "is-revealed");
      if (el instanceof HTMLElement) {
        el.style.removeProperty("--motion-delay");
        if (!el.getAttribute("style")) el.removeAttribute("style");
      }
    });
    const main = document.querySelector("main");
    return main ? main.outerHTML : "";
  });
  console.log(`captured ${label}: ${html.length} chars`);
  await page.close();
  return html;
}

const renderedMain = await captureSettledMain(LIVE, "live");
const deliveredRaw = await captureSettledMain(DELIVERED, "delivered");

function rewriteDelivered(html) {
  html = html.replace(/\b(src|href|poster)="assets\//g, '$1="/legacy/assets/');
  for (const [from, to] of Object.entries(routes)) html = html.replaceAll(`href="${from}`, `href="${to}`);
  return html.replace(/(?:blog|news)-article\.html\?article=([a-z0-9-]+)/gi, "/news/$1");
}

function clean(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|template)\b[\s\S]*?<\/\1>/gi, "");
}

function canonicalizeTags(html) {
  return html.replace(/<[a-zA-Z][^>]*>/g, (tag) => {
    const close = tag.endsWith("/>");
    const inner = tag.slice(1, close ? -2 : -1);
    const spaceAt = inner.search(/[ \t]/);
    if (spaceAt === -1) return tag;
    const name = inner.slice(0, spaceAt);
    const attrs = (inner.slice(spaceAt).match(/[^\s=]+(?:="[^"]*)?/g) || []).map((a) => a.replace(/^([^=]+)/, (m) => m.toLowerCase()));
    attrs.sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
    return "<" + name + (attrs.length ? " " + attrs.join(" ") : "") + (close ? " />" : ">");
  });
}

function normalize(html) {
  return canonicalizeTags(
    clean(html)
      .replace(/(<input[^>]*?)\sid="([^"]*)"(\sname="[^"]*")/g, "$1$3 id=\"$2\"")
      .replace(/<(br|img|input|link|meta|hr|source|embed|track|wbr|area|base|col)\b([^>]*?)\s*\/>/gi, "<$1$2>")
      .replace(/(\s(?:autoplay|muted|playsinline|controls|defer|async|disabled|open|hidden|itemscope|loop|multiple|novalidate|readonly|required|selected|default|inert))=""/gi, "$1")
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/(\s[a-zA-Z-:_]+)=""/g, "$1")
      .replace(/(\sdata-[a-zA-Z-:]+)="true"/g, "$1")
      .replace(/>\s+</g, "><")
      .replace(/\s+/g, " ")
      .replace(/>\s/g, ">")
      .replace(/\s</g, "<")
  ).trim();
}

const delivered = normalize(rewriteDelivered(deliveredRaw));
const rendered = normalize(renderedMain);

if (delivered === rendered) {
  console.log(`NEWS MAIN: EXACT MATCH (${delivered.length} chars)`);
} else {
  let start = 0;
  while (start < delivered.length && start < rendered.length && delivered[start] === rendered[start]) start += 1;
  let endA = delivered.length, endB = rendered.length;
  while (endA > start && endB > start && delivered[endA - 1] === rendered[endB - 1]) { endA -= 1; endB -= 1; }
  console.log(`NEWS MAIN: DIFFERS (delivered ${delivered.length} vs rendered ${rendered.length}, common prefix ${start})`);
  console.log(`  DELIVERED >>${delivered.slice(start, Math.min(endA, start + 500))}<<`);
  console.log(`  RENDERED  >>${rendered.slice(start, Math.min(endB, start + 500))}<<`);
  process.exitCode = 1;
}

await browser.close();
