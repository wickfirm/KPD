import "../(public)/public.css";
import GoogleTagManager from "@/components/public/GoogleTagManager";

/// No wrapper element: the delivered body classes are applied to <body> itself
/// before first paint (DeliveredBodyClass), so the DOM matches the client's HTML.
export default function ProjectPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleTagManager />
      {children}
    </>
  );
}
