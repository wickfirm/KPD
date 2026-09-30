"use client";

import { useActionState } from "react";
import { updateProfile, changePassword, type ProfileFormState } from "./profile-actions";

const initialState: ProfileFormState = {};

export function ProfileNameForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  return (
    <form action={formAction}>
      {state.error ? <p className="cms-error">{state.error}</p> : null}
      {state.ok ? <p className="cms-ok" role="status">{state.ok}</p> : null}
      <label className="cms-field"><span>Display name <small>(shown in the sidebar and the activity log)</small></span><input name="name" defaultValue={name} required /></label>
      <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  return (
    <form action={formAction}>
      {state.error ? <p className="cms-error">{state.error}</p> : null}
      {state.ok ? <p className="cms-ok" role="status">{state.ok}</p> : null}
      <label className="cms-field"><span>Current password</span><input name="current" type="password" required autoComplete="current-password" /></label>
      <div className="cms-grid">
        <label className="cms-field"><span>New password <small>(at least 10 characters, letters and numbers)</small></span><input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        <label className="cms-field"><span>Repeat the new password</span><input name="confirm" type="password" required minLength={10} autoComplete="new-password" /></label>
      </div>
      <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Changing…" : "Change password"}</button>
    </form>
  );
}
