import { redirect } from "next/navigation";

/// Until the front-end pages are migrated into Next.js (Phase 2 — template
/// build-out), the delivered static design continues to be served verbatim
/// from /public/legacy, preserving every relative asset path.
export default function Home() {
  redirect("/legacy/index.html");
}
