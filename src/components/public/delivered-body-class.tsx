/// Restores the delivered <body> class list inside the server-rendered HTML.
/// Delivered site.css and site.js gate layout and behaviour on body classes
/// (e.g. ".news-design-page .news-updates .news-grid" resets the news grid to
/// the delivered full-width alignment), so the class must be present from the
/// very first paint — a post-hydration useEffect leaves a multi-second window
/// where the page renders with a classless body and falls back to the generic
/// 93%-of-93% grid geometry. This component renders a synchronous inline
/// script as the first element inside <body>; the browser applies the classes
/// while parsing, before any content paints. DeliveredScripts re-asserts the
/// same classes after hydration and across soft navigations.
export function DeliveredBodyClass({ bodyClass }: { bodyClass: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: `document.body.className=${JSON.stringify(bodyClass)};` }}
    />
  );
}
