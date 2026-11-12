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
  /// Gallery-light "Book a viewing" button beside Download brochure. Absent
  /// values follow the private viewing band's first button (enquirePrimary*).
  bookLabel?: string;
  bookUrl?: string;
  enquireVisible?: boolean;
  enquireEyebrow?: string;
  enquireHeading?: string;
  enquireText?: string;
  enquireImage?: string;
  enquirePrimaryLabel?: string;
  enquirePrimaryUrl?: string;
  enquireSecondaryLabel?: string;
  enquireSecondaryUrl?: string;
  /// Gallery-light key facts under the hero, one "Label | value" per line.
  /// Absent means the approved defaults; an empty string hides the row.
  keyFacts?: string;
  /// Absent means the published development still appears in the homepage cards.
  showOnHomepage?: boolean;
  /// Slot of the shared calculator among the content sections. Missing means last.
  calculatorIndex?: number;
  nameStyle?: TextStyle;
  taglineStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  /// Small labels on the gallery-light page. Absent means the approved
  /// wording; an empty string hides that label.
  labels?: ProjectPageLabels;
};

export type ProjectPageLabels = { overview?: string; driveNote?: string; calculator?: string; subnavCta?: string };
export const projectPageLabelDefaults = { overview: "Overview", driveNote: "Drive times from {name}", calculator: "Mortgage calculator", subnavCta: "Enquire" } as const;

/// Keeps only string labels, so a hidden ("") label survives but junk does not.
function parsePageLabels(value: unknown): ProjectPageLabels | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const labels: ProjectPageLabels = {};
  for (const key of Object.keys(projectPageLabelDefaults) as (keyof ProjectPageLabels)[]) {
    if (typeof source[key] === "string") labels[key] = (source[key] as string).trim();
  }
  return Object.keys(labels).length ? labels : undefined;
}

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
  const bookLabel = typeof source.bookLabel === "string" ? source.bookLabel.trim() : "";
  const bookUrl = typeof source.bookUrl === "string" ? source.bookUrl.trim() : "";
  const enquireEyebrow = typeof source.enquireEyebrow === "string" ? source.enquireEyebrow.trim() : "";
  const enquireHeading = typeof source.enquireHeading === "string" ? source.enquireHeading.trim() : "";
  const enquireText = typeof source.enquireText === "string" ? source.enquireText.trim() : "";
  const enquireImage = typeof source.enquireImage === "string" ? source.enquireImage.trim() : "";
  const enquirePrimaryLabel = typeof source.enquirePrimaryLabel === "string" ? source.enquirePrimaryLabel.trim() : "";
  const enquirePrimaryUrl = typeof source.enquirePrimaryUrl === "string" ? source.enquirePrimaryUrl.trim() : "";
  const enquireSecondaryLabel = typeof source.enquireSecondaryLabel === "string" ? source.enquireSecondaryLabel.trim() : "";
  const enquireSecondaryUrl = typeof source.enquireSecondaryUrl === "string" ? source.enquireSecondaryUrl.trim() : "";
  const keyFacts = typeof source.keyFacts === "string" ? source.keyFacts.replace(/\r\n/g, "\n").trim() : undefined;
  const calculatorIndex = typeof source.calculatorIndex === "number" && Number.isInteger(source.calculatorIndex) ? source.calculatorIndex : undefined;
  return {
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaUrl ? { ctaUrl } : {}),
    ...(source.ctaVisible === false ? { ctaVisible: false } : {}),
    ...(brochureLabel ? { brochureLabel } : {}),
    ...(brochureUrl ? { brochureUrl } : {}),
    ...(source.brochureVisible === false ? { brochureVisible: false } : {}),
    ...(bookLabel ? { bookLabel } : {}),
    ...(bookUrl ? { bookUrl } : {}),
    ...(source.enquireVisible === false ? { enquireVisible: false } : {}),
    ...(enquireEyebrow ? { enquireEyebrow } : {}),
    ...(enquireHeading ? { enquireHeading } : {}),
    ...(enquireText ? { enquireText } : {}),
    ...(enquireImage ? { enquireImage } : {}),
    ...(enquirePrimaryLabel ? { enquirePrimaryLabel } : {}),
    ...(enquirePrimaryUrl ? { enquirePrimaryUrl } : {}),
    ...(enquireSecondaryLabel ? { enquireSecondaryLabel } : {}),
    ...(enquireSecondaryUrl ? { enquireSecondaryUrl } : {}),
    ...(keyFacts !== undefined ? { keyFacts } : {}),
    ...(source.showOnHomepage === false ? { showOnHomepage: false } : {}),
    ...(calculatorIndex !== undefined && calculatorIndex >= 0 ? { calculatorIndex } : {}),
    ...(cleanTextStyle(source.nameStyle) ? { nameStyle: cleanTextStyle(source.nameStyle) } : {}),
    ...(cleanTextStyle(source.taglineStyle) ? { taglineStyle: cleanTextStyle(source.taglineStyle) } : {}),
    ...(cleanTextStyle(source.descriptionStyle) ? { descriptionStyle: cleanTextStyle(source.descriptionStyle) } : {}),
    ...(parsePageLabels(source.labels) ? { labels: parsePageLabels(source.labels) } : {}),
  };
}
