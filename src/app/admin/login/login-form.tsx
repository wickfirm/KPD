"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="cms-login">
      <div className="cms-login-card">
        <span className="cms-eyebrow">KPD CMS</span>
        <h1>Welcome back</h1>
        <p className="cms-muted">Sign in with your KPD account to update the website.</p>
        {state.error ? <p className="cms-error">{state.error}</p> : null}
        <form action={formAction}>
          <label className="cms-field">
            <span>Email</span>
            <input name="email" type="email" required autoFocus autoComplete="email" />
          </label>
          <label className="cms-field">
            <span>Password</span>
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="cms-btn" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="cms-login-help">Forgot your password? Ask a CMS administrator to set a new one for you.</p>
      </div>
    </div>
  );
}
