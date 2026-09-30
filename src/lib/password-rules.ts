// Shared password policy for the CMS (team management + self-service profile).
// Lives outside "use server" files because those may only export async actions.
export const MIN_PASSWORD_LENGTH = 10;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Mix letters and numbers so the password is harder to guess.";
  }
  return null;
}
