const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/// Splits a delivered `<figure ...>...</figure>` fragment into the outer tag's
/// attributes (as React props) and its inner markup. Null when the fragment is
/// not a single figure element.
export function parseFigure(html: string): { props: Record<string, string>; inner: string } | null {
  const match = html.trim().match(/^<figure\b([^>]*)>([\s\S]*)<\/figure>$/i);
  if (!match) return null;
  const props: Record<string, string> = {};
  for (const attribute of match[1].matchAll(/([\w:-]+)(?:\s*=\s*"([^"]*)")?/g)) {
    props[attribute[1] === "class" ? "className" : attribute[1]] = decode(attribute[2] ?? "");
  }
  return { props, inner: match[2] };
}
