import Link from "next/link";

export const dynamic = "force-dynamic";

type Section = { id: string; title: string; summary: string; body: React.ReactNode };

/// A written guide to how the CMS works, for editors. Plain language, no
/// developer terms. Keep it in step with the admin when screens change.
const sections: Section[] = [
  {
    id: "overview",
    title: "How the CMS works",
    summary: "What you can change, and what stays fixed.",
    body: <>
      <p>The website’s <strong>design</strong> is fixed. The CMS changes the <strong>content</strong> inside that design: text, images, lists, links, articles and developments. You can’t change layouts, fonts or colours here.</p>
      <p>Every screen follows the same pattern: <strong>edit → save → check the live page</strong>. Some pages also let you <strong>preview before saving</strong> (see “Previewing your changes”).</p>
      <ul>
        <li><strong>Pages</strong> are the fixed pages of the site: Homepage, About, Legacy, Contact, Investor guide and the legal pages.</li>
        <li><strong>Developments</strong> are the project pages, each built from sections you can add, edit and reorder.</li>
        <li><strong>News &amp; Blog</strong> are articles you write and publish.</li>
        <li><strong>Messages</strong> are the enquiries visitors send through the website forms.</li>
        <li><strong>Media</strong> is the library of photos, videos and documents.</li>
      </ul>
      <p className="cms-guide__note">After you save, the live website normally updates straight away. If you ever don’t see a change, wait a minute or two and refresh (the site keeps a copy of each page for up to 5 minutes).</p>
    </>,
  },
  {
    id: "signing-in",
    title: "Signing in and who can do what",
    summary: "Accounts, roles and passwords.",
    body: <>
      <p>Sign in at <code>/admin/login</code> with your own account. You stay signed in for up to 7 days on the same browser, so sign out on shared computers.</p>
      <p>There are two kinds of account:</p>
      <ul>
        <li><strong>Editor:</strong> can create and change content (pages, developments, articles, calculator, media uploads) and read Messages.</li>
        <li><strong>Admin:</strong> everything an Editor can do, plus <strong>Site settings</strong>, <strong>Team</strong> (accounts and roles), the <strong>Activity log</strong>, and deleting files from the Media library.</li>
      </ul>
      <p>Passwords need at least 10 characters with both letters and numbers. Admins can add people, change roles and reset passwords under <Link href="/admin/users">Team</Link>.</p>
    </>,
  },
  {
    id: "going-live",
    title: "Drafts, publishing and going live",
    summary: "When your change becomes visible to visitors.",
    body: <>
      <p>Different content goes live in different ways. This is the most important thing to know:</p>
      <div className="cms-guide__table" role="table" aria-label="When changes go live">
        <div role="row" className="cms-guide__row cms-guide__row--head"><span role="columnheader">What you edit</span><span role="columnheader">When visitors see it</span></div>
        <div role="row" className="cms-guide__row"><span role="cell">Homepage, About, Legacy, Contact, Investor guide</span><span role="cell"><strong>As soon as you save.</strong> There is no draft, so use “Preview with unsaved changes” first.</span></div>
        <div role="row" className="cms-guide__row"><span role="cell">Terms, Privacy, Cookie policy</span><span role="cell">Only when the page is set to <strong>Published</strong>. Until then visitors keep seeing the original text.</span></div>
        <div role="row" className="cms-guide__row"><span role="cell">Developments</span><span role="cell">Only when <strong>Published</strong>. Draft and Archived developments are hidden.</span></div>
        <div role="row" className="cms-guide__row"><span role="cell">News &amp; Blog articles</span><span role="cell">Only when <strong>Published</strong>. Drafts stay private.</span></div>
        <div role="row" className="cms-guide__row"><span role="cell">Site settings, Calculator</span><span role="cell">As soon as you save.</span></div>
      </div>
      <p><strong>Draft</strong> = private work in progress. <strong>Published</strong> = visible. <strong>Archived</strong> = taken off the site but kept, so you can bring it back later. Archiving and unpublishing a development takes it off the site <strong>immediately</strong>.</p>
    </>,
  },
  {
    id: "previewing",
    title: "Previewing your changes",
    summary: "Look before visitors do.",
    body: <>
      <p>There are two kinds of preview. Both open in a new tab, are visible only to signed-in team members, and show a banner at the bottom so you know it is a preview.</p>
      <h3>Preview with unsaved changes</h3>
      <p>Click <strong>Preview with unsaved changes ↗</strong> next to the Save button. It shows the page <em>exactly as you have it in the form right now</em>, without saving anything. Available on:</p>
      <ul>
        <li>a development section</li>
        <li>an article (new or existing)</li>
        <li>Homepage, About, Legacy, Contact and the Investor guide</li>
        <li>Terms, Privacy and Cookie policy</li>
      </ul>
      <p>Edit, preview, adjust, preview again, and save only when you are happy. Previews last about 2 hours and never change the live site.</p>
      <h3>Preview of what is saved</h3>
      <ul>
        <li><strong>Developments:</strong> <em>Preview page</em> shows the whole development in any status, including Draft and Archived.</li>
        <li><strong>Articles:</strong> <em>Preview ↗</em> in the list, or <em>Preview saved version ↗</em> inside the article.</li>
        <li><strong>Legal pages:</strong> <em>Preview saved text ↗</em> shows your saved text even if the page is not published yet.</li>
      </ul>
      <p className="cms-guide__note">Not every screen has a preview: Site settings, Team and the Calculator are not pages, so there is nothing to preview. For those, save and check the live site.</p>
    </>,
  },
  {
    id: "developments",
    title: "Developments",
    summary: "Create and manage project pages.",
    body: <>
      <p>Open <Link href="/admin/projects">Developments</Link> to see every project as a card. Search, filter by status, or open one to edit it.</p>
      <h3>Creating a development</h3>
      <ol>
        <li>Choose <strong>New development</strong>, give it a name, and save. It starts as a <strong>Draft</strong> with a set of starter sections.</li>
        <li>Fill in the details at the top (name, tagline, description, hero image).</li>
        <li>Edit each section, add new ones, and reorder them.</li>
        <li>Use <strong>Preview page</strong> to check it, then <strong>Publish</strong>.</li>
      </ol>
      <p>Once published, a new development appears automatically in the website’s <strong>Developments menu, the mobile menu and the footer</strong>, after the three original projects. The menu shows up to 6 additional developments.</p>
      <h3>Sections</h3>
      <p>Each development is built from sections: Gallery, Floor plans, Specifications, Location, Video, Brochure or a custom block. Choose the type when you add the section. Use <strong>Move up / Move down</strong> to change the order on the page.</p>
      <h3>Galleries: images and captions</h3>
      <ul>
        <li>Each image has its own <strong>Caption</strong>. Leave it empty to use the section title.</li>
        <li><strong>Drag the ⠿ handle</strong> (or use Move up / Move down) to reorder images. The caption always moves with its image.</li>
        <li>Click <strong>Save section</strong> to keep the order. Nothing is saved until you do.</li>
      </ul>
      <h3>Other actions</h3>
      <p>In the <strong>More</strong> menu on a development: Publish, Unpublish, Archive, Restore, Duplicate (copies a development as a new draft) and Move (changes its order in the list).</p>
    </>,
  },
  {
    id: "articles",
    title: "News & Blog",
    summary: "Write, publish and manage articles.",
    body: <>
      <p>Open <Link href="/admin/articles">News &amp; Blog</Link> to see all articles. Use <strong>Write a new article</strong> to start one.</p>
      <ol>
        <li>Enter the title, summary, kind (News or Blog), cover image and body. Separate paragraphs with a blank line.</li>
        <li>Leave the slug empty to create the web address from the title.</li>
        <li>Keep the status on <strong>Draft</strong> while you work. Use <em>Preview with unsaved changes</em> to see how it will look.</li>
        <li>Set it to <strong>Published</strong> and save to put it on the site.</li>
      </ol>
      <p className="cms-guide__note">Good to know: saving an article that is already Published sets its publication date to today. Avoid re-saving published articles unless you need to, if the original date matters.</p>
      <h3>News inbox</h3>
      <p><Link href="/admin/rss">News inbox</Link> collects press mentions found automatically about KPD. Nothing appears on the site until you <strong>approve</strong> an item, which turns it into a published article. <strong>Reject</strong> removes it from the inbox. New items arrive every 30 minutes.</p>
    </>,
  },
  {
    id: "pages",
    title: "Pages",
    summary: "The fixed pages of the website.",
    body: <>
      <p>The <strong>Pages</strong> group in the sidebar lists each fixed page. Every one has a guided editor, with the current website text already filled in, so you always start from what visitors see now.</p>
      <ul>
        <li><strong>Homepage:</strong> key figures, banner slides, development cards and intro text.</li>
        <li><strong>About, Legacy, Contact:</strong> introduction, and the page’s own sections (mission and team, timeline).</li>
        <li><strong>Investor guide:</strong> every section of the Invest in Dubai page.</li>
        <li><strong>Terms, Privacy, Cookie policy:</strong> heading, intro and body. Start a line with <code>## </code> to make it a section heading.</li>
      </ul>
      <p>The address (URL) of a fixed page can’t be changed. New page types need the development team.</p>
      <h3>Lists and cards</h3>
      <p>Where a page has a list (slides, figures, timeline, FAQs), each item is a card. Use <strong>Add</strong> to create one, <strong>Remove</strong> to delete it, and <strong>drag the ⠿ handle</strong> or Move up / Move down to reorder.</p>
    </>,
  },
  {
    id: "media",
    title: "Media library",
    summary: "Photos, videos and documents.",
    body: <>
      <p>You can upload straight from any editor with the upload button next to an image field. The <Link href="/admin/media">Media</Link> library lets you search, filter by type and copy the link of any file you uploaded before.</p>
      <ul>
        <li><strong>Accepted files:</strong> JPG, PNG, WebP, GIF, SVG, MP4 and PDF.</li>
        <li><strong>Size limit:</strong> 25 MB per file. Compress large photos and videos first.</li>
        <li>Only <strong>Admins</strong> can delete files, because a deleted file disappears from every page using it.</li>
      </ul>
    </>,
  },
  {
    id: "messages",
    title: "Messages",
    summary: "Enquiries from the website forms.",
    body: <>
      <p><Link href="/admin/submissions">Messages</Link> shows every enquiry sent through the contact form, the booking form, floor-plan requests and the newsletter sign-up. Each card lists what the visitor filled in. Filter by type or status to find what you need.</p>
      <p>Every enquiry is saved here first and then sent on to Salesforce. If sending fails, the message is marked <strong>Failed</strong> but is never lost. Once Salesforce is working, use <strong>Retry sync</strong> on the message to send it again.</p>
    </>,
  },
  {
    id: "calculator",
    title: "Calculator",
    summary: "Fees, rates and payment plans.",
    body: <>
      <p>The <Link href="/admin/calculator">Calculator</Link> controls the numbers behind the ownership cost calculator on the site: starting prices, interest rates and payment milestones for each development. Changes apply as soon as you save, so double-check numbers before saving.</p>
    </>,
  },
  {
    id: "admin",
    title: "Administration (Admins only)",
    summary: "Site settings, team and activity.",
    body: <>
      <ul>
        <li><strong>Site settings:</strong> the email, phone, WhatsApp and social links used across the site (footer, floating buttons and booking form).</li>
        <li><strong>Team:</strong> add people, set their role, deactivate accounts and reset passwords.</li>
        <li><strong>Activity log:</strong> who changed what and when, useful when you need to find out how something was edited.</li>
      </ul>
    </>,
  },
  {
    id: "history",
    title: "Version history and undo",
    summary: "Go back if something goes wrong.",
    body: <>
      <p>Most editors keep a <strong>Version history</strong> at the bottom of the page. Each time you save, the previous state is kept. The last 5 versions of each item are stored.</p>
      <p>To go back, open the item, find the version you want and click <strong>Restore this version</strong>. Restoring saves that older content as the current one, so you can still change your mind afterwards.</p>
      <p>When you leave an editor with changes you haven’t saved, the CMS warns you first.</p>
    </>,
  },
  {
    id: "troubleshooting",
    title: "If something doesn’t look right",
    summary: "Quick fixes for common problems.",
    body: <>
      <ul>
        <li><strong>I saved but the site hasn’t changed.</strong> Refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac). If it is a legal page or an article, check it is set to <strong>Published</strong>. Wait up to 5 minutes if it still looks old.</li>
        <li><strong>An image won’t upload.</strong> Check the file type and that it is 25 MB or smaller.</li>
        <li><strong>“A page/module with this slug already exists.”</strong> Another item already uses that web address. Change the title or the address slightly.</li>
        <li><strong>A new development isn’t in the menu.</strong> It must be <strong>Published</strong>, and only the first 6 additional developments are shown.</li>
        <li><strong>I lost my edits.</strong> Use Version history to restore an earlier save. Unsaved text can’t be recovered.</li>
        <li><strong>I can’t see Site settings or Team.</strong> Those are for Admin accounts only. Ask an Admin.</li>
      </ul>
      <p>For anything the CMS can’t do (new page designs, new kinds of section, new features), contact the development team.</p>
    </>,
  },
];

export default function GuidePage() {
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">Help</span>
        <h1>CMS guide</h1>
        <p>How the CMS works, in plain language: what each section does, when changes go live, and how to preview and undo them.</p>
      </div>
    </div>

    <div className="cms-guide">
      <nav className="cms-guide__toc" aria-label="Guide contents">
        <span className="cms-guide__toc-title">On this page</span>
        {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
      </nav>
      <div className="cms-guide__content">
        {sections.map((section) => <section className="cms-card cms-guide__section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
          <h2 id={`${section.id}-title`}>{section.title}</h2>
          <p className="cms-muted cms-guide__summary">{section.summary}</p>
          {section.body}
        </section>)}
      </div>
    </div>
  </>;
}
