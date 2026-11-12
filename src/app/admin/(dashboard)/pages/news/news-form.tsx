"use client";

import { useActionState, useState } from "react";
import { ListEditor } from "@/components/admin/list-editor";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { TextStyleFields } from "@/components/admin/text-style-fields";
import { detectLang, pressCoverageCopyDefaults as pd, type PressItem } from "@/lib/press-coverage";
import { saveNewsListing, type SiteSettingsFormState } from "../../actions";
import { newsListingDefaults as d, type NewsListingCopy } from "@/lib/news-listing";

const initialState: SiteSettingsFormState = {};

/// Editor for the /news page copy. Every field shows the live wording; a field
/// left blank falls back to the approved wording shown as its placeholder.
export default function NewsForm({ copy, coverage: initialCoverage }: { copy: NewsListingCopy; coverage: PressItem[] }) {
  const [state, formAction, pending] = useActionState(saveNewsListing, initialState);
  const [coverage, setCoverage] = useState<PressItem[]>(initialCoverage);
  const value = (key: keyof typeof d) => copy[key] ?? d[key];
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h2 className="cms-form-heading">Hero</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Breadcrumb label</span><input name="eyebrow" defaultValue={value("eyebrow")} placeholder={d.eyebrow} /><small>Shown between Home and News in the breadcrumb.</small></label>
      <label className="cms-field"><span>Page title</span><textarea name="heading" rows={2} defaultValue={value("heading")} placeholder={d.heading} /><small>Line breaks render as typed. Wrap words in **double asterisks** for the bold emphasis.</small></label>
    </div>
    <TextStyleFields prefix="newsHeading" value={copy.headingStyle} label="Page title appearance" preserveDefault />
    <label className="cms-field"><span>Introduction</span><textarea name="intro" rows={3} defaultValue={copy.intro ?? ""} /><small>Optional sentence beside the title. Leave empty to hide it.</small></label>

    <h2 className="cms-form-heading">What the page leads with</h2>
    <label className="cms-field"><span>Main listing</span><select name="layout" defaultValue={copy.layout === "press" ? "press" : "articles"}>
      <option value="articles">Our articles (written under News &amp; Blog)</option>
      <option value="press">Press coverage about KPD, as image cards</option>
    </select><small>With press coverage, the newest press article shows large and the rest as cards with their pictures (set below under In the press). Our own articles and the filter buttons are then hidden.</small></label>
    <label className="cms-field"><span>Press card link text</span><input name="pressCardCta" defaultValue={value("pressCardCta")} placeholder={d.pressCardCta} /><small>Used when the page leads with press coverage. Opens the publication’s article in a new tab.</small></label>

    <h2 className="cms-form-heading">Articles</h2>
    <p className="cms-muted">The newest published article shows large; the rest show as cards. Write and publish articles under News &amp; Blog.</p>
    <div className="cms-grid">
      <label className="cms-field"><span>Featured article button</span><input name="featureCta" defaultValue={value("featureCta")} placeholder={d.featureCta} /></label>
      <label className="cms-field"><span>Card link text</span><input name="cardCta" defaultValue={value("cardCta")} placeholder={d.cardCta} /></label>
    </div>
    <label className="cms-field"><span>Text when no articles are published</span><input name="emptyText" defaultValue={value("emptyText")} placeholder={d.emptyText} /></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Filter: all</span><input name="filterAll" defaultValue={value("filterAll")} placeholder={d.filterAll} /></label>
      <label className="cms-field"><span>Filter: blog posts</span><input name="filterPerspective" defaultValue={value("filterPerspective")} placeholder={d.filterPerspective} /></label>
      <label className="cms-field"><span>Filter: news</span><input name="filterAnnouncement" defaultValue={value("filterAnnouncement")} placeholder={d.filterAnnouncement} /></label>
    </div>
    <p className="cms-muted">The filter buttons beside the title. They only show while there are both blog posts and news articles.</p>

    <h2 className="cms-form-heading">In the press</h2>
    <p className="cms-muted">Articles about KPD in other publications. They list newest first (undated ones last, in the order below) on /news and in the RSS feed at /rss.xml. The first 8 show; the rest open with “Show all”.</p>
    <label className="cms-check"><input type="checkbox" name="coverageVisible" defaultChecked={copy.coverageVisible !== false} /><span><strong>Show “In the press” on /news</strong><small>Hiding it also keeps the items out of the RSS feed.</small></span></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Caption</span><input name="coverageLabel" defaultValue={copy.coverageLabel ?? pd.coverageLabel} placeholder={pd.coverageLabel} /></label>
      <label className="cms-field"><span>Heading</span><textarea name="coverageHeading" rows={2} defaultValue={copy.coverageHeading ?? pd.coverageHeading} placeholder={pd.coverageHeading} /></label>
    </div>
    <input type="hidden" name="coverageJson" value={JSON.stringify(coverage)} />
    <ListEditor items={coverage} onChange={setCoverage} addLabel="Add press article" newItem={(): PressItem => ({ publication: "", title: "", url: "", date: "", lang: "en" })}
      itemLabel={(item, index) => item.publication || `Article ${index + 1}`}
      renderItem={(item, update) => <>
        <div className="cms-grid">
          <label className="cms-field"><span>Publication</span><input value={item.publication} onChange={(e) => update({ publication: e.target.value })} placeholder="e.g. Zawya" /></label>
          <label className="cms-field"><span>Date</span><input type="date" value={item.date} onChange={(e) => update({ date: e.target.value })} /><small>Optional. Undated items list last.</small></label>
        </div>
        <label className="cms-field"><span>Headline</span><textarea rows={2} dir="auto" value={item.title} onChange={(e) => update({ title: e.target.value, lang: detectLang(e.target.value) })} /><small>As the publication ran it. Arabic headlines are detected and shown right-to-left.</small></label>
        <label className="cms-field"><span>Link</span><input type="url" value={item.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://" /><small>Leave empty to show the headline without a link.</small></label>
        <div className="cms-field"><span>Picture</span><AssetUrlField value={item.image ?? ""} onChange={(image) => update({ image })} accept="image/*" fileLabel="press picture" placeholder="https://…" /><small>Shown when the page leads with press coverage. Landscape works best.</small></div>
      </>} />

    <h2 className="cms-form-heading">Press band</h2>
    <label className="cms-check"><input type="checkbox" name="pressVisible" defaultChecked={copy.pressVisible !== false} /><span><strong>Show the press band</strong><small>The media enquiries block at the bottom of the page. The email shown is the site email from Site settings.</small></span></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Caption</span><input name="pressLabel" defaultValue={value("pressLabel")} placeholder={d.pressLabel} /></label>
      <label className="cms-field"><span>Heading</span><textarea name="pressHeading" rows={2} defaultValue={value("pressHeading")} placeholder={d.pressHeading} /></label>
    </div>
    <TextStyleFields prefix="newsPressHeading" value={copy.pressHeadingStyle} label="Heading appearance" preserveDefault />
    <label className="cms-field"><span>Text</span><textarea name="pressText" rows={2} defaultValue={value("pressText")} placeholder={d.pressText} /></label>
    <TextStyleFields prefix="newsPressText" value={copy.pressTextStyle} label="Text appearance" preserveDefault />
    <div className="cms-grid">
      <label className="cms-field"><span>Link caption</span><input name="pressLinkLabel" defaultValue={value("pressLinkLabel")} placeholder={d.pressLinkLabel} /></label>
      <label className="cms-field"><span>Link text</span><input name="pressLinkText" defaultValue={value("pressLinkText")} placeholder={d.pressLinkText} /></label>
      <label className="cms-field"><span>Link</span><input name="pressLinkUrl" defaultValue={value("pressLinkUrl")} placeholder={d.pressLinkUrl} /></label>
    </div>

    <div className="cms-actions cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save News page"}</button></div>
  </form>;
}
