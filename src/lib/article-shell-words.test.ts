import { describe, expect, it } from "vitest";
import { getArticleShell } from "./news-shell";
import { articleShellWords } from "./article-shell-words";
import { localizeShellWords } from "./shell-words";

// What the delivered shell shows that is not the site's own wording: the three
// developments of the delivered markup (the site lists the CMS's in their
// place, each named in the page's language) and the newsletter form's name,
// which the localized footer keeps in English too.
const NOT_WORDS = ["Seven X Seven", "Emerald Villa", "Dubai Hills Mansion", "Seven X Seven Residences", "Email Form"];
/// A word as it reads, whoever writes it: the list gives its words that way.
const read = (word: string) => word.replace(/&copy;/g, "©").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
/// Every word the shell shows: each text node that has a letter in it, and
/// each attribute that says a word aloud or shows it as a hint.
const shownWords = (html: string) => [
  ...[...html.matchAll(/>([^<>]+)</g)].map((match) => match[1]),
  ...[...html.matchAll(/\s(?:aria-label|alt|placeholder|title|value)="([^"]*)"/g)].map((match) => match[1]),
].map(read).filter((word) => /[A-Za-z©]/.test(word));
/// The markup without its words.
const frame = (html: string) => html.replace(/>[^<>]+</g, "><").replace(/\s(?:aria-label|alt|placeholder|title|value)="[^"]*"/g, "");
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("the words of the delivered article shell", () => {
  const { beforeMain, afterMain } = getArticleShell();
  const shell = `${beforeMain}${afterMain}`;

  it("are all known: each word the delivered shell shows is in the list", () => {
    const listed = new Set(articleShellWords("en", {}).map((word) => read(word.english)));
    expect(shownWords(shell).filter((word) => !listed.has(word) && !NOT_WORDS.includes(word))).toEqual([]);
  });

  it.each(["ar", "ja"] as const)("are replaced in %s, and nothing else in the shell moves", (locale) => {
    const words = articleShellWords(locale, {});
    const out = localizeShellWords(shell, locale, words);
    expect(frame(out)).toBe(frame(shell));
    // Read the same way, no word of the list is left where it was.
    const still = words.filter(({ english, text }) => {
      const word = escapeRegExp(english.trim());
      return text !== english && (shownWords(out).some((shown) => new RegExp(`^${word}$`).test(shown)));
    });
    expect(still.map((word) => word.english)).toEqual([]);
    for (const name of NOT_WORDS.filter((word) => word !== "Email Form")) expect(out).toContain(name);
  });

  it("keeps the delivered word where the editor saved nothing the localized shell follows", () => {
    const words = articleShellWords("ja", {});
    expect(words.find((word) => word.english === "Book online call")?.text).toBe("Book online call");
    expect(words.find((word) => word.english === "Submit")?.text).toBe("Submit");
    const saved = articleShellWords("ja", { headerCtaLabel: " オンライン通話を予約 ", newsletterSubmitLabel: "登録" });
    expect(saved.find((word) => word.english === "Book online call")?.text).toBe("オンライン通話を予約");
    expect(saved.find((word) => word.english === "Submit")?.text).toBe("登録");
  });
});
