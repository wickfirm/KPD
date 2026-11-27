import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { MessageKey } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { DELIVERED_FORM_WORDS, formWords, interestChoices, projectLabels } from "@/lib/form-words";

// The delivered scripts look their forms' words up in a table the footer
// publishes. The table must cover every word they look up, and an English
// page must publish nothing.

const delivered = (name: string) => readFileSync(join(process.cwd(), "public/legacy/assets/js", name), "utf8");
const script = delivered("site-cms.js");
const popUp = delivered("inquiry-form-copy.js");

describe("the words of the delivered script's forms", () => {
  it("covers every word the scripts look up, and nothing they do not", () => {
    const lookedUp = [...`${script}\n${popUp}`.matchAll(/\bsay\("([^"]+)"\)/g)].map((match) => match[1]);
    expect(lookedUp.length).toBeGreaterThan(15);
    expect([...new Set(lookedUp)].sort()).toEqual([...DELIVERED_FORM_WORDS].sort());
  });

  it("the pop-up's script takes its hints from the table, never from a word of its own", () => {
    // inquiry-form-copy.js rewrites the form the first script built, hint by hint.
    expect(popUp).not.toMatch(/setAttribute\("placeholder", "/);
    for (const word of ["Full name", "Email address", "Phone number", "Message", "Interested in"]) expect(popUp, word).toContain(`say("${word}")`);
    expect(popUp).toContain("copy.interestChoices");
  });

  it("an English page publishes no table", () => {
    expect(formWords("en")).toEqual({});
  });

  it("an Arabic page carries the thank-you and the refusals", () => {
    const words = formWords("ar");
    expect(words["Thank you. Your enquiry has been received."]).toBe("شكرًا لك. لقد استلمنا استفسارك.");
    expect(words["Please enter a valid phone number."]).toBeTruthy();
    // A row of its own since the lists were translated; until then it fell back
    // on the sheet's wording for an invalid address.
    expect(words["Please provide your email address."]).toBe("يُرجى إدخال بريدك الإلكتروني.");
    expect(words["Unable to send your enquiry."]).toBeTruthy();
    expect(words["Sending your enquiry…"]).toBe("جارٍ إرسال استفسارك…");
    expect(words["Full name"]).toBe("الاسم الكامل");
  });

  it("leaves out a word the translation leaves out, so the script's own shows", async () => {
    // Every word has a translation now, so one is taken away for this.
    vi.resetModules();
    vi.doMock("@/lib/i18n", async (original) => {
      const actual = await original<typeof import("@/lib/i18n")>();
      // The message's helper answers English for that one message.
      return {
        ...actual,
        formMessage: (locale: Locale, english: string, key: MessageKey, fallback?: MessageKey) => (key === "form.sending" ? english : actual.formMessage(locale, english, key, fallback)),
      };
    });
    try {
      const { formWords: withAGap } = await import("@/lib/form-words");
      const words = withAGap("ar");
      expect(words["Sending your enquiry…"]).toBeUndefined();
      expect(words["Thank you. Your enquiry has been received."]).toBe("شكرًا لك. لقد استلمنا استفسارك.");
    } finally {
      vi.doUnmock("@/lib/i18n");
    }
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

describe("the enquiry pop-up's choices", () => {
  it("are the interests saved in Site settings: the English is posted, the language is shown", () => {
    const saved = { popupInterests: ["Online Call", "Investing"] };
    const shown = { popupInterests: ["مكالمة عبر الإنترنت", "الاستثمار"] };
    expect(interestChoices(saved, shown)).toEqual([{ value: "Online Call", label: "مكالمة عبر الإنترنت" }, { value: "Investing", label: "الاستثمار" }]);
  });

  it("show the English where the language has no label of its own", () => {
    expect(interestChoices({ popupInterests: ["Online Call"] }, { popupInterests: [] })).toEqual([{ value: "Online Call", label: "Online Call" }]);
    expect(interestChoices({ popupInterests: ["Online Call", "Investing"] }, { popupInterests: ["مكالمة عبر الإنترنت"] })).toEqual([
      { value: "Online Call", label: "مكالمة عبر الإنترنت" },
      { value: "Investing", label: "Investing" },
    ]);
  });

  it("are each published development and then the script's own four where none are saved", () => {
    const developments = [{ name: "seven x seven" }, { name: "Villa 174" }];
    const shown = [{ name: "سيفن باي سيفن" }, { name: "Villa 174" }];
    expect(interestChoices({}, {}, developments, shown)).toEqual([
      { value: "seven x seven", label: "سيفن باي سيفن" },
      { value: "Villa 174", label: "Villa 174" },
      { value: "Online Call", label: "Online Call" },
      { value: "Customer Experience Centre Visit", label: "Customer Experience Centre Visit" },
      { value: "Investing", label: "Investing" },
      { value: "Broker Partnership", label: "Broker Partnership" },
    ]);
  });
});
