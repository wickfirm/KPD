import type { ReactNode } from "react";
import Link from "next/link";
import { RawFigure } from "./raw-figure";
import { htmlLf } from "@/lib/html-lf";

type ModuleItem = { label?: string; value?: string; text?: string; image?: string; url?: string };
type ModuleContent = { text?: string; images?: string[]; items?: ModuleItem[]; url?: string; mapUrl?: string; presentation?: string };

/// Delivered markup fragments (directional-media figures, travel timeline)
/// that are not CMS-managed and ride through verbatim from the template file.
export type ModuleShell = { meydanFigure?: string; calmFigure?: string; locationShell?: string };

function content(value: unknown) {
  return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as ModuleContent;
}

/// Newlines in module titles render as <br>, matching the delivered markup
/// (e.g. the delivered calm panels break their headings across lines).
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The section id the delivered template uses for this module ("tour" lives
/// in the showcase section; everything else uses its own slug).
export function moduleSectionId(slug: string) {
  return slug === "tour" ? "showcase" : slug;
}

export function DevelopmentModule({ module, projectName, shell }: { module: { slug: string; title: string; kind: string; content: unknown }; projectName: string; shell?: ModuleShell }) {
  const data = content(module.content);
  const images = data.images ?? [];
  const items = data.items ?? [];
  const id = moduleSectionId(module.slug);

  if (module.kind === "GALLERY") return <section className="single-project-amenities kpd-section" id={id} aria-label={module.title}><div className="single-project-section-head"><h2>{module.title}</h2>{data.text ? <div className="single-project-section-copy"><p>{data.text}</p></div> : null}</div><div className="pdf-vertical-gallery pdf-gallery-flex single-project-flex-gallery single-project-amenities-gallery has-active" data-gallery-flex>{images.map((image, index) => { const label = items[index]?.label ?? module.title; return <button className={`pdf-gallery-panel${index === 0 ? " is-active" : ""}`} type="button" data-gallery-panel data-lightbox-src={image} data-lightbox-caption={label} key={`${image}-${index}`}><img src={image} alt={label} /><span>{label}</span></button>; })}</div></section>;

  if (module.kind === "FLOOR_PLAN") return <section className="single-project-floor-plans kpd-section" id={id} aria-label={module.title}><div className="single-project-section-head"><h2>{module.title}</h2>{data.text ? <div className="single-project-section-copy"><p>{data.text}</p></div> : null}</div><div className="single-project-floor-grid">{items.map((item, index) => <article className="single-project-floor-card" key={`${item.label}-${index}`}>{item.image ? <img src={item.image} alt={`${projectName} ${item.label ?? `Plan ${index + 1}`} floor plan`} /> : null}<div><strong>{item.label ?? `Plan ${index + 1}`}</strong>{item.url ? <a href={item.url}>Download</a> : null}</div></article>)}</div></section>;

  if (module.kind === "SPECIFICATIONS" || module.kind === "LOCATION") return <section className="section-villa23-travel-timeline single-project-location" id={id} aria-label="Location and travel times" data-villa23-travel-timeline><div className="single-project-location-container"><div className="project-section-head villa23-travel-head"><h2>{module.title}</h2>{data.text ? <p>{data.text}</p> : null}</div><div className="single-project-proximity-grid" aria-label="Nearby destinations">{(() => { const firstColumn = items.slice(0, Math.ceil(items.length / 2)); const secondColumn = items.slice(Math.ceil(items.length / 2)); const row = (item: ModuleItem, index: number) => <li key={`${item.label}-${index}`}><span>{item.value}</span><strong>{item.label ?? item.text}</strong></li>; return <><ul>{firstColumn.map(row)}</ul><ul>{secondColumn.map(row)}</ul></>; })()}</div>{shell?.locationShell ? <div dangerouslySetInnerHTML={{ __html: htmlLf(shell.locationShell) }} /> : data.mapUrl ? <div className="villa23-travel-map-area"><iframe className="villa23-travel-map" title={`${projectName} location map`} loading="lazy" src={data.mapUrl} /></div> : null}</div></section>;

  if (module.kind === "VIDEO" || module.kind === "BROCHURE") return <section className="single-project-showcase pdf-section pdf-development-banner single-project-render-banner" id={id} aria-label="Project render" data-development-slider><div className="pdf-development-slides" aria-hidden="true">{images.map((image, index) => <div className={`pdf-development-slide${index === 0 ? " active" : ""}`} key={`${image}-${index}`}><img src={image} alt="" /></div>)}</div><div className="pdf-development-content"><h2>{module.title}</h2><a className="pdf-development-button btn-pill text-white" href={data.url ?? "#amenities"} target={module.kind === "VIDEO" && data.url ? "_blank" : undefined} rel={module.kind === "VIDEO" && data.url ? "noreferrer" : undefined}>{module.kind === "VIDEO" && data.url ? "Watch" : module.kind === "BROCHURE" && data.url ? "Download" : "Explore"}</a><div className="pdf-development-dots" aria-label="Project render slides">{images.map((_, index) => <button className={index === 0 ? "active" : undefined} type="button" data-development-dot={index} aria-label={`Show slide ${index + 1}`} key={index} />)}</div></div></section>;

  if (data.presentation === "calm") {
    // The delivered directional-media figure rides through verbatim with only
    // the primary image swapped when the editor supplied one.
    const figureHtml = shell?.calmFigure
      ? data.images?.[0] ? shell.calmFigure.replace(/(<img\s+src=")[^"]+/, `$1${data.images[0]}`) : shell.calmFigure
      : images[0] ? `<figure class="single-project-calm-media"><img src="${images[0]}" alt="${projectName} — ${module.title}"></figure>` : "";
    return <section className="single-project-calm kpd-section" id={id} aria-label={module.title}><div className="single-project-calm-grid"><div className="single-project-calm-copy"><h2>{multiline(module.title)}</h2>{data.text ? <p>{data.text}</p> : null}{data.url ? <Link className="btn-pill" href={data.url}>Brochure</Link> : null}</div>{figureHtml ? <RawFigure html={figureHtml} /> : null}</div></section>;
  }

  if (module.slug === "payment-plan") return <section className="single-project-payment kpd-section" id={id} aria-label={module.title}><div className="single-project-section-head"><h2>{module.title}</h2><div className="single-project-section-copy">{data.text ? <p>{data.text}</p> : null}{data.url ? <a className="btn-pill" href={data.url}>Download Payment Plan</a> : null}</div></div><div className="single-project-payment-grid">{items.map((item, index) => <article key={`${item.label}-${index}`}><strong>{item.value}</strong><span>{item.label ?? item.text}</span>{item.text && item.label ? <p>{item.text}</p> : null}</article>)}</div></section>;

  return <section className="single-project-meydan kpd-section" id={id} aria-label={module.title}><div className="single-project-meydan-grid"><div className="single-project-meydan-copy"><h2>{module.title}</h2>{data.text ? <p>{data.text}</p> : null}{items.length ? <div className="single-project-meydan-stats" aria-label={`${module.title} travel highlights`}>{items.map((item, index) => <div key={`${item.label}-${index}`}><strong>{item.value}</strong><span>{item.label ?? item.text}</span></div>)}</div> : null}{data.url ? <a className="btn-pill" href={data.url}>Explore</a> : null}</div>{shell?.meydanFigure ? <RawFigure html={shell.meydanFigure} /> : images[0] ? <figure className="single-project-meydan-media"><img src={images[0]} alt={`${projectName} — ${module.title}`} /></figure> : null}</div></section>;
}