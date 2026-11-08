import Link from "next/link";
import { emphasisNodes } from "@/lib/emphasis";
import { newsCaption, type NewsListItem, type NewsListingCopy } from "@/lib/news-listing";
import { NewsFilters } from "./news-filters";

const FALLBACK_IMAGE = "/legacy/assets/images/library/modern-office-glasses-buildings-cityscape-under-bl-2026-03-10-02-05-10-utc.jpg";

/// Category used by the filter tabs: journal pieces are "perspective", news
/// items "announcement" (the client-approved Option 2.1 wording).
const category = (item: NewsListItem) => (item.kind === "BLOG" ? "perspective" : "announcement");

/// The <main> content of /news in the Option 2.1 "Gallery light" layout:
/// breadcrumb hero with filter tabs, the newest article as a feature, the rest
/// as cards (each links to its /news/<slug> page), and a press band. Copy for
/// the hero comes from Site settings → News listing.
export function NewsListingMain({ articles, copy, email }: { articles: NewsListItem[]; copy: NewsListingCopy; email?: string }) {
  const eyebrow = copy.eyebrow?.trim() || "Media";
  const heading = copy.heading?.trim() || "News\n**and updates.**";
  const intro = copy.intro?.trim() ?? "";
  const [feature, ...rest] = articles;
  const hasBoth = articles.some((item) => item.kind === "BLOG") && articles.some((item) => item.kind !== "BLOG");
  return (
    <main className="news-main g21" id="top">
      <section className="g21-hero" aria-labelledby="g21-news-title">
        <div className="g21-wrap">
          <nav className="g21-crumbs g21-cap" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{eyebrow}</span><span aria-hidden="true">/</span><span aria-current="page">News</span></nav>
          <div className="g21-title">
            <h1 id="g21-news-title">{emphasisNodes(heading)}</h1>
            <div>
              {intro ? <p className="g21-lede">{intro}</p> : null}
              {hasBoth ? <NewsFilters /> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="g21-news-sec" id="updates" aria-label="Articles">
        <div className="g21-wrap">
          {feature ? <article className="g21-feat" data-cat={category(feature)}>
            <Link className="g21-feat-img" href={`/news/${feature.slug}`} tabIndex={-1} aria-hidden="true"><img src={feature.coverImage || FALLBACK_IMAGE} alt="" /></Link>
            <div className="g21-feat-copy">
              <p className="g21-cap">{newsCaption(feature)}</p>
              <h2>{feature.title}</h2>
              {feature.summary ? <p className="g21-muted">{feature.summary}</p> : null}
              <Link className="g21-btn" href={`/news/${feature.slug}`}>Read the article <span className="g21-ar" aria-hidden="true">→</span></Link>
            </div>
          </article> : <p className="g21-muted">New articles will appear here soon.</p>}
          {rest.length ? <div className="g21-cards">
            {rest.map((item) => <article className="g21-card" key={item.slug} data-cat={category(item)}>
              <Link href={`/news/${item.slug}`}>
                <figure className="g21-card-img"><img src={item.coverImage || FALLBACK_IMAGE} alt={item.coverImageAlt} loading="lazy" /></figure>
                <span className="g21-cap">{newsCaption(item)}</span>
                <h3>{item.title}</h3>
                {item.summary ? <p className="g21-muted">{item.summary}</p> : null}
                <span className="g21-txt-link">Read <span aria-hidden="true">→</span></span>
              </Link>
            </article>)}
          </div> : null}
          <p className="g21-muted g21-empty" data-news-empty hidden>No articles in this category yet.</p>
        </div>
      </section>

      <section className="g21-pad g21-pad--top-flush" aria-labelledby="g21-press-title">
        <div className="g21-wrap g21-press">
          <div>
            <span className="g21-cap">Press</span>
            <h2 id="g21-press-title">Media enquiries.</h2>
            <p className="g21-muted">For interviews, imagery and statements, contact the KPD media team.</p>
          </div>
          <div className="g21-press-links">
            {email ? <a href={`mailto:${email}`}><span className="g21-cap">Email</span><b>{email}</b><span className="g21-ar" aria-hidden="true">↗</span></a> : null}
            <Link href="/contact"><span className="g21-cap">Press form</span><b>Send a media request</b><span className="g21-ar" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
