/// The delivered development pages render their Meydan and calm panel pictures
/// as "directional media" sliders: one visible <img data-directional-image>
/// plus hidden <span data-directional-slide> slides that the delivered site.js
/// cycles with the prev/next buttons. Those hidden slides were invisible to the
/// CMS, so editors could not remove or add a different image (client feedback
/// items 12 and 13). directionalFigure rewrites such a figure so the CMS image
/// list drives the whole slider: the first image shows on load and every hidden
/// slide is replaced in order.
///
/// images === undefined (the editor never saved a list) keeps the delivered
/// figure exactly as delivered, so pages the editor has not touched stay
/// byte-identical. An explicit empty list means the CMS owns the section and
/// the editor removed every image, so the figure is not served at all - no
/// delivered image may resurface behind the CMS (round two).
export function directionalFigure(figureHtml: string, images: string[] | undefined, alt: string): string {
  if (images === undefined) return figureHtml;
  if (!images.length) return "";
  const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const slides = images.map((image) => `<span hidden data-directional-slide data-image="${attr(image)}" data-alt="${attr(alt)}"></span>`).join("");
  return figureHtml
    .replace(/(<img\s+src=")[^"]+/, `$1${attr(images[0])}`)
    .replace(/<span[^>]*data-directional-slide[^>]*><\/span>\s*/g, "")
    .replace("</figure>", `${slides}</figure>`);
}

/// Builds a delivered-shaped directional slider from scratch for CMS sections
/// that have no delivered figure (e.g. a payment plan the editor gave images).
/// Same markup contract as the delivered figures, so the client's site.js
/// drives the prev/next cycling identically.
export function cmsDirectionalFigure(images: string[], alt: string, className = "single-project-calm-media"): string {
  if (!images.length) return "";
  const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const slides = images.map((image) => `<span hidden data-directional-slide data-image="${attr(image)}" data-alt="${attr(alt)}"></span>`).join("");
  return `<figure class="${className} single-project-directional-media" data-directional-media>` +
    `<img src="${attr(images[0])}" alt="${attr(alt)}" data-directional-image>` +
    `<button type="button" aria-label="Previous image" data-directional-prev></button>` +
    `<button type="button" aria-label="Next image" data-directional-next></button>` +
    `${slides}</figure>`;
}
