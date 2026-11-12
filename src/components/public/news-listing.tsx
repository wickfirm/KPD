import Link from "next/link";
import { emphasisNodes } from "@/lib/emphasis";
import { newsCaption, newsListingDefaults as d, type NewsListItem, type NewsListingCopy } from "@/lib/news-listing";
import { NewsFilters } from "./news-filters";
import { pressCoverageCopyDefaults, pressDateLabel, type PressItem } from "@/lib/press-coverage";
import { textStyleProps } from "@/lib/text-style";

/// Rows shown before the "Show all" toggle.
const PRESS_VISIBLE_ROWS = 8;

function PressRow({ item }: { item: PressItem }) {
  const date = pressDateLabel(item.date);
  const inner = <>
    <span className="g21-cap">{item.publication}{date ? <> · <time dateTime={item.date}>{date}</time></> : null}</span>
    <b lang={item.lang} dir={item.lang === "ar" ? "rtl" : "ltr"}>{item.title}</b>
    {item.url ? <span className="g21-ar" aria-hidden="true">↗</span> : <span aria-hidden="true" />}
  </>;
  return <li>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{inner}</a> : <div>{inner}</div>}</li>;
}

const FALLBACK_IMAGE = "/legacy/assets/images/library/modern-office-glasses-buildings-cityscape-under-bl-2026-03-10-02-05-10-utc.jpg";

/// Press coverage as the page's main listing: the newest item as the feature,
/// the rest as image cards, each opening the publication's article.
function PressCards({ items, cta, emptyText }: { items: PressItem[]; cta: string; emptyText: string }) {
  const [feature, ...rest] = items;
  if (!feature) return <p className="g21-muted">{emptyText}</p>;
  const caption = (item: PressItem) => { const date = pressDateLabel(item.date); return <>{item.publication}{date ? <> · <time dateTime={item.date}>{date}</time></> : null}</>; };
  const external = (item: PressItem) => (item.url ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {});
  return <>
    <article className="g21-feat">
      {feature.url ? <a className="g21-feat-img" {...external(feature)} tabIndex={-1} aria-hidden="true"><img src={feature.image || FALLBACK_IMAGE} alt="" /></a> : <div className="g21-feat-img"><img src={feature.image || FALLBACK_IMAGE} alt="" /></div>}
      <div className="g21-feat-copy">
        <p className="g21-cap">{caption(feature)}</p>
        <h2 lang={feature.lang} dir={feature.lang === "ar" ? "rtl" : "ltr"}>{feature.title}</h2>
        {feature.url ? <a className="g21-btn" {...external(feature)}>{cta} <span className="g21-ar" aria-hidden="true">↗</span></a> : null}
      </div>
    </article>
    {rest.length ? <div className="g21-cards">
      {rest.map((item, index) => {
        const inner = <>
          <figure className="g21-card-img"><img src={item.image || FALLBACK_IMAGE} alt="" loading="lazy" /></figure>
          <span className="g21-cap">{caption(item)}</span>
          <h3 lang={item.lang} dir={item.lang === "ar" ? "rtl" : "ltr"}>{item.title}</h3>
          {item.url ? <span className="g21-txt-link">{cta} <span aria-hidden="true">↗</span></span> : null}
        </>;
        return <article className="g21-card" key={`${item.url}-${index}`}>{item.url ? <a {...external(item)}>{inner}</a> : <div>{inner}</div>}</article>;
      })}
    </div> : null}
  </>;
}

/// Category used by the filter tabs: journal pieces are "perspective", news
/// items "announcement" (the client-approved Option 2.1 wording).
const category = (item: NewsListItem) => (item.kind === "BLOG" ? "perspective" : "announcement");

