import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password-rules";

describe("passwordProblem", () => {
  it("accepts a long enough mixed password", () => {
    expect(passwordProblem("correct horse 91")).toBeNull();
  });

  it(`rejects passwords shorter than ${MIN_PASSWORD_LENGTH} characters`, () => {
    expect(passwordProblem("ab1")).toBe(`Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
    expect(passwordProblem("".padEnd(MIN_PASSWORD_LENGTH - 1, "a1"))).toContain("at least");
  });

  it("rejects letters-only and digits-only passwords", () => {
    expect(passwordProblem("onlyletterspassword")).toContain("Mix letters and numbers");
    expect(passwordProblem("1234567890123")).toContain("Mix letters and numbers");
  });

  it("only accepts ASCII letters — unicode letters still trigger the mix warning", () => {
    // /[a-zA-Z]/ is ASCII-only: Cyrillic letters plus digits are rejected.
    expect(passwordProblem("пароль12345")).toContain("Mix letters and numbers");
  });
});
