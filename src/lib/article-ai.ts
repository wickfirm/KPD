// ── Article "Generate with AI" ───────────────────────────────────────────────
// The News & Blog article editor has a "Generate with AI" button next to the
// Title, Summary and Cover image alt text. Each click asks Claude for a fresh
// suggestion written from the article body (and, for the alt text, from the
// cover image itself) and puts it in the field without saving. Editors can
// click again for another version and only save the one they like.
//
// Needs ANTHROPIC_API_KEY. ARTICLE_AI_MODEL (or the older ARTICLE_AUTOFILL_MODEL)
// picks the model; Claude Haiku is the default.

import Anthropic from "@anthropic-ai/sdk";

export type ArticleAiField = "title" | "summary" | "alt";

export const TITLE_MAX = 80;
/// Summary length that fits the article cards and a search description.
export const SUMMARY_MAX = 200;
/// Screen readers handle alt text best when it stays short.
export const ALT_MAX = 125;

export type ArticleAiInput = {
  title: string;
  body: string[];
  coverImage: string | null;
  /// What is in the field now; a regenerate is asked to differ from it.
  current: string;
};

export type ArticleAiResult = { text?: string; error?: string };

export function articleAiModel() {
  return process.env.ARTICLE_AI_MODEL?.trim() || process.env.ARTICLE_AUTOFILL_MODEL?.trim() || "claude-haiku-5-5";
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

/// Plain summary used when an article is saved with the Summary left empty
/// (no AI): the opening of the body, whole sentences where possible.
export function summaryFromBody(body: string[], max = SUMMARY_MAX) {
  return trimTo(body.map(clean).filter(Boolean).join(" "), max);
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

/// True when a summary talks about the text ("The article argues…") instead
/// of saying the thing itself, which the client does not want on the cards.
export function isMetaSummary(summary: string) {
  return /\b(?:this|the|our)\s+(?:article|post|blog(?:\s+post)?|piece|write-?up)\b|\bthe\s+(?:author|writer)s?\b|^\s*(?:discover|learn|read about|find out|explore)\b/i.test(summary);
}

/// Strips what models sometimes wrap a one-line answer in.
export function tidy(text: string) {
  return clean(text).replace(/^(?:title|summary|alt(?: text)?)\s*:\s*/i, "").replace(/^["'“”‘’«]+|["'“”‘’»]+$/g, "").trim();
}

const VOICE = "You write for the website of Kasumigaseki Properties Development (KPD), a real estate developer in Dubai. Write in the language the article is written in. Reply with the requested text only: no quotation marks, labels, markdown, emoji or explanation.";

const BRIEFS: Record<ArticleAiField, string> = {
  title: `Write a headline for this article, at most ${TITLE_MAX} characters. Short, calm and precise, in title case, like "Quiet Architecture" or "What Makes Yield Durable". No clickbait, no colon-subtitle unless needed, no full stop.`,
  summary: `Write the summary shown on the article card and used as the search description: one or two sentences, at most ${SUMMARY_MAX} characters, in KPD's own editorial voice. State the idea itself directly, in the article's calm, factual tone, as if KPD were saying it. Never describe the text from outside: no "This article", "The article argues", "The author", "This piece/post explores", "In this blog", "Discover how" or similar. Only use facts in the article. Example: for an article saying design restraint makes better homes, write "Restraint in materials, light and detail creates homes that feel considered for years." and not "The article argues that restraint creates better homes."`,
  alt: `Write alt text for the attached cover image, at most ${ALT_MAX} characters: describe what the image actually shows, for someone who cannot see it, using the article only for context (names of places or buildings it mentions). Do not start with "Image of" or "Photo of".`,
};

const LIMITS: Record<ArticleAiField, number> = { title: TITLE_MAX, summary: SUMMARY_MAX, alt: ALT_MAX };

export type AskClaude = (prompt: { system: string; text: string; imageUrl: string | null }) => Promise<string>;

const askClaude: AskClaude = async ({ system, text, imageUrl }) => {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (imageUrl) content.push({ type: "image", source: { type: "url", url: imageUrl } });
  content.push({ type: "text", text });
  const model = articleAiModel();
  // Haiku has no server-side refusal fallback; the bigger models do.
  const fallback = model.includes("haiku") ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
  const response = await client.beta.messages.create({
    model,
    max_tokens: 4000,
    ...fallback,
    system,
    output_config: { effort: "low" },
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new Error("refused");
  const block = response.content.find((part) => part.type === "text");
  return block && block.type === "text" ? block.text : "";
};

/// One fresh suggestion for one field. Returns a message for the editor
/// instead of throwing.
export async function generateArticleField(
  field: ArticleAiField,
  input: ArticleAiInput,
  options: { ask?: AskClaude; hasKey?: boolean } = {},
): Promise<ArticleAiResult> {
  const body = input.body.map(clean).filter(Boolean);
  if (!body.length) return { error: "The body section is empty. Write the article body first, then generate." };
  if (!(options.hasKey ?? Boolean(process.env.ANTHROPIC_API_KEY))) return { error: "AI writing is not set up yet (ANTHROPIC_API_KEY is missing on the server)." };

  let imageUrl: string | null = null;
  if (field === "alt") {
    if (!input.coverImage?.trim()) return { error: "Add a cover image first, then generate its alt text." };
    imageUrl = visionImageUrl(input.coverImage);
    if (!imageUrl) return { error: "This cover image cannot be read by the AI (SVG files and links that are not public https are not supported). Please write the alt text by hand." };
  }

  const ask = options.ask ?? askClaude;
  const current = clean(input.current);
  const article = `<article>\n${input.title.trim() ? `Title: ${input.title.trim()}\n\n` : ""}${body.join("\n\n")}\n</article>`;
  const parts = [imageUrl ? "The attached image is the article's cover image." : "", article, BRIEFS[field]];
  if (current) parts.push(`The field currently says: "${current}". Write a different version.`);

  try {
    let text = tidy(await ask({ system: VOICE, text: parts.filter(Boolean).join("\n\n"), imageUrl }));
    if (field === "summary" && isMetaSummary(text)) {
      parts.push(`Your previous answer was "${text}", which describes the text from outside. Rewrite it in KPD's own voice: state the idea directly, with no reference to an article, post, piece, author or reader.`);
      text = tidy(await ask({ system: VOICE, text: parts.filter(Boolean).join("\n\n"), imageUrl: null }));
      if (isMetaSummary(text)) return { error: "The AI kept writing \"The article…\". Please try again." };
    }
    text = trimTo(text, LIMITS[field]);
    if (!text) return { error: "The AI returned nothing. Please try again." };
    return { text };
  } catch (error) {
    console.error(`[article-ai] ${field} generation failed:`, error);
    if (error instanceof Anthropic.APIError && error.status === 400 && imageUrl) return { error: "The AI could not open the cover image. Please write the alt text by hand or try another image." };
    return { error: "The AI could not write this right now. Please try again in a moment." };
  }
}
