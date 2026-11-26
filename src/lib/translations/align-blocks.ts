// ─────────────────────────────────────────────────────────────────────────────
// Lines up what an editor shows with what a page has saved. Pure.
//
// A page's translation is stored block by block, by position: the first
// entry belongs to the first saved block, and so on. An editor cannot always
// show every saved block — History and Contact have no body box, so a
// paragraph saved there is not in their form. A translation made from the
// form must still be filed under the saved block it belongs to, or it lands
// one block too early and is refused on the page.
// ─────────────────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/// The same kind of block (hero, paragraph, about…) in the order the lists
/// have them. A block with no counterpart of its kind is paired with itself:
/// there is nothing in the form for it, so nothing can be translated.
export function alignToSaved<T>(saved: readonly T[], shown: readonly T[]): T[] {
  const pool = [...shown];
  return saved.map((block) => {
    const type = isRecord(block) ? block.type : undefined;
    const index = pool.findIndex((candidate) => (isRecord(candidate) ? candidate.type : undefined) === type);
    return index === -1 ? block : (pool.splice(index, 1)[0] as T);
  });
}
