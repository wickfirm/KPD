/// Splits a line of a legal document into the parts the page leaves as plain
/// text and the ones it makes interactive: a web address, an email address,
/// and — where `privacy` is given — the words that name the Privacy Policy,
/// which open that tab. The caller gives those words only for the lines whose
/// English holds them: elsewhere a document may speak of someone else's policy.
export function richParts(value: string, privacy: string | null): string[] {
  const link = "https?:\\/\\/[^\\s]+|[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}";
  const word = privacy?.trim() ? `|${privacy.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` : "";
  return value.split(new RegExp(`(${link}${word})`, "g"));
}
