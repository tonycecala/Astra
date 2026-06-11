"use client";

import { FormEvent, useState } from "react";
import { LogIn, LogOut, Sparkles, UserPlus } from "lucide-react";
import { authClient } from "../lib/auth/client";
import { ui } from "../lib/i18n";

type AuthMode = "signIn" | "signUp";

export function AuthPanel() {
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(ui.login.working);

    const response =
      mode === "signUp"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

    if (response.error) {
      setMessage(response.error.message || ui.login.authError);
      return;
    }

    setMessage(mode === "signUp" ? ui.login.checkEmail : ui.login.signedIn);
  }

  async function signOut() {
    await authClient.signOut();
    setMessage(ui.login.signedOut);
  }

  if (isPending) {
    return (
      <section className="auth-panel" aria-label={ui.login.authPanelLabel}>
        <p className="muted">{ui.login.loadingSession}</p>
      </section>
    );
  }

  if (session?.user) {
    return (
      <section className="auth-panel" aria-label={ui.login.authPanelLabel}>
        <div>
          <p className="eyebrow">{ui.login.currentSession}</p>
          <h2>{session.user.name || session.user.email}</h2>
          <p className="muted">{session.user.email}</p>
        </div>
        <button className="button secondary" type="button" onClick={signOut}>
          <LogOut aria-hidden="true" size={18} />
          {ui.login.signOut}
        </button>
        {message ? <p className="form-status">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="auth-panel" aria-label={ui.login.authPanelLabel}>
      <div className="segmented-control" aria-label={ui.login.authModeLabel}>
        <button className={mode === "signIn" ? "active" : ""} type="button" onClick={() => setMode("signIn")}>
          <LogIn aria-hidden="true" size={16} />
          {ui.login.signIn}
        </button>
        <button className={mode === "signUp" ? "active" : ""} type="button" onClick={() => setMode("signUp")}>
          <UserPlus aria-hidden="true" size={16} />
          {ui.login.signUp}
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === "signUp" ? (
          <label>
            <span>{ui.login.nameLabel}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
          </label>
        ) : null}
        <label>
          <span>{ui.login.emailLabel}</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            autoComplete="email"
          />
        </label>
        <label>
          <span>{ui.login.passwordLabel}</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            type="password"
            autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          />
        </label>
        <button className="button" type="submit">
          <Sparkles aria-hidden="true" size={18} />
          {mode === "signUp" ? ui.login.createAccount : ui.login.continue}
        </button>
      </form>
      {message ? <p className="form-status">{message}</p> : null}
    </section>
  );
}
