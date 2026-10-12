import "../(public)/public.css";

/// The homepage intentionally owns its chrome. It is a faithful migration of
/// the client-delivered document, rather than a composition of the simplified
/// shared public shell used by the other Phase 1 routes.
/// No wrapper element: the delivered body classes are applied to <body> itself
/// before first paint (DeliveredBodyClass), so the DOM matches the client's HTML.
export default function HomepageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
