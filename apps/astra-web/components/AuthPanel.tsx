"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound, LogOut, Mail, Sparkles } from "lucide-react";
import { authClient } from "../lib/auth/client";
import { ui } from "../lib/i18n";

type AuthStep = "email" | "code";

export function AuthPanel() {
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState<AuthStep>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(ui.login.working);

    const response = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in"
    });

    if (response.error) {
      setMessage(response.error.message || ui.login.authError);
      return;
    }

    setStep("code");
    setMessage(ui.login.checkEmail);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(ui.login.working);

    const response = await authClient.signIn.emailOtp({
      email,
      otp: code,
      name: name || email
    });

    if (response.error) {
      setMessage(response.error.message || ui.login.authError);
      return;
    }

    setMessage(ui.login.signedIn);
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
        <div className="auth-actions">
          <Link className="button" href="/self">
            <Sparkles aria-hidden="true" size={18} />
            {ui.login.continueToSelf}
          </Link>
          <Link className="button secondary" href="/journey">
            {ui.login.openJourney}
          </Link>
          <button className="button secondary" type="button" onClick={signOut}>
            <LogOut aria-hidden="true" size={18} />
            {ui.login.signOut}
          </button>
        </div>
        {message ? <p className="form-status">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="auth-panel" aria-label={ui.login.authPanelLabel}>
      <div>
        <p className="eyebrow">{ui.login.codeFlowEyebrow}</p>
        <h2>{step === "email" ? ui.login.codeFlowTitle : ui.login.verifyCodeTitle}</h2>
      </div>

      {step === "email" ? (
        <form className="auth-form" onSubmit={sendCode}>
          <label>
            <span>{ui.login.nameLabel}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
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
          <button className="button" type="submit">
            <Mail aria-hidden="true" size={18} />
            {ui.login.sendCode}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={verifyCode}>
          <p className="form-status">{ui.login.codeSentTo(email)}</p>
          <label>
            <span>{ui.login.codeLabel}</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
            />
          </label>
          <button className="button" type="submit">
            <Sparkles aria-hidden="true" size={18} />
            {ui.login.verifyCode}
          </button>
          <button className="button secondary" type="button" onClick={() => setStep("email")}>
            <KeyRound aria-hidden="true" size={18} />
            {ui.login.useDifferentEmail}
          </button>
        </form>
      )}
      {message ? <p className="form-status">{message}</p> : null}
    </section>
  );
}
