/// Delivered-vs-live layout probe for the news section alignment report.
/// Measures the filter tabs + news/blog card grids in a real browser:
///   A) the delivered source of truth (public/legacy/news.html opened from disk)
///   B) production https://kpd-eight.vercel.app/news — including a timeline of
///      the body class, card count, and feed status from first paint to settle.
/// Usage: node verify-news-layout.mjs [url]
import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DELIVERED = "file:///C:/Users/mbonm/OneDrive/Documents/claude/ai.withmb/KPD/public/legacy/news.html";
const LIVE = process.argv[2] || "https://kpd-eight.vercel.app/news";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });

async function snap(page, label) {
  return page.evaluate((label) => {
    const round = (n) => Math.round(n * 10) / 10;
    const section = document.querySelector("#updates");
    const tabs = document.querySelector("#updates .media-filter-tabs");
    if (!section || !tabs) return { label, error: "section/tabs not found" };
    const sr = section.getBoundingClientRect();
    const tr = tabs.getBoundingClientRect();
    const out = {
      label,
      bodyClass: document.body.className || "(empty)",
      section: { left: round(sr.left), width: round(sr.width) },
      tabs: { left: round(tr.left), width: round(tr.width) },
    };
    const measureGrid = (grid) => {
      if (!grid) return null;
      const card = grid.querySelector(".news-card-item");
      if (!card) return { cards: 0 };
      const r = card.getBoundingClientRect();
      const h3 = card.querySelector("h3");
      const cs = h3 ? getComputedStyle(h3) : null;
      return {
        cards: grid.querySelectorAll(".news-card-item").length,
        left: round(r.left),
        width: round(r.width),
        h3FontSize: cs ? cs.fontSize : null,
      };
    };
    const prev = section.getAttribute("data-media-filter-current");
    section.setAttribute("data-media-filter-current", "blog");
    out.blog = measureGrid(document.querySelector("#updates .media-blog-grid"));
    section.setAttribute("data-media-filter-current", "news");
    out.news = measureGrid(document.querySelector("#updates .live-news-grid"));
    section.setAttribute("data-media-filter-current", prev);
    out.status = document.querySelector("[data-live-news-status]")?.textContent || "";
    return out;
  }, label);
}

// A) Delivered source of truth.
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(DELIVERED, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const snapA = await snap(page, "DELIVERED (file://news.html)");
  console.log(JSON.stringify(snapA, null, 2));
  await page.close();
}

// B) Production — timeline from first paint to settled state.
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(LIVE, { waitUntil: "commit" });
  const seen = new Set();
  const t0 = Date.now();
  for (;;) {
    const state = await page.evaluate(() => ({
      bodyClass: document.body.className || "(empty)",
      cards: document.querySelectorAll("#updates .live-news-grid .news-card-item").length,
      status: document.querySelector("[data-live-news-status]")?.textContent || "",
      blogLeft: Math.round(document.querySelector("#updates .media-blog-grid .news-card-item")?.getBoundingClientRect().left ?? -1),
    })).catch(() => null);
    if (state) {
      const key = JSON.stringify(state);
      if (!seen.has(key)) {
        seen.add(key);
        console.log(`t=${Date.now() - t0}ms ${key}`);
      }
    }
    if (Date.now() - t0 > 12000) break;
    await page.waitForTimeout(250);
  }
  const snapPost = await snap(page, "LIVE settled");
  console.log(JSON.stringify(snapPost, null, 2));
  await page.close();
}

await browser.close();
