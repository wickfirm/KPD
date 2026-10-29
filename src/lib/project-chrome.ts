import type { TextStyle } from "./text-style";
import { cleanTextStyle } from "./text-style";

/// Presentation choices for a development that do not belong on the project
/// row: the introduction button, and the type for the name, headline and intro.
export type ProjectChrome = {
  ctaLabel?: string;
  ctaUrl?: string;
  ctaVisible?: boolean;
  nameStyle?: TextStyle;
  taglineStyle?: TextStyle;
  descriptionStyle?: TextStyle;
};

export const projectChromeKey = (id: string) => `project-chrome:${id}`;

export function parseProjectChrome(value: unknown): ProjectChrome {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const ctaLabel = typeof source.ctaLabel === "string" ? source.ctaLabel.trim() : "";
  const ctaUrl = typeof source.ctaUrl === "string" ? source.ctaUrl.trim() : "";
  return {
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaUrl ? { ctaUrl } : {}),
    ...(source.ctaVisible === false ? { ctaVisible: false } : {}),
    ...(cleanTextStyle(source.nameStyle) ? { nameStyle: cleanTextStyle(source.nameStyle) } : {}),
    ...(cleanTextStyle(source.taglineStyle) ? { taglineStyle: cleanTextStyle(source.taglineStyle) } : {}),
    ...(cleanTextStyle(source.descriptionStyle) ? { descriptionStyle: cleanTextStyle(source.descriptionStyle) } : {}),
  };
}
