/// Developments shown in the client-approved Option 2.1 "Gallery light"
/// layout. The other developments keep the delivered layout until their own
/// 2.1 designs are approved; add a slug here to move one across.
export const galleryLightDevelopments = new Set(["seven-x-seven"]);

/// Approved key facts under the hero (Option 2.1 mock), used until the
/// editor saves its own list.
const keyFactDefaults: Record<string, string> = {
  "seven-x-seven": "Location | Meydan Horizon\nResidences | 155\nTypes | 1, 2, 3 bed & penthouse\nFrom | 889 sq ft\nPayment | 30 / 70",
};

export function defaultKeyFacts(slug: string): string {
  return keyFactDefaults[slug] ?? "";
}

/// "Label | value" lines → facts; lines without a value are skipped.
export function parseKeyFacts(value: string): { label: string; value: string }[] {
  return value.split("\n").map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts.length >= 2 && parts[0] && parts[1]).map(([label, ...rest]) => ({ label, value: rest.join(" | ") }));
}

/// Minutes in a drive-time label such as "8 mins" or "15 min"; NaN when absent.
export function driveMinutes(value: string): number {
  const match = /(\d+(?:\.\d+)?)/.exec(value);
  return match ? Number(match[1]) : Number.NaN;
}

/// An embedded Google Maps URL (…&output=embed) as a link that opens Maps.
export function mapsLink(embedUrl: string): string {
  return embedUrl.replace(/([?&])output=embed&?/, "$1").replace(/[?&]$/, "");
}