/// The <main> content of /news in the Option 2.1 "Gallery light" layout:
/// breadcrumb hero with filter tabs, the newest article as a feature, the rest
/// as cards (each links to its /news/<slug> page), outside press coverage
/// ("In the press") and a press band. Copy for
/// the page comes from Pages → News.
export function NewsListingMain({ articles, copy, email, coverage = [] }: { articles: NewsListItem[]; copy: NewsListingCopy; email?: string; coverage?: PressItem[] }) {
  const pick = (key: keyof typeof d) => (typeof copy[key] === "string" ? (copy[key] as string).trim() : "") || d[key];
  const eyebrow = pick("eyebrow");
  const heading = pick("heading");
  const intro = copy.intro?.trim() ?? "";
  const pressFirst = copy.layout === "press";
  const [feature, ...rest] = articles;
  const hasBoth = !pressFirst && articles.some((item) => item.kind === "BLOG") && articles.some((item) => item.kind !== "BLOG");
  return (
    <main className="news-main g21" id="top">
      <section className="g21-hero" aria-labelledby="g21-news-title">
        <div className="g21-wrap">
          <nav className="g21-crumbs g21-cap" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{eyebrow}</span><span aria-hidden="true">/</span><span aria-current="page">News</span></nav>
          <div className="g21-title">
            <h1 id="g21-news-title" style={textStyleProps(copy.headingStyle)}>{emphasisNodes(heading)}</h1>
            <div>
              {intro ? <p className="g21-lede">{intro}</p> : null}
              {hasBoth ? <NewsFilters labels={{ all: pick("filterAll"), perspective: pick("filterPerspective"), announcement: pick("filterAnnouncement") }} /> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="g21-news-sec" id="updates" aria-label={pressFirst ? "In the press" : "Articles"}>
        <div className="g21-wrap">
          {pressFirst ? <PressCards items={copy.coverageVisible === false ? [] : coverage} cta={pick("pressCardCta")} emptyText={pick("emptyText")} /> : <>
          {feature ? <article className="g21-feat" data-cat={category(feature)}>
            <Link className="g21-feat-img" href={`/news/${feature.slug}`} tabIndex={-1} aria-hidden="true"><img src={feature.coverImage || FALLBACK_IMAGE} alt="" /></Link>
            <div className="g21-feat-copy">
              <p className="g21-cap">{newsCaption(feature)}</p>
              <h2>{feature.title}</h2>
              {feature.summary ? <p className="g21-muted">{feature.summary}</p> : null}
              <Link className="g21-btn" href={`/news/${feature.slug}`}>{pick("featureCta")} <span className="g21-ar" aria-hidden="true">→</span></Link>
            </div>
          </article> : <p className="g21-muted">{pick("emptyText")}</p>}
          {rest.length ? <div className="g21-cards">
            {rest.map((item) => <article className="g21-card" key={item.slug} data-cat={category(item)}>
              <Link href={`/news/${item.slug}`}>
                <figure className="g21-card-img"><img src={item.coverImage || FALLBACK_IMAGE} alt={item.coverImageAlt} loading="lazy" /></figure>
                <span className="g21-cap">{newsCaption(item)}</span>
                <h3>{item.title}</h3>
                {item.summary ? <p className="g21-muted">{item.summary}</p> : null}
                <span className="g21-txt-link">{pick("cardCta")} <span aria-hidden="true">→</span></span>
              </Link>
            </article>)}
          </div> : null}
          <p className="g21-muted g21-empty" data-news-empty hidden>No articles in this category yet.</p>
          </>}
        </div>
      </section>

      {pressFirst || copy.coverageVisible === false || coverage.length === 0 ? null : <section className="g21-pad g21-pad--top-flush" id="press" aria-labelledby="g21-coverage-title">
        <div className="g21-wrap g21-coverage">
          <div>
            <span className="g21-cap">{copy.coverageLabel?.trim() || pressCoverageCopyDefaults.coverageLabel}</span>
            <h2 id="g21-coverage-title">{emphasisNodes(copy.coverageHeading?.trim() || pressCoverageCopyDefaults.coverageHeading)}</h2>
          </div>
          <div>
            <ul className="g21-coverage-list">{coverage.slice(0, PRESS_VISIBLE_ROWS).map((item, i) => <PressRow item={item} key={i} />)}</ul>
            {coverage.length > PRESS_VISIBLE_ROWS ? <details className="g21-coverage-more">
              <summary className="g21-txt-link">Show all {coverage.length} <span aria-hidden="true">↓</span></summary>
              <ul className="g21-coverage-list">{coverage.slice(PRESS_VISIBLE_ROWS).map((item, i) => <PressRow item={item} key={i} />)}</ul>
            </details> : null}
          </div>
        </div>
      </section>}

      {copy.pressVisible === false ? null : <section className="g21-pad g21-pad--top-flush" aria-labelledby="g21-press-title">
        <div className="g21-wrap g21-press">
          <div>
            <span className="g21-cap">{pick("pressLabel")}</span>
            <h2 id="g21-press-title" style={textStyleProps(copy.pressHeadingStyle)}>{emphasisNodes(pick("pressHeading"))}</h2>
            <p className="g21-muted" style={textStyleProps(copy.pressTextStyle)}>{pick("pressText")}</p>
          </div>
          <div className="g21-press-links">
            {email ? <a href={`mailto:${email}`}><span className="g21-cap">Email</span><b>{email}</b><span className="g21-ar" aria-hidden="true">↗</span></a> : null}
            <Link href={pick("pressLinkUrl")}><span className="g21-cap">{pick("pressLinkLabel")}</span><b>{pick("pressLinkText")}</b><span className="g21-ar" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>}
    </main>
  );
}
