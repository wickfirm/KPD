// ── Article autofill ─────────────────────────────────────────────────────────
// Editors of News & Blog articles only have to write the title, the body and
// pick a cover image. When they leave the summary or the cover image alt text
// empty, saving fills them in:
//
//   • With ANTHROPIC_API_KEY set, Claude writes both (it looks at the cover
//     image itself for the alt text).
//   • Without the key, or if the call fails, a plain fallback is used: the
//     summary is the opening of the body, the alt text is the article title.
//
// Anything the editor typed is never replaced, and the generated text is saved
// into the normal fields, so it can be edited like any other value afterwards.

import Anthropic from "@anthropic-ai/sdk";

/// Summary length that fits the article cards and a search description.
export const SUMMARY_MAX = 200;
/// Screen readers handle alt text best when it stays short.
export const ALT_MAX = 125;

export type AutofillInput = {
  title: string;
  body: string[];
  summary: string;
  coverImage: string | null;
  coverImageAlt: string | null;
};

export type AutofillResult = {
  summary: string;
  coverImageAlt: string | null;
  /// Which fields were written for the editor, and how.
  generated: { summary?: "ai" | "fallback"; coverImageAlt?: "ai" | "fallback" };
};

/// Claude Haiku by default (fast and inexpensive for short metadata).
/// ARTICLE_AUTOFILL_MODEL overrides it, e.g. "claude-opus-5-5".
export function autofillModel() {
  return process.env.ARTICLE_AUTOFILL_MODEL?.trim() || "claude-haiku-5-5";
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/// Cuts text to `max` characters, preferring the end of a sentence, then the
/// end of a word (with an ellipsis). Never cuts a word in half.
export function trimTo(text: string, max: number) {
  const value = clean(text);
  if (value.length <= max) return value;
  const head = value.slice(0, max);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "), head.lastIndexOf("。"));
  if (sentenceEnd >= max * 0.5) return head.slice(0, sentenceEnd + 1).trim();
  const wordEnd = head.slice(0, max - 1).lastIndexOf(" ");
  return `${(wordEnd > 0 ? head.slice(0, wordEnd) : head.slice(0, max - 1)).replace(/[\s,;:–—-]+$/, "")}…`;
}

/// Fallback summary: the opening of the article, whole sentences where possible.
export function summaryFromBody(body: string[], max = SUMMARY_MAX) {
  return trimTo(body.map(clean).filter(Boolean).join(" "), max);
}

/// Fallback alt text: the article title (the cover is chosen to illustrate it).
export function altFromTitle(title: string) {
  return trimTo(title, ALT_MAX);
}

/// Claude can only look at raster images it can reach over the internet.
export function visionImageUrl(coverImage: string | null, siteUrl = process.env.NEXT_PUBLIC_SITE_URL) {
  if (!coverImage) return null;
  let url = coverImage.trim();
  if (url.startsWith("/")) {
    if (!siteUrl) return null;
    url = `${siteUrl.replace(/\/+$/, "")}${url}`;
  }
  if (!/^https:\/\//i.test(url)) return null;
  if (/\.svg(\?|#|$)/i.test(url)) return null;
  return url;
}

const SYSTEM = [
  "You write metadata for articles on the website of Kasumigaseki Properties Development (KPD), a real estate developer in Dubai.",
  "Write in the language the article is written in. Plain text only: no markdown, no quotation marks around the result, no emoji.",
  `summary: one or two sentences, at most ${SUMMARY_MAX} characters, written in KPD's own editorial voice as a standalone teaser for the article card. State the idea itself directly, in the article's own calm, factual tone, as if KPD were saying it. Never describe the text from outside: no "This article", "The article argues", "The author", "This piece/post explores", "In this blog", "Discover how" or similar framing. Only use facts that are in the article.`,
  'Example of the voice wanted - for an article saying design restraint makes better homes, write "Restraint in materials, light and detail creates homes that feel considered for years." and not "The article argues that restraint creates better homes."',
  `alt: at most ${ALT_MAX} characters describing what the cover image actually shows, for someone who cannot see it. Do not start with "Image of" or "Photo of". If no image is attached, return an empty string.`,
].join("\n");

const SCHEMA = {
  type: "object",
  properties: { summary: { type: "string" }, alt: { type: "string" } },
  required: ["summary", "alt"],
  additionalProperties: false,
} as const;

/// True when a summary talks about the text ("The article argues…") instead
/// of saying the thing itself, which the client does not want on the cards.
export function isMetaSummary(summary: string) {
  return /\b(?:this|the|our)\s+(?:article|post|blog(?:\s+post)?|piece|write-?up)\b|\bthe\s+(?:author|writer)s?\b|^\s*(?:discover|learn|read about|find out|explore)\b/i.test(summary);
}

const META_RETRY = "Your previous summary described the text from outside (for example \"The article argues…\"). Rewrite it in KPD's own voice: state the idea directly, with no reference to an article, post, piece, author or reader.";

async function askClaude(input: AutofillInput, imageUrl: string | null, retryNote?: string): Promise<{ summary: string; alt: string }> {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  const article = `Title: ${input.title}\n\n${input.body.join("\n\n")}`;
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (imageUrl) content.push({ type: "image", source: { type: "url", url: imageUrl } });
  content.push({ type: "text", text: `${imageUrl ? "The attached image is the article's cover image.\n\n" : ""}<article>\n${article}\n</article>${retryNote ? `\n\n${retryNote}` : ""}` });

  const model = autofillModel();
  // Haiku has no server-side refusal fallback; the bigger models do.
  const fallback = model.includes("haiku") ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
  const response = await client.beta.messages.create({
    model,
    max_tokens: 4000,
    ...fallback,
    system: SYSTEM,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to write the article metadata.");
  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude returned no text.");
  const parsed = JSON.parse(text.text) as { summary?: unknown; alt?: unknown };
  return { summary: String(parsed.summary ?? ""), alt: String(parsed.alt ?? "") };
}

/// Fills an empty summary and an empty cover image alt text. Never throws: any
/// problem with the AI call falls back to the plain versions.
export async function autofillArticle(
  input: AutofillInput,
  options: { useAi?: boolean; ask?: typeof askClaude } = {},
): Promise<AutofillResult> {
  const needSummary = !clean(input.summary);
  const needAlt = Boolean(input.coverImage) && !clean(input.coverImageAlt ?? "");
  const result: AutofillResult = { summary: input.summary.trim(), coverImageAlt: input.coverImageAlt?.trim() || null, generated: {} };
  if (!needSummary && !needAlt) return result;

  const useAi = (options.useAi ?? Boolean(process.env.ANTHROPIC_API_KEY)) && (needSummary || needAlt);
  let ai: { summary: string; alt: string } | null = null;
  if (useAi) {
    const ask = options.ask ?? askClaude;
    const imageUrl = needAlt ? visionImageUrl(input.coverImage) : null;
    let sawImage = Boolean(imageUrl);
    try {
      ai = await ask(input, imageUrl);
    } catch (error) {
      sawImage = false;
      // A cover the API cannot download (private bucket, unsupported format)
      // should not cost the summary: try once more without the image.
      if (imageUrl) {
        try { ai = await ask(input, null); } catch { ai = null; }
      }
      if (!ai) console.error("[article-autofill] AI generation failed, using fallback:", error);
    }
    // Without the picture Claude cannot describe it, so its alt is not used.
    if (ai && !sawImage) ai = { ...ai, alt: "" };
  }

  if (needSummary) {
    // One corrective retry when the summary still uses "The article…"
    // framing; if it persists, the plain opening of the body is used instead.
    if (ai && isMetaSummary(ai.summary)) {
      const ask = options.ask ?? askClaude;
      try {
        const again = await ask(input, null, META_RETRY);
        ai = { ...ai, summary: isMetaSummary(again.summary) ? "" : again.summary };
      } catch {
        ai = { ...ai, summary: "" };
      }
    }
    const fromAi = ai ? trimTo(ai.summary, SUMMARY_MAX) : "";
    result.summary = fromAi || summaryFromBody(input.body) || trimTo(input.title, SUMMARY_MAX);
    result.generated.summary = fromAi ? "ai" : "fallback";
  }
  if (needAlt) {
    const fromAi = ai ? trimTo(ai.alt, ALT_MAX) : "";
    result.coverImageAlt = fromAi || altFromTitle(input.title);
    result.generated.coverImageAlt = fromAi ? "ai" : "fallback";
  }
  return result;
}
