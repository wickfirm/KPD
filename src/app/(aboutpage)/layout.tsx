import "../(public)/public.css";

/// No wrapper element: the delivered body classes are applied to <body> itself
/// before first paint (DeliveredBodyClass), so the DOM matches the client's HTML.
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
