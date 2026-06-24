"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { authClient } from "../lib/auth/client";
import { ui } from "../lib/i18n";

type AuthStep = "email" | "code";

function subscribeToClientReady() {
  return () => {};
}

function clientReady() {
  return true;
}

function serverNotReady() {
  return false;
}

export function AuthPanel() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribeToClientReady, clientReady, serverNotReady);
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
    router.refresh();
  }

  if (!mounted || isPending) {
    return (
      <section className="loginPanel" aria-label={ui.login.authPanelLabel}>
        <p className="loginStatus loginStatus-loading">{ui.login.loadingSession}</p>
      </section>
    );
  }

  if (session?.user) {
    return (
      <section className="loginSignedIn" aria-label={ui.login.authPanelLabel}>
        <p className="loginKicker">{ui.login.currentSession}</p>
        <h2 className="loginStatusTitle loginStatusBold">
          {session.user.name || session.user.email}
        </h2>
        <p className="loginEmailText">{session.user.email}</p>
        <div className="loginUserDivider" />
        <div className="loginSignedInActions loginActions">
          <Link className="loginPrimaryAction" href="/self">
            {ui.login.continueToSelf}
          </Link>
          <Link className="loginSecondaryAction" href="/journey">
            {ui.login.openJourney}
          </Link>
          <button className="loginSecondaryAction" type="button" onClick={signOut}>
            {ui.login.signOut}
          </button>
        </div>
        {message ? <p className="loginStatus loginStatus-success">{message}</p> : null}
      </section>
    );
  }

  return (
      <section aria-label={ui.login.authPanelLabel}>
      <form
        className="loginPanel"
        onSubmit={step === "email" ? sendCode : verifyCode}
      >
        <label className="loginField">
          <span>{ui.login.nameLabel}</span>
          <input
            id="login-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </label>

        <label className="loginField">
          <span>{ui.login.emailLabel}</span>
          <input
            id="login-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            autoComplete="email"
          />
        </label>

        {step === "code" ? (
          <label className="loginField" key="code-field">
            <span>{ui.login.codeLabel}</span>
            <input
              id="login-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
            />
          </label>
        ) : null}

        {step === "code" ? (
          <p className="loginStatus loginStatus-success">{ui.login.codeSentTo(email)}</p>
        ) : null}

        <div className="loginActions">
          <button className="loginPrimaryAction" type="submit">
            {step === "email" ? ui.login.sendCode : ui.login.verifyCode}
          </button>
        </div>
        {step === "code" ? (
          <button
            className="loginTextAction"
            type="button"
            onClick={() => setStep("email")}
          >
            {ui.login.useDifferentEmail}
          </button>
        ) : null}
      </form>

      {message ? <p className="loginStatus">{message}</p> : null}
    </section>
  );
}
