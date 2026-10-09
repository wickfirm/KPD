import { parseFigure } from "./raw-figure-parse";

/// Renders a delivered `<figure ...>...</figure>` fragment as a real <figure>
/// element. `dangerouslySetInnerHTML` needs a host element, and the previous
/// wrapper <div> became the grid item instead of the figure itself - an extra
/// level the delivered markup does not have. The outer tag's attributes are
/// parsed back into props and only the inner markup is injected, so the figure
/// is the direct child of its grid exactly as delivered.
export function RawFigure({ html }: { html: string }) {
  const figure = parseFigure(html);
  if (!figure) return <div dangerouslySetInnerHTML={{ __html: html }} />;
  return <figure {...figure.props} dangerouslySetInnerHTML={{ __html: figure.inner }} />;
}
