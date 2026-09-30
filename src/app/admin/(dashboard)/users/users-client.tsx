"use client";

import { useActionState } from "react";
import { createUser, resetUserPassword, type UserFormState } from "./user-actions";

const initialState: UserFormState = {};

/// "Add a team member" form. The password is shared once, in person — the new
/// teammate changes it from My profile after signing in.
export function UserCreateForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  return (
    <form action={formAction}>
      {state.error ? <p className="cms-error">{state.error}</p> : null}
      <div className="cms-grid">
        <label className="cms-field"><span>Name</span><input name="name" required placeholder="e.g. Sara Habib" /></label>
        <label className="cms-field"><span>Email <small>(this becomes their sign-in name)</small></span><input name="email" type="email" required placeholder="name@kpd.ae" /></label>
        <label className="cms-field"><span>Temporary password</span><input name="password" type="password" required minLength={10} placeholder="At least 10 characters" /></label>
        <label className="cms-field"><span>Access level</span>
          <select name="role" defaultValue="EDITOR">
            <option value="EDITOR">Editor — writes and publishes content</option>
            <option value="ADMIN">Administrator — full control, including the team</option>
          </select>
        </label>
      </div>
      <div className="cms-actions">
        <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
      </div>
    </form>
  );
}

/// Per-row password reset. Lives inside a <details> so the table stays calm.
export function UserPasswordForm({ userId, name }: { userId: string; name: string }) {
  const [state, formAction, pending] = useActionState(resetUserPassword, initialState);
  return (
    <details className="cms-row-details">
      <summary>Set new password</summary>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        {state.error ? <p className="cms-error">{state.error}</p> : null}
        <div className="cms-grid">
          <label className="cms-field"><span>New password for {name.split(" ")[0]}</span><input name="password" type="password" required minLength={10} /></label>
          <label className="cms-field"><span>Repeat it</span><input name="confirm" type="password" required minLength={10} /></label>
        </div>
        <button className="cms-btn cms-btn--small" type="submit" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
      </form>
    </details>
  );
}
