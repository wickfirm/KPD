import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DELIVERED_FORM_WORDS, formWords, projectLabels } from "@/lib/form-words";

// The delivered script looks its forms' words up in a table the footer
// publishes. The table must cover every word the script looks up, and an
// English page must publish nothing.

const script = readFileSync(join(process.cwd(), "public/legacy/assets/js/site-cms.js"), "utf8");

describe("the words of the delivered script's forms", () => {
  it("covers every word the script looks up, and nothing it does not", () => {
    const lookedUp = [...script.matchAll(/\bsay\("([^"]+)"\)/g)].map((match) => match[1]);
    expect(lookedUp.length).toBeGreaterThan(15);
    expect([...new Set(lookedUp)].sort()).toEqual([...DELIVERED_FORM_WORDS].sort());
  });

  it("an English page publishes no table", () => {
    expect(formWords("en")).toEqual({});
  });

  it("an Arabic page carries the sheet's thank-you and refusals", () => {
    const words = formWords("ar");
    expect(words["Thank you. Your enquiry has been received."]).toBe("شكرًا لك. لقد استلمنا استفسارك.");
    expect(words["Please enter a valid phone number."]).toBeTruthy();
    // No row of its own yet: the sheet's wording for the same situation.
    expect(words["Please provide your email address."]).toBe("يُرجى إدخال بريد إلكتروني صحيح.");
    expect(words["Unable to send your enquiry."]).toBeTruthy();
    // A word with no row in any wording is left out, so the script's own shows.
    expect(words["Sending your enquiry…"]).toBeUndefined();
    expect(words["Full name"]).toBeUndefined();
  });

  it("a Japanese page carries the same in Japanese", () => {
    const words = formWords("ja");
    expect(words["Thank you. Your enquiry has been received."]).toBe("お問い合わせを受け付けました。ありがとうございます。");
    expect(words["Country code"]).toBe("国番号");
  });

  it("every entry is keyed by an English word and has another language as its value", () => {
    for (const locale of ["ar", "ja"] as const) {
      for (const [english, text] of Object.entries(formWords(locale))) {
        expect(DELIVERED_FORM_WORDS).toContain(english);
        expect(text).not.toBe(english);
        expect(text.trim()).not.toBe("");
      }
    }
  });
});

describe("development names for the delivered script's pop-up", () => {
  const english = [{ slug: "seven-x-seven", name: "seven x seven" }, { slug: "villa", name: "Villa 174" }];

  it("keys each translated name by its English one, and leaves the others out", () => {
    const shown = [{ slug: "seven-x-seven", name: "سيفن باي سيفن" }, { slug: "villa", name: "Villa 174" }];
    expect(projectLabels(english, shown)).toEqual({ "seven x seven": "سيفن باي سيفن" });
  });

  it("gives an English page nothing", () => {
    expect(projectLabels(english, english)).toEqual({});
  });
});
