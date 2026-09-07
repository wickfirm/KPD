"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="cms-login">
      <div className="cms-login-card">
        <h1>KPD CMS</h1>
        {state.error ? <p className="cms-error">{state.error}</p> : null}
        <form action={formAction}>
          <label className="cms-field">
            <span>Email</span>
            <input name="email" type="email" required autoFocus />
          </label>
          <label className="cms-field">
            <span>Password</span>
            <input name="password" type="password" required />
          </label>
          <button className="cms-btn" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
