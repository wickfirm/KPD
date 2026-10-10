// ── Module rows ⇄ stored content ──────────────────────────────────────────────

/// One editor row ("Label | Value | Image | Link") as a stored item. Keeps every
/// field the editor collects — renderers read what they need. (Floor plans
/// previously lost their "Detail" text here.)
export function parseItemRow(line: string) {
  const [label = "", value = "", image = "", url = ""] = line.split("|").map((part) => part.trim());
  return { label, value, ...(image ? { image } : {}), ...(url ? { url } : {}) };
}

/// A gallery caption belongs to the image at the same position (the public page
/// reads items[i].label as the caption of images[i]). Rows are paired first and
/// only then are blank images dropped, so removing or leaving out an image can
/// never shift the captions of the others. Trailing empty captions are trimmed
/// to keep the stored JSON minimal.
export function pairedGalleryContent(imagesField: string, itemsField: string) {
  const rawImages = imagesField.split(/\r?\n/);
  const rawItems = itemsField.split(/\r?\n/);
  const pairs = rawImages
    .map((image, index) => ({ image: image.trim(), item: parseItemRow(rawItems[index] ?? "") }))
    .filter((pair) => pair.image);
  const items = pairs.map((pair) => pair.item);
  while (items.length && !Object.values(items[items.length - 1]).some(Boolean)) items.pop();
  return { images: pairs.map((pair) => pair.image), items };
}
