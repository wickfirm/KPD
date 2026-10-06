"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/// Restores the approved News design behaviour: All / News / Blogs filter
/// tabs, the live-feed status bar with a working "Refresh Feed" control, and
/// the news + blog card grids. Data comes from the CMS database (published
/// articles) through the server page; refresh re-reads /api/articles.
export type NewsCard = {
  slug: string;
  title: string;
  summary: string;
  kind: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
  sourceUrl?: string | null;
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/// Deterministic date formatting shared by server render and hydration.
function formatDate(iso: string | null) {
  if (!iso || iso.length < 10) return "";
  const [year, month, day] = iso.slice(0, 10).split("-");
  const monthName = months[Number(month) - 1];
  return monthName ? `${Number(day)} ${monthName} ${year}` : "";
}

/// Press items (RSS-sourced NEWS) link to the external source in a new tab,
/// matching the delivered live-news.js behaviour. Blog items link internally.
function Card({ article }: { article: NewsCard }) {
  const isPress = article.kind === "NEWS" && article.sourceUrl;
  const content = <>
    {article.coverImage ? <Image src={article.coverImage} alt={article.coverImageAlt || article.title} fill sizes="(max-width: 1024px) 88vw, 31vw" /> : null}
    <div className="kpd-card-content">
      <span className="small-kicker">
        {article.kind === "BLOG" ? "BLOG" : "NEWS"}
        {article.publishedAt ? ` — ${formatDate(article.publishedAt)}` : ""}
      </span>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
      <span className="btn-pill">Read</span>
    </div>
  </>;
  if (isPress) {
    return <a className="news-card-item kpd-news-card live-news-card" href={article.sourceUrl!} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return <Link className="news-card-item kpd-news-card live-news-card" href={`/news/${article.slug}`}>{content}</Link>;
}

type Filter = "all" | "news" | "blog";

export function NewsFeed({ initialNews, initialBlog }: { initialNews: NewsCard[]; initialBlog: NewsCard[] }) {
  const [news, setNews] = useState(initialNews);
  const [blog, setBlog] = useState(initialBlog);
  const [filter, setFilter] = useState<Filter>("news");
  const [status, setStatus] = useState(
    `${initialNews.length} news + ${initialBlog.length} blog updates loaded from the KPD newsroom.`
  );
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const [newsResponse, blogResponse] = await Promise.all([
        fetch("/api/articles?kind=NEWS&limit=9").then((r) => (r.ok ? r.json() : { articles: [] })),
        fetch("/api/articles?kind=BLOG&limit=9").then((r) => (r.ok ? r.json() : { articles: [] })),
      ]);
      const asCards = (rows: unknown): NewsCard[] =>
        Array.isArray(rows)
          ? rows.map((row) => {
              const item = row as Partial<NewsCard>;
              return {
                slug: String(item.slug ?? ""),
                title: String(item.title ?? ""),
                summary: String(item.summary ?? ""),
                kind: String(item.kind ?? "NEWS"),
                coverImage: item.coverImage ?? null,
                coverImageAlt: item.coverImageAlt ?? null,
                publishedAt: item.publishedAt ?? null,
              };
            }).filter((card) => card.slug)
          : [];
      const nextNews = asCards((newsResponse as { articles?: unknown }).articles);
      const nextBlog = asCards((blogResponse as { articles?: unknown }).articles);
      setNews(nextNews);
      setBlog(nextBlog);
      const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      setStatus(`${nextNews.length} news + ${nextBlog.length} blog updates loaded from the KPD newsroom — refreshed ${time}.`);
    } catch {
      setStatus("The feed could not be refreshed right now. Please try again shortly.");
    } finally {
      setRefreshing(false);
    }
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "news", label: "News" },
    { key: "blog", label: "Blogs" },
  ];

  const empty = news.length === 0 && blog.length === 0;

  // Panels are shown/hidden through the delivered stylesheet, which keys off
  // data-media-filter-current on this section (All shows both panels).
  return (
    <section
      className="news-updates kpd-section kpd-section--compact live-news-section media-filter-section"
      id="updates"
      aria-label="News and blogs updates"
      data-live-news-section
      data-media-filter-root
      data-media-filter-current={filter}
    >
      <nav className="media-filter-tabs" aria-label="News and updates filter">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`media-filter-tab${filter === tab.key ? " is-active" : ""}`}
            type="button"
            data-media-filter={tab.key}
            aria-pressed={filter === tab.key}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="news-live-head news-live-head--compact" data-media-filter-panel="news">
        <div className="news-live-controls">
          <span data-live-news-status>{status}</span>
          <button className="btn-pill news-live-refresh" type="button" data-live-news-refresh onClick={refresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh Feed"}
          </button>
        </div>
      </div>

      <div className="media-feed-stack">
        <div className="news-grid live-news-grid" data-media-filter-panel="news">
          {news.map((article) => <Card key={article.slug} article={article} />)}
        </div>
        <div className="news-grid media-blog-grid" data-media-filter-panel="blog">
          {blog.map((article) => <Card key={article.slug} article={article} />)}
        </div>
      </div>

      <div className="live-news-empty" data-live-news-empty hidden={!empty}>
        There are no published updates yet. Please refresh the feed or check back shortly.
      </div>
    </section>
  );
}
