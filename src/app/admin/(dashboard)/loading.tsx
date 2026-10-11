/// Shown inside the admin shell the instant a link is clicked, while the next
/// page is fetched from the server. Without this the old screen simply stays put
/// until the new one is ready, which feels like nothing happened.
export default function DashboardLoading() {
  return <div className="cms-loading" role="status" aria-live="polite">
    <span className="cms-loading__bar" aria-hidden="true" />
    <span className="cms-sr-only">Loading…</span>
    <div className="cms-loading__head" aria-hidden="true">
      <span className="cms-loading__line cms-loading__line--eyebrow" />
      <span className="cms-loading__line cms-loading__line--title" />
      <span className="cms-loading__line cms-loading__line--text" />
    </div>
    <div className="cms-loading__card" aria-hidden="true">
      <span className="cms-loading__line" />
      <span className="cms-loading__line cms-loading__line--short" />
      <span className="cms-loading__line" />
    </div>
    <div className="cms-loading__card" aria-hidden="true">
      <span className="cms-loading__line cms-loading__line--short" />
      <span className="cms-loading__line" />
    </div>
  </div>;
}
