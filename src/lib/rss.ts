// RSS moderation pipeline — server-side replacement for the client-side
// live-news.js feed fetching. A Vercel Cron job hits /api/cron/rss-ingest,
// which normalizes + dedupes matches into the RssItem table (status PENDING).
// Editors approve or reject items in the admin; approval creates an Article.

const keywordLabels = [
  "Kasumigaseki",
  "Kasumigaseki Dubai",
  "Kasumigaseki Capital",
  "SevenXSeven",
  "FAV",
  "Fork and Knife Hotel",
];

const matchTerms = [
  "kasumigaseki",
  "kasumigaseki dubai",
  "kasumigaseki capital",
  "kasumigaseki restaurant",
  "sevenxseven",
  "seven x seven",
  "fav hotel",
  "fork and knife hotel",
  "fork & knife hotel",
];

function normalize(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^\p{L}\p{N}&]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesKeywords(title: string, snippet?: string | null) {
  const haystack = `${normalize(title)} ${normalize(snippet)}`;
  return matchTerms.some((term) => haystack.includes(term));
}

function buildGoogleFeedUrl() {
  const query = keywordLabels.map((k) => `"${k}"`).join(" OR ");
  const params = new URLSearchParams({ q: query, hl: "en-US", gl: "US", ceid: "US:en" });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function buildGdeltUrl() {
  const query = keywordLabels.map((k) => `"${k}"`).join(" OR ");
  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    format: "json",
    maxrecords: "75",
    sort: "DateDesc",
  });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

type Candidate = {
  source: string;
  title: string;
  url: string;
  snippet?: string | null;
  imageUrl?: string | null;
  publishedAt?: Date | null;
};

async function fetchGoogleNews(): Promise<Candidate[]> {
  const res = await fetch(buildGoogleFeedUrl(), { cache: "no-store" });
  if (!res.ok) return [];
  const xml = await res.text();
  const items: Candidate[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const pick = (tag: string) => {
      const t = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
      return t ? t[1].trim() : "";
    };
    const title = pick("title").replace(/<!\[CDATA\[|\]\]>/g, "");
    const link = pick("link");
    const pub = pick("pubDate");
    if (title && link) {
      items.push({
        source: "google-news",
        title,
        url: link,
        snippet: pick("description").replace(/<!\[CDATA\[|\]\]>/g, "").slice(0, 500),
        publishedAt: pub ? new Date(pub) : null,
      });
    }
  }
  return items;
}

async function fetchGdelt(): Promise<Candidate[]> {
  const res = await fetch(buildGdeltUrl(), { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    articles?: { title: string; url: string; seendate?: string; socialimage?: string }[];
  };
  return (data.articles || []).map((a) => ({
    source: "gdelt",
    title: a.title,
    url: a.url,
    imageUrl: a.socialimage || null,
    publishedAt: a.seendate ? parseGdeltDate(a.seendate) : null,
  }));
}

function parseGdeltDate(seen: string) {
  // Format: 20260907T053000Z
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(seen);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : null;
}

export type IngestResult = { inserted: number; considered: number };

export async function ingestFeeds(): Promise<IngestResult> {
  const { db } = await import("./db");
  const batches = await Promise.allSettled([fetchGoogleNews(), fetchGdelt()]);
  const candidates = batches.flatMap((b) => (b.status === "fulfilled" ? b.value : []));

  let inserted = 0;
  for (const c of candidates) {
    if (!matchesKeywords(c.title, c.snippet)) continue;
    const existing = await db.rssItem.findUnique({ where: { url: c.url } });
    if (existing) continue;
    try {
      await db.rssItem.create({
        data: {
          source: c.source,
          title: c.title,
          url: c.url,
          snippet: c.snippet || null,
          imageUrl: c.imageUrl || null,
          publishedAt: c.publishedAt || null,
        },
      });
      inserted += 1;
    } catch {
      // unique-constraint race — safe to ignore
    }
  }
  return { inserted, considered: candidates.length };
}
