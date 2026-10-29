import type { TextStyle } from "./text-style";
import { cleanTextStyle } from "./text-style";

/// Presentation choices for a development that do not belong on the project
/// row: the introduction button, and the type for the name, headline and intro.
export type ProjectChrome = {
  ctaLabel?: string;
  ctaUrl?: string;
  ctaVisible?: boolean;
  brochureLabel?: string;
  brochureUrl?: string;
  brochureVisible?: boolean;
  /// Slot of the shared calculator among the content sections. Missing means last.
  calculatorIndex?: number;
  nameStyle?: TextStyle;
  taglineStyle?: TextStyle;
  descriptionStyle?: TextStyle;
};

export const projectChromeKey = (id: string) => `project-chrome:${id}`;

/// The calculator sits among the content sections. An omitted index means last.
export function calculatorSlot(moduleCount: number, calculatorIndex?: number) {
  if (typeof calculatorIndex !== "number" || !Number.isInteger(calculatorIndex)) return moduleCount;
  return Math.max(0, Math.min(moduleCount, calculatorIndex));
}

export function developmentSlots<T>(modules: T[], calculatorIndex?: number): Array<T | "calculator"> {
  const index = calculatorSlot(modules.length, calculatorIndex);
  return [...modules.slice(0, index), "calculator", ...modules.slice(index)];
}

export function parseProjectChrome(value: unknown): ProjectChrome {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const ctaLabel = typeof source.ctaLabel === "string" ? source.ctaLabel.trim() : "";
  const ctaUrl = typeof source.ctaUrl === "string" ? source.ctaUrl.trim() : "";
  const brochureLabel = typeof source.brochureLabel === "string" ? source.brochureLabel.trim() : "";
  const brochureUrl = typeof source.brochureUrl === "string" ? source.brochureUrl.trim() : "";
  const calculatorIndex = typeof source.calculatorIndex === "number" && Number.isInteger(source.calculatorIndex) ? source.calculatorIndex : undefined;
  return {
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaUrl ? { ctaUrl } : {}),
    ...(source.ctaVisible === false ? { ctaVisible: false } : {}),
    ...(brochureLabel ? { brochureLabel } : {}),
    ...(brochureUrl ? { brochureUrl } : {}),
    ...(source.brochureVisible === false ? { brochureVisible: false } : {}),
    ...(calculatorIndex !== undefined && calculatorIndex >= 0 ? { calculatorIndex } : {}),
    ...(cleanTextStyle(source.nameStyle) ? { nameStyle: cleanTextStyle(source.nameStyle) } : {}),
    ...(cleanTextStyle(source.taglineStyle) ? { taglineStyle: cleanTextStyle(source.taglineStyle) } : {}),
    ...(cleanTextStyle(source.descriptionStyle) ? { descriptionStyle: cleanTextStyle(source.descriptionStyle) } : {}),
  };
}
