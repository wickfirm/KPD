import { Figtree } from "next/font/google";

/// The CMS typeface. The public site is set in Saans, a licensed trial font that
/// falls back to Figtree, so Figtree is the closest face we can ship freely.
export const cmsFont = Figtree({ subsets: ["latin"], display: "swap" });
