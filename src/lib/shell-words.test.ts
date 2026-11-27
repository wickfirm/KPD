import { describe, expect, it } from "vitest";
import { localizeShellWords, newsletterEmailLabel } from "./shell-words";

const words = [
  { english: "Home", text: "ホーム" },
  { english: "Privacy", text: "プライバシー" },
  { english: "News & Updates", text: "ニュース＆最新情報" },
  { english: "Email Address", text: "メールアドレス" },
];
const html = '<nav><a href="/">Home</a></nav><p>\n  Home\n</p><ul><li>Home</li><li>Hometown</li><li>Privacy Policy</li><li>Privacy</li></ul><input placeholder="Email Address" aria-label="Home"><a href="/x">News &amp; Updates</a><span data-x="Home">Home page</span>';

describe("localizeShellWords", () => {
  it("gives an English page its shell back untouched", () => {
    expect(localizeShellWords(html, "en", words)).toBe(html);
  });

  it("replaces a word that is alone in its text node, and the markup around it stays", () => {
    expect(localizeShellWords(html, "ja", words)).toBe('<nav><a href="/">ホーム</a></nav><p>ホーム</p><ul><li>ホーム</li><li>Hometown</li><li>Privacy Policy</li><li>プライバシー</li></ul><input placeholder="メールアドレス" aria-label="ホーム"><a href="/x">ニュース＆最新情報</a><span data-x="Home">Home page</span>');
  });

  it("leaves a word alone that is part of a longer text, or sits in an attribute that shows nothing", () => {
    const out = localizeShellWords(html, "ja", words);
    expect(out).toContain("<li>Hometown</li>");
    expect(out).toContain("<li>Privacy Policy</li>");
    expect(out).toContain('<span data-x="Home">Home page</span>');
  });

  it("escapes what a translation could break the markup with", () => {
    expect(localizeShellWords('<a href="/">Home</a><input placeholder="Home">', "ja", [{ english: "Home", text: 'A & B <b "x">' }])).toBe('<a href="/">A &amp; B &lt;b &quot;x&quot;&gt;</a><input placeholder="A &amp; B &lt;b &quot;x&quot;&gt;">');
  });

  it("leaves a word alone whose other language is the same word, or nothing", () => {
    expect(localizeShellWords("<li>Home</li><li>Privacy</li>", "ja", [{ english: "Home", text: "Home" }, { english: "Privacy", text: "  " }])).toBe("<li>Home</li><li>Privacy</li>");
  });
});

describe("newsletterEmailLabel", () => {
  it("is the delivered wording in English, and the client's translators' in another language", () => {
    expect(newsletterEmailLabel("en")).toBe("Email Address");
    expect(newsletterEmailLabel("ja")).not.toMatch(/[A-Za-z]/);
    expect(newsletterEmailLabel("ar")).not.toMatch(/[A-Za-z]/);
  });
});
